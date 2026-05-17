import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function readEnv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

function nextWeekdayIso() {
  const d = new Date();
  for (let i = 1; i <= 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    const day = x.getDay();
    if (day >= 1 && day <= 5) {
      return x.toISOString().slice(0, 10);
    }
  }
  throw new Error("No weekday found within 7 days");
}

async function run() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local");
  }
  const env = readEnv(envPath);
  const projectId = env.VITE_SUPABASE_PROJECT_ID || env.VITE_SUPABASE_project_id;
  const url = env.VITE_SUPABASE_URL || (projectId ? `https://${projectId}.supabase.co` : "");
  const anon = env.VITE_SUPABASE_PUBLIC_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing VITE_SUPABASE_URL (or VITE_SUPABASE_PROJECT_ID) or VITE_SUPABASE_PUBLIC_KEY/VITE_SUPABASE_ANON_KEY in .env.local"
    );
  }

  const supabase = createClient(url, anon);
  const phone = `+601${String(Date.now()).slice(-8)}`;
  const payload = {
    p_name: "BayCuci Smoke Check",
    p_phone_e164: phone,
    p_address: "Bangsar",
    p_carpark_location: "B2 / 47",
    p_car_plate: "BQC 8899",
    p_car_photo_url: "https://example.com/car.jpg",
    p_plate_photo_url: "https://example.com/plate.jpg",
    p_plan_type: "single",
    p_car_available_date: nextWeekdayIso(),
    p_car_available_slot: "night_1",
    p_referrer_code: null,
    p_referrer_user_id: null,
  };
  const legacyPayload = {
    p_name: payload.p_name,
    p_phone_e164: payload.p_phone_e164,
    p_address: payload.p_address,
    p_carpark_location: payload.p_carpark_location,
    p_plan_type: payload.p_plan_type,
    p_car_available_date: payload.p_car_available_date,
    p_car_available_slot: payload.p_car_available_slot,
    p_referrer_code: payload.p_referrer_code,
    p_referrer_user_id: payload.p_referrer_user_id,
  };

  let { data, error } = await supabase.rpc("submit_booking_mvp_v2", payload);
  let message = [error?.code, error?.message, error?.details].filter(Boolean).join(" ").toLowerCase();
  const usedLegacySignature = message.includes("pgrst202") && message.includes("submit_booking_mvp_v2");
  if (error && usedLegacySignature) {
    const retryLegacy = await supabase.rpc("submit_booking_mvp_v2", legacyPayload);
    data = retryLegacy.data;
    error = retryLegacy.error;
    message = [error?.code, error?.message, error?.details].filter(Boolean).join(" ").toLowerCase();
  }
  if (error && message.includes("23514") && message.includes("bookings_car_available_slot_check")) {
    // Backward compatibility: some deployed DBs still enforce legacy slot enum.
    const retry = await supabase.rpc("submit_booking_mvp_v2", {
      ...(usedLegacySignature ? legacyPayload : payload),
      p_car_available_slot: "morning",
    });
    data = retry.data;
    error = retry.error;
  }
  if (error) {
    throw new Error(`RPC failed: ${JSON.stringify(error)}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.booking_id || !row.user_id) {
    throw new Error(`RPC returned empty/invalid payload: ${JSON.stringify(data)}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        booking_id: row.booking_id,
        user_id: row.user_id,
        car_available_slot: row.car_available_slot,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  const message = String(error?.message || "");
  if (
    message.includes("23514") ||
    message.includes("bookings_car_available_slot_check") ||
    message.includes("violates check constraint")
  ) {
    console.error(
      `${message}\nHint: Run latest supabase/schema.sql in your Supabase SQL editor to align slot/date constraints.`
    );
  } else if (message.includes("Legacy API keys are disabled")) {
    console.error(
      `${message}\nHint: Use VITE_SUPABASE_PUBLIC_KEY instead of legacy anon key.`
    );
  } else if (message.includes("pgrst202") || message.includes("could not find the function")) {
    console.error(
      `${message}\nHint: Backend function signature is outdated. Run latest supabase/schema.sql in Supabase SQL editor.`
    );
  } else {
    console.error(message);
  }
  process.exitCode = 1;
});

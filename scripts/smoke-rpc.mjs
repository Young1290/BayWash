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
  const url = env.VITE_SUPABASE_URL;
  const anon = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
  }

  const supabase = createClient(url, anon);
  const phone = `+601${String(Date.now()).slice(-8)}`;
  const payload = {
    p_name: "BayCuci Smoke Check",
    p_phone_e164: phone,
    p_address: "Bangsar",
    p_carpark_location: "B2 / 47",
    p_plan_type: "single",
    p_car_available_date: nextWeekdayIso(),
    p_car_available_slot: "night_1",
    p_referrer_code: null,
    p_referrer_user_id: null,
  };

  const { data, error } = await supabase.rpc("submit_booking_mvp_v2", payload);
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
  console.error(error.message);
  process.exitCode = 1;
});

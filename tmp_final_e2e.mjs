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

function plusDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function randPhone(prefix) {
  const tail = String(Date.now() + Math.floor(Math.random() * 1000)).slice(-7);
  return `+60${prefix}${tail}`;
}

async function run() {
  const env = readEnv(path.join(process.cwd(), ".env.local"));
  const url = env.VITE_SUPABASE_URL;
  const pub = env.VITE_SUPABASE_ANON_KEY;
  const secret = env.SUPABASE_SECRET_KEY;
  if (!url || !pub || !secret) throw new Error("Missing env values");

  const anon = createClient(url, pub);
  const admin = createClient(url, secret);
  const day = plusDaysIso(1);

  const inviterPhone = randPhone("12");
  const inviteePhone = randPhone("13");

  const submit = async (client, payload) => {
    const { data, error } = await client.rpc("submit_booking_mvp", payload);
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Empty RPC result");
    return row;
  };

  const inviter = await submit(anon, {
    p_name: "BayCuci Final Inviter",
    p_phone_e164: inviterPhone,
    p_address: "Bangsar",
    p_carpark_location: "B2 / 47",
    p_plan_type: "single",
    p_car_available_date: day,
    p_car_available_slot: "morning",
    p_referrer_code: null,
    p_referrer_user_id: null,
  });

  const code = inviter.user_referral_code;
  const invitee = await submit(anon, {
    p_name: "BayCuci Final Invitee",
    p_phone_e164: inviteePhone,
    p_address: "Mont Kiara",
    p_carpark_location: "P1 / 122",
    p_plan_type: "monthly",
    p_car_available_date: day,
    p_car_available_slot: "evening",
    p_referrer_code: code,
    p_referrer_user_id: inviter.user_id,
  });

  const { data: booking, error: bookingErr } = await admin
    .from("bookings")
    .select("id,user_id,referrer_code,plan_type,car_available_slot")
    .eq("id", invitee.booking_id)
    .single();
  if (bookingErr) throw bookingErr;

  const { data: referral, error: referralErr } = await admin
    .from("referrals")
    .select("referrer_user_id,referred_user_id,booking_id,status")
    .eq("booking_id", invitee.booking_id)
    .maybeSingle();
  if (referralErr) throw referralErr;

  const checks = [
    ["inviter code exists", Boolean(code)],
    ["booking referrer_code matches", booking.referrer_code === code],
    ["referral row exists", Boolean(referral)],
    ["referral status pending", referral?.status === "pending"],
    ["referral referrer_user_id matches inviter", referral?.referrer_user_id === inviter.user_id],
    ["referral referred_user_id matches invitee", referral?.referred_user_id === invitee.user_id],
  ];

  console.log("FINAL E2E RESULT");
  console.log(`inviter_booking_id=${inviter.booking_id}`);
  console.log(`invitee_booking_id=${invitee.booking_id}`);
  console.log(`referral_code=${code}`);
  console.log(`inviter_user_id=${inviter.user_id}`);
  console.log(`invitee_user_id=${invitee.user_id}`);
  for (const [name, pass] of checks) {
    console.log(`[${pass ? "PASS" : "FAIL"}] ${name}`);
  }

  const failed = checks.filter(([, pass]) => !pass).length;
  if (failed) process.exitCode = 2;
}

run().catch((e) => {
  console.error("FINAL E2E FAILED");
  console.error(e);
  process.exitCode = 1;
});

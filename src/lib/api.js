import { supabase } from "./supabase.js";

const LEGACY_SLOT_MAP = {
  night_1: "morning",
  night_2: "noon",
  night_3: "evening",
  night_4: "overnight",
};
const MEDIA_BUCKET = "booking-media";

function isSlotConstraintError(error) {
  const text = [error?.code, error?.message, error?.details].filter(Boolean).join(" ").toLowerCase();
  return text.includes("23514") && text.includes("bookings_car_available_slot_check");
}

function isFunctionSignatureMismatch(error) {
  const text = [error?.code, error?.message, error?.details].filter(Boolean).join(" ").toLowerCase();
  return text.includes("pgrst202") && text.includes("submit_booking_mvp_v2");
}

function sanitizeFileExt(file) {
  const fromName = String(file?.name || "")
    .split(".")
    .pop()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;
  const mime = String(file?.type || "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

function buildStoragePath(kind, file) {
  const ext = sanitizeFileExt(file);
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8);
  return `booking/${yyyy}-${mm}-${dd}/${Date.now()}-${kind}-${rand}.${ext}`;
}

async function uploadBookingMedia(file, kind) {
  if (!file) return null;
  const path = buildStoragePath(kind, file);
  const storage = supabase.storage.from(MEDIA_BUCKET);
  const { error: uploadError } = await storage.upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data } = storage.getPublicUrl(path);
  return data?.publicUrl || null;
}

export async function submitBooking(payload) {
  const [carPhotoUrl, platePhotoUrl] = await Promise.all([
    uploadBookingMedia(payload.carPhotoFile, "car"),
    uploadBookingMedia(payload.platePhotoFile, "plate"),
  ]);

  const rpcPayload = {
    p_name: payload.name.trim(),
    p_phone_e164: payload.phone,
    p_address: payload.address.trim(),
    p_carpark_location: payload.carparkLocation.trim(),
    p_plan_type: payload.planType,
    p_car_available_date: payload.carAvailableDate,
    p_car_available_slot: payload.carAvailableSlot,
    p_car_plate: String(payload.carPlate || "").trim().toUpperCase() || null,
    p_car_photo_url: carPhotoUrl,
    p_plate_photo_url: platePhotoUrl,
    p_referrer_code: payload.referrerCode || null,
    p_referrer_user_id: payload.referrerUserId || null,
  };
  const legacyRpcPayload = {
    p_name: rpcPayload.p_name,
    p_phone_e164: rpcPayload.p_phone_e164,
    p_address: rpcPayload.p_address,
    p_carpark_location: rpcPayload.p_carpark_location,
    p_plan_type: rpcPayload.p_plan_type,
    p_car_available_date: rpcPayload.p_car_available_date,
    p_car_available_slot: rpcPayload.p_car_available_slot,
    p_referrer_code: rpcPayload.p_referrer_code,
    p_referrer_user_id: rpcPayload.p_referrer_user_id,
  };

  const first = await supabase.rpc("submit_booking_mvp_v2", rpcPayload);

  let data = first.data;
  let error = first.error;

  if (error && isFunctionSignatureMismatch(error)) {
    const retryLegacy = await supabase.rpc("submit_booking_mvp_v2", legacyRpcPayload);
    data = retryLegacy.data;
    error = retryLegacy.error;
  }

  if (error && isSlotConstraintError(error)) {
    const legacySlot = LEGACY_SLOT_MAP[payload.carAvailableSlot];
    if (legacySlot) {
      const retry = await supabase.rpc("submit_booking_mvp_v2", {
        ...(isFunctionSignatureMismatch(first.error) ? legacyRpcPayload : rpcPayload),
        p_car_available_slot: legacySlot,
      });
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Booking submit returned empty response");

  const userId = row.user_id;
  const bookingId = row.booking_id;

  return {
    user: {
      id: userId,
      referral_code: row.user_referral_code,
    },
    booking: {
      id: bookingId,
      address: row.address,
      carpark_location: row.carpark_location,
      car_plate: row.car_plate || null,
      car_photo_url: row.car_photo_url || null,
      plate_photo_url: row.plate_photo_url || null,
      plan_type: row.plan_type,
      car_available_date: row.car_available_date,
      car_available_slot: row.car_available_slot,
      referrer_code: row.referrer_code,
      created_at: row.booking_created_at,
    },
  };
}

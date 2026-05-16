import { supabase } from "./supabase.js";

export async function submitBooking(payload) {
  const { data, error } = await supabase.rpc("submit_booking_mvp_v2", {
    p_name: payload.name.trim(),
    p_phone_e164: payload.phone,
    p_address: payload.address.trim(),
    p_carpark_location: payload.carparkLocation.trim(),
    p_plan_type: payload.planType,
    p_car_available_date: payload.carAvailableDate,
    p_car_available_slot: payload.carAvailableSlot,
    p_referrer_code: payload.referrerCode || null,
    p_referrer_user_id: payload.referrerUserId || null,
  });

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
      plan_type: row.plan_type,
      car_available_date: row.car_available_date,
      car_available_slot: row.car_available_slot,
      referrer_code: row.referrer_code,
      created_at: row.booking_created_at,
    },
  };
}

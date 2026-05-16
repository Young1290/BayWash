import test from "node:test";
import assert from "node:assert/strict";
import { submitBooking } from "../src/lib/api.js";
import { supabase } from "../src/lib/supabase.js";

const samplePayload = {
  name: "  Tester  ",
  phone: "+60123456789",
  address: "  Bangsar  ",
  carparkLocation: "  B2 / 47  ",
  planType: "single",
  carAvailableDate: "2026-05-19",
  carAvailableSlot: "night_1",
  referrerCode: "ABC123",
  referrerUserId: "11111111-1111-4111-8111-111111111111",
};

test("submitBooking sends expected rpc payload and maps response", async () => {
  const originalRpc = supabase.rpc;
  let calledWith = null;
  supabase.rpc = async (fnName, payload) => {
    calledWith = { fnName, payload };
    return {
      data: [
        {
          user_id: "u1",
          user_referral_code: "QWERTY12",
          booking_id: "b1",
          address: "Bangsar",
          carpark_location: "B2 / 47",
          plan_type: "single",
          car_available_date: "2026-05-19",
          car_available_slot: "night_1",
          referrer_code: "ABC123",
          booking_created_at: "2026-05-17T01:23:45.000Z",
        },
      ],
      error: null,
    };
  };

  try {
    const result = await submitBooking(samplePayload);
    assert.equal(calledWith.fnName, "submit_booking_mvp_v2");
    assert.deepEqual(calledWith.payload, {
      p_name: "Tester",
      p_phone_e164: "+60123456789",
      p_address: "Bangsar",
      p_carpark_location: "B2 / 47",
      p_plan_type: "single",
      p_car_available_date: "2026-05-19",
      p_car_available_slot: "night_1",
      p_referrer_code: "ABC123",
      p_referrer_user_id: "11111111-1111-4111-8111-111111111111",
    });
    assert.equal(result.user.id, "u1");
    assert.equal(result.user.referral_code, "QWERTY12");
    assert.equal(result.booking.id, "b1");
    assert.equal(result.booking.car_available_slot, "night_1");
  } finally {
    supabase.rpc = originalRpc;
  }
});

test("submitBooking throws when rpc returns error", async () => {
  const originalRpc = supabase.rpc;
  supabase.rpc = async () => ({
    data: null,
    error: { message: "db error" },
  });
  try {
    await assert.rejects(submitBooking(samplePayload));
  } finally {
    supabase.rpc = originalRpc;
  }
});

test("submitBooking throws on empty rpc response", async () => {
  const originalRpc = supabase.rpc;
  supabase.rpc = async () => ({
    data: [],
    error: null,
  });
  try {
    await assert.rejects(submitBooking(samplePayload), /empty response/i);
  } finally {
    supabase.rpc = originalRpc;
  }
});

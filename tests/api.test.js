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
      p_car_plate: null,
      p_car_photo_url: null,
      p_plate_photo_url: null,
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

test("submitBooking uploads media and sends storage URLs", async () => {
  const originalRpc = supabase.rpc;
  const originalStorage = supabase.storage;
  const uploads = [];
  let calledWith = null;

  const storageApi = {
    upload: async (path, file) => {
      uploads.push({ path, name: file?.name || "" });
      return { error: null };
    },
    getPublicUrl: (path) => ({ data: { publicUrl: `https://public.local/${path}` } }),
  };

  supabase.storage = {
    from: () => storageApi,
  };
  supabase.rpc = async (fnName, payload) => {
    calledWith = { fnName, payload };
    return {
      data: [
        {
          user_id: "u3",
          user_referral_code: "MEDIA123",
          booking_id: "b3",
          address: "Bangsar",
          carpark_location: "B2 / 47",
          car_plate: "BPL 1234",
          car_photo_url: payload.p_car_photo_url,
          plate_photo_url: payload.p_plate_photo_url,
          plan_type: "single",
          car_available_date: "2026-05-19",
          car_available_slot: "night_1",
          referrer_code: null,
          booking_created_at: "2026-05-17T01:23:45.000Z",
        },
      ],
      error: null,
    };
  };

  try {
    const result = await submitBooking({
      ...samplePayload,
      carPlate: "bpl 1234",
      carPhotoFile: { name: "car-front.jpg", type: "image/jpeg" },
      platePhotoFile: { name: "plate.png", type: "image/png" },
    });

    assert.equal(calledWith.fnName, "submit_booking_mvp_v2");
    assert.equal(uploads.length, 2);
    assert.equal(calledWith.payload.p_car_plate, "BPL 1234");
    assert.match(calledWith.payload.p_car_photo_url, /^https:\/\/public\.local\/booking\//);
    assert.match(calledWith.payload.p_plate_photo_url, /^https:\/\/public\.local\/booking\//);
    assert.equal(result.booking.car_plate, "BPL 1234");
  } finally {
    supabase.rpc = originalRpc;
    supabase.storage = originalStorage;
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

test("submitBooking retries with legacy slot when backend has old slot constraint", async () => {
  const originalRpc = supabase.rpc;
  const calls = [];
  supabase.rpc = async (_fn, payload) => {
    calls.push(payload.p_car_available_slot);
    if (calls.length === 1) {
      return {
        data: null,
        error: {
          code: "23514",
          message: 'violates check constraint "bookings_car_available_slot_check"',
          details: 'Failing row contains (... night_1 ...)',
        },
      };
    }
    return {
      data: [
        {
          user_id: "u2",
          user_referral_code: "ZXCV1234",
          booking_id: "b2",
          address: "Bangsar",
          carpark_location: "B2 / 47",
          plan_type: "single",
          car_available_date: "2026-05-19",
          car_available_slot: "morning",
          referrer_code: null,
          booking_created_at: "2026-05-17T01:23:45.000Z",
        },
      ],
      error: null,
    };
  };
  try {
    const result = await submitBooking({ ...samplePayload, carAvailableSlot: "night_1" });
    assert.deepEqual(calls, ["night_1", "morning"]);
    assert.equal(result.booking.car_available_slot, "morning");
  } finally {
    supabase.rpc = originalRpc;
  }
});

test("submitBooking falls back when backend function has old signature", async () => {
  const originalRpc = supabase.rpc;
  const originalStorage = supabase.storage;
  const calls = [];

  supabase.storage = {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "https://public.local/x.jpg" } }),
    }),
  };
  supabase.rpc = async (_fn, payload) => {
    calls.push(payload);
    if (calls.length === 1) {
      return {
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.submit_booking_mvp_v2(...) in the schema cache",
          details: "Searched for function with p_car_photo_url and p_plate_photo_url",
        },
      };
    }
    return {
      data: [
        {
          user_id: "u4",
          user_referral_code: "OLD12345",
          booking_id: "b4",
          address: "Bangsar",
          carpark_location: "B2 / 47",
          plan_type: "single",
          car_available_date: "2026-05-19",
          car_available_slot: "night_1",
          referrer_code: null,
          booking_created_at: "2026-05-17T01:23:45.000Z",
        },
      ],
      error: null,
    };
  };

  try {
    await submitBooking({
      ...samplePayload,
      carPlate: "WXY 1234",
      carPhotoFile: { name: "car.jpg", type: "image/jpeg" },
      platePhotoFile: { name: "plate.jpg", type: "image/jpeg" },
    });

    assert.ok("p_car_photo_url" in calls[0]);
    assert.ok(!("p_car_photo_url" in calls[1]));
    assert.ok(!("p_plate_photo_url" in calls[1]));
    assert.ok(!("p_car_plate" in calls[1]));
  } finally {
    supabase.rpc = originalRpc;
    supabase.storage = originalStorage;
  }
});

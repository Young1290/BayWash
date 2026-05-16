import test from "node:test";
import assert from "node:assert/strict";
import { validateBookingForm } from "../src/lib/bookingValidation.js";

const messages = {
  required: "required",
  invalidPhone: "invalidPhone",
  invalidDate: "invalidDate",
  invalidWeekday: "invalidWeekday",
};

function tError(key) {
  return messages[key];
}

function validForm(overrides = {}) {
  return {
    name: "Tester",
    phone: "0123456789",
    address: "Bangsar",
    addressOther: "",
    carparkFloor: "B2",
    carparkLot: "47",
    planType: "single",
    carAvailableDate: "2026-05-18",
    carAvailableSlot: "night_1",
    ...overrides,
  };
}

test("validateBookingForm accepts valid form", () => {
  const result = validateBookingForm(validForm(), tError, "2026-05-17");
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedPhone, "+60123456789");
  assert.deepEqual(result.errors, {});
});

test("validateBookingForm requires addressOther when address is other", () => {
  const result = validateBookingForm(
    validForm({ address: "__other__", addressOther: "   " }),
    tError,
    "2026-05-17"
  );
  assert.equal(result.isValid, false);
  assert.equal(result.errors.addressOther, "required");
});

test("validateBookingForm rejects past date", () => {
  const result = validateBookingForm(
    validForm({ carAvailableDate: "2026-05-16" }),
    tError,
    "2026-05-17"
  );
  assert.equal(result.isValid, false);
  assert.equal(result.errors.carAvailableDate, "invalidDate");
});

test("validateBookingForm rejects weekend date", () => {
  const result = validateBookingForm(
    validForm({ carAvailableDate: "2026-05-17" }),
    tError,
    "2026-05-17"
  );
  assert.equal(result.isValid, false);
  assert.equal(result.errors.carAvailableDate, "invalidWeekday");
});

test("validateBookingForm rejects invalid phone", () => {
  const result = validateBookingForm(
    validForm({ phone: "123456789" }),
    tError,
    "2026-05-17"
  );
  assert.equal(result.isValid, false);
  assert.equal(result.errors.phone, "invalidPhone");
});

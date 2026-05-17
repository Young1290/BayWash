import test from "node:test";
import assert from "node:assert/strict";
import { buildSubmitErrorMessage } from "../src/lib/submitError.js";

const dict = {
  serviceUnavailable: "serviceUnavailable",
  missingBackendFunction: "missingBackendFunction",
  backendSchemaMismatch: "backendSchemaMismatch",
  missingClientConfig: "missingClientConfig",
  authConfig: "authConfig",
  submitFailed: "submitFailed",
};

const tError = (key) => dict[key];

test("maps network errors to serviceUnavailable", () => {
  const message = buildSubmitErrorMessage({ message: "fetch failed" }, tError);
  assert.equal(message, "serviceUnavailable");
});

test("maps missing RPC function errors", () => {
  const message = buildSubmitErrorMessage(
    { message: "function submit_booking_mvp_v2 does not exist" },
    tError
  );
  assert.equal(message, "missingBackendFunction");
});

test("maps check constraint schema mismatch errors", () => {
  const message = buildSubmitErrorMessage(
    { code: "23514", message: 'violates check constraint "bookings_car_available_slot_check"' },
    tError
  );
  assert.equal(message, "backendSchemaMismatch");
});

test("maps client config errors", () => {
  const message = buildSubmitErrorMessage(
    { message: "Supabase client is not configured" },
    tError
  );
  assert.equal(message, "missingClientConfig");
});

test("maps auth and RLS errors", () => {
  const message = buildSubmitErrorMessage(
    { code: "42501", details: "row-level security policy violation" },
    tError
  );
  assert.equal(message, "authConfig");
});

test("falls back to submitFailed", () => {
  const message = buildSubmitErrorMessage({ message: "unexpected" }, tError);
  assert.equal(message, "submitFailed");
});

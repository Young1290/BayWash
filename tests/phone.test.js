import test from "node:test";
import assert from "node:assert/strict";
import { isValidMyE164, normalizeMyPhoneToE164 } from "../src/lib/phone.js";

test("normalizeMyPhoneToE164 handles accepted Malaysia prefixes", () => {
  assert.equal(normalizeMyPhoneToE164("0123456789"), "+60123456789");
  assert.equal(normalizeMyPhoneToE164("60123456789"), "+60123456789");
  assert.equal(normalizeMyPhoneToE164("+60 12-345 6789"), "+60123456789");
  assert.equal(normalizeMyPhoneToE164("0060123456789"), "+60123456789");
});

test("normalizeMyPhoneToE164 rejects ambiguous or invalid input", () => {
  assert.equal(normalizeMyPhoneToE164("123456789"), null);
  assert.equal(normalizeMyPhoneToE164("+6012345"), null);
  assert.equal(normalizeMyPhoneToE164(""), null);
});

test("isValidMyE164 validates Malaysia mobile format", () => {
  assert.equal(isValidMyE164("+60123456789"), true);
  assert.equal(isValidMyE164("+60112345678"), true);
  assert.equal(isValidMyE164("+60223456789"), false);
  assert.equal(isValidMyE164("+601234"), false);
});

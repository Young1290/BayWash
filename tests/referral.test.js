import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeReferralCode } from "../src/lib/referral.js";
import { LANGUAGES, messages } from "../src/i18n.js";

test("sanitizeReferralCode uppercases valid code", () => {
  assert.equal(sanitizeReferralCode("ab12cd"), "AB12CD");
  assert.equal(sanitizeReferralCode("A9Z8X7"), "A9Z8X7");
});

test("sanitizeReferralCode rejects invalid shape", () => {
  assert.equal(sanitizeReferralCode("abc"), null);
  assert.equal(sanitizeReferralCode("AB12CD!"), null);
  assert.equal(sanitizeReferralCode(""), null);
});

test("Chinese language pack is intact", () => {
  const zh = LANGUAGES.find((item) => item.code === "zh");
  assert.equal(zh?.label, "中文");
  assert.equal(messages.zh.heroTitle, "30秒完成上门洗车预约");
});

import test from "node:test";
import assert from "node:assert/strict";
import { isFutureOrToday, isWeekday, todayDateInputValue } from "../src/lib/date.js";

test("todayDateInputValue formats YYYY-MM-DD", () => {
  const value = todayDateInputValue(new Date(2026, 4, 17));
  assert.equal(value, "2026-05-17");
});

test("isFutureOrToday accepts today and future, rejects past", () => {
  const today = "2026-05-17";
  assert.equal(isFutureOrToday("2026-05-17", today), true);
  assert.equal(isFutureOrToday("2026-05-18", today), true);
  assert.equal(isFutureOrToday("2026-05-16", today), false);
});

test("isWeekday accepts Monday-Friday only", () => {
  assert.equal(isWeekday("2026-05-18"), true);
  assert.equal(isWeekday("2026-05-22"), true);
  assert.equal(isWeekday("2026-05-17"), false);
  assert.equal(isWeekday("2026-05-23"), false);
});

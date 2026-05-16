import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShareLink,
  clearSavedReferrerCode,
  clearSavedReferrerUserId,
  getSavedReferrerCode,
  getSavedReferrerUserId,
  readReferrerFromUrl,
  readReferrerUserIdFromUrl,
  saveReferrerCode,
  saveReferrerUserId,
} from "../src/lib/referral.js";

function createStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

function withWindow(url, fn) {
  const previousWindow = global.window;
  const nextWindow = {
    location: new URL(url),
    sessionStorage: createStorage(),
  };
  global.window = nextWindow;
  try {
    fn(nextWindow);
  } finally {
    global.window = previousWindow;
  }
}

test("read referrer values from URL", () => {
  withWindow("https://baycuci.test/?ref=ab12cd&rid=11111111-1111-4111-8111-111111111111", () => {
    assert.equal(readReferrerFromUrl(), "AB12CD");
    assert.equal(
      readReferrerUserIdFromUrl(),
      "11111111-1111-4111-8111-111111111111"
    );
  });
});

test("save/get/clear referral values in session storage", () => {
  withWindow("https://baycuci.test/", () => {
    saveReferrerCode("ab12cd");
    saveReferrerUserId("11111111-1111-4111-8111-111111111111");
    assert.equal(getSavedReferrerCode(), "AB12CD");
    assert.equal(
      getSavedReferrerUserId(),
      "11111111-1111-4111-8111-111111111111"
    );

    clearSavedReferrerCode();
    clearSavedReferrerUserId();
    assert.equal(getSavedReferrerCode(), null);
    assert.equal(getSavedReferrerUserId(), null);
  });
});

test("buildShareLink sets ref and removes rid", () => {
  withWindow("https://baycuci.test/book?rid=11111111-1111-4111-8111-111111111111", () => {
    const link = buildShareLink("ab12cd");
    assert.equal(link, "https://baycuci.test/book?ref=AB12CD");
  });
});

const REF_SESSION_KEY = "washnear_ref_code";
const REFERRER_ID_SESSION_KEY = "washnear_referrer_user_id";

export function readReferrerFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  return sanitizeReferralCode(ref);
}

export function readReferrerUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return sanitizeReferrerUserId(params.get("rid"));
}

export function sanitizeReferralCode(code) {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(normalized)) return null;
  return normalized;
}

export function saveReferrerCode(code) {
  const safe = sanitizeReferralCode(code);
  if (!safe) return;
  try {
    window.sessionStorage.setItem(REF_SESSION_KEY, safe);
  } catch (error) {
    console.warn("Could not persist referral code in session storage.", error);
  }
}

export function saveReferrerUserId(userId) {
  const safe = sanitizeReferrerUserId(userId);
  if (!safe) return;
  try {
    window.sessionStorage.setItem(REFERRER_ID_SESSION_KEY, safe);
  } catch (error) {
    console.warn("Could not persist referrer user id in session storage.", error);
  }
}

export function getSavedReferrerCode() {
  try {
    const value = window.sessionStorage.getItem(REF_SESSION_KEY);
    return sanitizeReferralCode(value);
  } catch (error) {
    console.warn("Could not read referral code from session storage.", error);
    return null;
  }
}

export function getSavedReferrerUserId() {
  try {
    const value = window.sessionStorage.getItem(REFERRER_ID_SESSION_KEY);
    return sanitizeReferrerUserId(value);
  } catch (error) {
    console.warn("Could not read referrer user id from session storage.", error);
    return null;
  }
}

export function clearSavedReferrerCode() {
  try {
    window.sessionStorage.removeItem(REF_SESSION_KEY);
  } catch (error) {
    console.warn("Could not clear referral code from session storage.", error);
  }
}

export function clearSavedReferrerUserId() {
  try {
    window.sessionStorage.removeItem(REFERRER_ID_SESSION_KEY);
  } catch (error) {
    console.warn("Could not clear referrer user id from session storage.", error);
  }
}

export function buildShareLink(referralCode) {
  const safeCode = sanitizeReferralCode(referralCode);
  if (!safeCode) return window.location.origin + window.location.pathname;
  const url = new URL(window.location.href);
  url.searchParams.set("ref", safeCode);
  url.searchParams.delete("rid");
  return url.toString();
}

function sanitizeReferrerUserId(value) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const uuidV4Like =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Like.test(normalized) ? normalized : null;
}

const DIGITS_ONLY = /\D/g;
const MY_MOBILE_E164 = /^\+60(1\d{7,8})$/;

function stripToDigits(value) {
  return (value || "").replace(DIGITS_ONLY, "");
}

export function normalizeMyPhoneToE164(input) {
  const raw = (input || "").trim();
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const normalized = `+${stripToDigits(raw)}`;
    return isValidMyE164(normalized) ? normalized : null;
  }

  const digits = stripToDigits(raw);
  if (!digits) return null;

  if (digits.startsWith("0060")) {
    const candidate = `+${digits.slice(2)}`;
    return isValidMyE164(candidate) ? candidate : null;
  }

  if (digits.startsWith("60")) {
    const candidate = `+${digits}`;
    return isValidMyE164(candidate) ? candidate : null;
  }

  if (digits.startsWith("0")) {
    const candidate = `+60${digits.slice(1)}`;
    return isValidMyE164(candidate) ? candidate : null;
  }
  return null;
}

export function isValidMyE164(value) {
  if (!value) return false;
  return MY_MOBILE_E164.test(value);
}

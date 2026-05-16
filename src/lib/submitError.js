export function buildSubmitErrorMessage(error, tError) {
  const raw = [error?.code, error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ");
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("enotfound")
  ) {
    return tError("serviceUnavailable");
  }
  if (normalized.includes("submit_booking_mvp")) {
    return tError("missingBackendFunction");
  }
  if (
    normalized.includes("supabase client is not configured") ||
    normalized.includes("not configured")
  ) {
    return tError("missingClientConfig");
  }
  if (
    normalized.includes("jwt") ||
    normalized.includes("permission") ||
    normalized.includes("denied") ||
    normalized.includes("42501") ||
    normalized.includes("row-level security") ||
    normalized.includes("row level security") ||
    normalized.includes("rls") ||
    normalized.includes("policy")
  ) {
    return tError("authConfig");
  }

  return tError("submitFailed");
}

export function todayDateInputValue(now = new Date()) {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isFutureOrToday(yyyyMmDd, today = todayDateInputValue()) {
  if (!yyyyMmDd) return false;
  return yyyyMmDd >= today;
}

export function isWeekday(yyyyMmDd) {
  if (!yyyyMmDd) return false;
  const [y, m, d] = String(yyyyMmDd).split("-").map((part) => Number(part));
  if (!y || !m || !d) return false;
  const parsed = new Date(y, m - 1, d);
  if (Number.isNaN(parsed.getTime())) return false;
  const day = parsed.getDay();
  return day >= 1 && day <= 5;
}

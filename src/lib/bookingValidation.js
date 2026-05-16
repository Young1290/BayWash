import { isFutureOrToday, isWeekday } from "./date.js";
import { normalizeMyPhoneToE164 } from "./phone.js";

export function validateBookingForm(nextForm, tError, today) {
  const nextErrors = {};
  const requiredFields = [
    "name",
    "phone",
    "address",
    "carparkFloor",
    "carparkLot",
    "planType",
    "carAvailableDate",
    "carAvailableSlot",
  ];

  requiredFields.forEach((field) => {
    if (!String(nextForm[field] || "").trim()) {
      nextErrors[field] = tError("required");
    }
  });

  if (nextForm.address === "__other__" && !String(nextForm.addressOther || "").trim()) {
    nextErrors.addressOther = tError("required");
  }

  let normalizedPhone = null;
  if (String(nextForm.phone || "").trim()) {
    normalizedPhone = normalizeMyPhoneToE164(nextForm.phone);
  }
  if (!nextErrors.phone && !normalizedPhone) {
    nextErrors.phone = tError("invalidPhone");
  }

  if (nextForm.carAvailableDate && !isFutureOrToday(nextForm.carAvailableDate, today)) {
    nextErrors.carAvailableDate = tError("invalidDate");
  } else if (nextForm.carAvailableDate && !isWeekday(nextForm.carAvailableDate)) {
    nextErrors.carAvailableDate = tError("invalidWeekday");
  }

  return {
    errors: nextErrors,
    normalizedPhone,
    isValid: Object.keys(nextErrors).length === 0,
  };
}

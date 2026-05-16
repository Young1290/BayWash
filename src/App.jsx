import { useEffect, useMemo, useState } from "react";
import { LANGUAGES, messages, slotKeys } from "./i18n";
import { BRAND_COMPANY_NAME, BRAND_WHATSAPP } from "./brand";
import { submitBooking } from "./lib/api";
import { normalizeMyPhoneToE164 } from "./lib/phone";
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
} from "./lib/referral";

const initialForm = {
  name: "",
  phone: "",
  address: "",
  addressOther: "",
  carparkFloor: "",
  carparkLot: "",
  planType: "single",
  carAvailableDate: "",
  carAvailableSlot: "night_1",
};

const ADDRESS_OPTIONS = [
  { value: "Bangsar", labelKey: "addressOptionBangsar" },
  { value: "Mont Kiara", labelKey: "addressOptionMontKiara" },
  { value: "KLCC", labelKey: "addressOptionKlcc" },
  { value: "Cheras", labelKey: "addressOptionCheras" },
  { value: "PJ SS2", labelKey: "addressOptionPjSs2" },
  { value: "Subang Jaya", labelKey: "addressOptionSubangJaya" },
  { value: "__other__", labelKey: "addressOptionOther" },
];

function todayDateInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isFutureOrToday(yyyyMmDd) {
  if (!yyyyMmDd) return false;
  const today = todayDateInputValue();
  return yyyyMmDd >= today;
}

function isWeekday(yyyyMmDd) {
  if (!yyyyMmDd) return false;
  const [y, m, d] = String(yyyyMmDd).split("-").map((part) => Number(part));
  if (!y || !m || !d) return false;
  const parsed = new Date(y, m - 1, d);
  if (Number.isNaN(parsed.getTime())) return false;
  const day = parsed.getDay();
  return day >= 1 && day <= 5;
}

function withVars(template, vars) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function buildSubmitErrorMessage(error, tError) {
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

const LANG_STORAGE_KEY = "washnear_lang";

function getInitialLang() {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return LANGUAGES.some((item) => item.code === stored) ? stored : "en";
  } catch (error) {
    return "en";
  }
}

export default function App() {
  const [lang, setLang] = useState(getInitialLang);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [actionFeedback, setActionFeedback] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [copyDone, setCopyDone] = useState(false);
  const [savedReferrerCode, setSavedReferrerCode] = useState(null);
  const [savedReferrerUserId, setSavedReferrerUserId] = useState(null);

  const text = useMemo(() => messages[lang], [lang]);

  useEffect(() => {
    const refFromUrl = readReferrerFromUrl();
    const referrerUserIdFromUrl = readReferrerUserIdFromUrl();

    if (refFromUrl) {
      saveReferrerCode(refFromUrl);
      if (referrerUserIdFromUrl) {
        saveReferrerUserId(referrerUserIdFromUrl);
      } else {
        clearSavedReferrerUserId();
      }
    } else if (referrerUserIdFromUrl) {
      clearSavedReferrerUserId();
    }

    setSavedReferrerCode(getSavedReferrerCode());
    setSavedReferrerUserId(getSavedReferrerUserId());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (error) {
      console.warn("Could not persist language preference.", error);
    }
  }, [lang]);

  function t(key) {
    return text[key];
  }

  function tt(key) {
    return withVars(t(key), {
      company: BRAND_COMPANY_NAME,
      whatsapp: BRAND_WHATSAPP || "-",
    });
  }

  function tError(key) {
    return text.errors[key];
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(nextForm) {
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

    if (nextForm.carAvailableDate && !isFutureOrToday(nextForm.carAvailableDate)) {
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

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const result = validate(form);
    setErrors(result.errors);
    if (!result.isValid || !result.normalizedPhone) return;

    setSubmitting(true);
    setSubmitError("");
    setActionFeedback("");

    try {
      const finalAddress =
        form.address === "__other__" ? form.addressOther.trim() : form.address.trim();
      const finalCarparkLocation = `${form.carparkFloor.trim()} / ${form.carparkLot.trim()}`;

      const payload = {
        name: form.name.trim(),
        phone: result.normalizedPhone,
        address: finalAddress,
        carparkLocation: finalCarparkLocation,
        planType: form.planType,
        carAvailableDate: form.carAvailableDate,
        carAvailableSlot: form.carAvailableSlot,
        referrerCode: savedReferrerCode,
        referrerUserId: savedReferrerUserId,
      };

      const { user, booking } = await submitBooking(payload);
      setSubmitted({
        user,
        booking,
        shareLink: buildShareLink(user.referral_code),
      });
    } catch (error) {
      console.error(error);
      setSubmitError(buildSubmitErrorMessage(error, tError));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!submitted?.shareLink) return;
    try {
      await navigator.clipboard.writeText(submitted.shareLink);
      setCopyDone(true);
      setActionFeedback("");
      window.setTimeout(() => setCopyDone(false), 1500);
    } catch (error) {
      console.error(error);
      setActionFeedback(t("copyFailed"));
    }
  }

  async function nativeShare() {
    if (!submitted?.shareLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("appName"),
          text: t("heroTitle"),
          url: submitted.shareLink,
        });
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error(error);
          setActionFeedback(t("shareFailed"));
        }
      }
      return;
    }
    await copyLink();
  }

  function clearAppliedReferrer() {
    clearSavedReferrerCode();
    clearSavedReferrerUserId();
    setSavedReferrerCode(null);
    setSavedReferrerUserId(null);
  }

  function resetFlow() {
    setSubmitted(null);
    setForm(initialForm);
    setErrors({});
    setSubmitError("");
    setActionFeedback("");
    setCopyDone(false);
  }

  const submittedPlanLabel =
    submitted?.booking?.plan_type === "monthly" ? t("planMonthly") : t("planSingle");
  const submittedSlotLabel = (() => {
    const slot = slotKeys.find((item) => item.value === submitted?.booking?.car_available_slot);
    return slot ? t(slot.key) : submitted?.booking?.car_available_slot || "-";
  })();

  return (
    <main className="page-shell">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <section className="card">
        <header className="hero">
          <div className="brand-row">
            <div className="brand">
              <span className="brand-mark">B</span>
              <div>
                <p className="brand-name">{t("appName")}</p>
                <p className="brand-tag">{t("tagline")}</p>
              </div>
            </div>

            <label className="lang-picker">
              <span>{t("languageLabel")}</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                {LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h1>{t("heroTitle")}</h1>
          <p className="hero-sub">{t("heroSub")}</p>
          {savedReferrerCode && (
            <p className="ref-chip">
              <span>{t("referralApplied")}: {savedReferrerCode}</span>
              <button type="button" className="ref-clear-btn" onClick={clearAppliedReferrer}>
                {t("clearReferral")}
              </button>
            </p>
          )}
        </header>

        {!submitted ? (
          <form className="form" onSubmit={onSubmit} noValidate>
            <Field
              id="name"
              label={t("nameLabel")}
              error={errors.name}
              input={
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder={t("namePlaceholder")}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              }
            />

            <Field
              id="phone"
              label={t("phoneLabel")}
              error={errors.phone}
              input={
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  autoComplete="tel"
                  inputMode="tel"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
              }
            />

            <Field
              id="address"
              label={t("addressLabel")}
              error={errors.address}
              input={
                <select
                  id="address"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? "address-error" : undefined}
                >
                  <option value="">{t("addressSelectPlaceholder")}</option>
                  {ADDRESS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              }
            />

            {form.address === "__other__" && (
              <Field
                id="addressOther"
                label={t("addressOtherLabel")}
                error={errors.addressOther}
                input={
                  <input
                    id="addressOther"
                    value={form.addressOther}
                    onChange={(e) => updateField("addressOther", e.target.value)}
                    placeholder={t("addressOtherPlaceholder")}
                    aria-invalid={Boolean(errors.addressOther)}
                    aria-describedby={errors.addressOther ? "addressOther-error" : undefined}
                  />
                }
              />
            )}

            <div className="carpark-row">
              <Field
                id="carparkFloor"
                label={t("carparkFloorLabel")}
                error={errors.carparkFloor}
                input={
                  <input
                    id="carparkFloor"
                    value={form.carparkFloor}
                    onChange={(e) => updateField("carparkFloor", e.target.value)}
                    placeholder={t("carparkFloorPlaceholder")}
                    aria-invalid={Boolean(errors.carparkFloor)}
                    aria-describedby={errors.carparkFloor ? "carparkFloor-error" : undefined}
                  />
                }
              />

              <Field
                id="carparkLot"
                label={t("carparkLotLabel")}
                error={errors.carparkLot}
                input={
                  <input
                    id="carparkLot"
                    value={form.carparkLot}
                    onChange={(e) => updateField("carparkLot", e.target.value)}
                    placeholder={t("carparkLotPlaceholder")}
                    aria-invalid={Boolean(errors.carparkLot)}
                    aria-describedby={errors.carparkLot ? "carparkLot-error" : undefined}
                  />
                }
              />
            </div>

            <Field
              label={t("planLabel")}
              error={errors.planType}
              input={
                <div className="plan-row">
                  <button
                    type="button"
                    className={form.planType === "single" ? "plan-btn active" : "plan-btn"}
                    onClick={() => updateField("planType", "single")}
                  >
                    {t("planSingle")}
                  </button>
                  <button
                    type="button"
                    className={form.planType === "monthly" ? "plan-btn active" : "plan-btn"}
                    onClick={() => updateField("planType", "monthly")}
                  >
                    {t("planMonthly")}
                  </button>
                </div>
              }
            />

            <div className="split-row">
              <Field
                id="carAvailableDate"
                label={t("dateLabel")}
                error={errors.carAvailableDate}
                input={
                  <input
                    id="carAvailableDate"
                    type="date"
                    min={todayDateInputValue()}
                    value={form.carAvailableDate}
                    onChange={(e) => updateField("carAvailableDate", e.target.value)}
                    aria-invalid={Boolean(errors.carAvailableDate)}
                    aria-describedby={errors.carAvailableDate ? "carAvailableDate-error" : undefined}
                  />
                }
              />

              <Field
                id="carAvailableSlot"
                label={t("slotLabel")}
                error={errors.carAvailableSlot}
                input={
                  <select
                    id="carAvailableSlot"
                    value={form.carAvailableSlot}
                    onChange={(e) => updateField("carAvailableSlot", e.target.value)}
                    aria-invalid={Boolean(errors.carAvailableSlot)}
                    aria-describedby={errors.carAvailableSlot ? "carAvailableSlot-error" : undefined}
                  >
                    {slotKeys.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {t(slot.key)}
                      </option>
                    ))}
                  </select>
                }
              />
            </div>

            <section className="trust-panel" aria-label={t("trustTitle")}>
              <p className="trust-title">{t("trustTitle")}</p>
              <p>{tt("trustCompany")}</p>
              <p>{tt("trustWhatsapp")}</p>
              <p>{t("trustHours")}</p>
              <p>{t("trustResponse")}</p>
              <p>{t("trustPrivacy")}</p>
              <p className="price-hint">{t("priceHint")}</p>
            </section>

            {submitError && <p className="submit-error">{submitError}</p>}
            {actionFeedback && <p className="submit-error">{actionFeedback}</p>}
            <button className="submit-btn" type="submit" disabled={submitting}>
              {submitting ? t("submitting") : t("submit")}
            </button>
          </form>
        ) : (
          <section className="success">
            <h2>{t("successTitle")}</h2>
            <p>{t("successSub")}</p>
            <article className="summary-card">
              <h3>{t("summaryTitle")}</h3>
              <p>
                <strong>{t("summaryPlan")}:</strong> {submittedPlanLabel}
              </p>
              <p>
                <strong>{t("summaryDate")}:</strong> {submitted.booking.car_available_date}
              </p>
              <p>
                <strong>{t("summarySlot")}:</strong> {submittedSlotLabel}
              </p>
              <p>
                <strong>{t("summaryAddress")}:</strong> {submitted.booking.address}
              </p>
              <p>
                <strong>{t("summaryCarpark")}:</strong> {submitted.booking.carpark_location}
              </p>
            </article>

            <article className="invite-card invite-card--secondary">
              <h3>{t("inviteTitle")}</h3>
              <p>{t("inviteSub")}</p>
              <input value={submitted.shareLink} readOnly />
              <div className="invite-actions">
                <button type="button" className="ghost-btn" onClick={copyLink}>
                  {copyDone ? t("copied") : t("copyLink")}
                </button>
                <button type="button" className="ghost-btn" onClick={nativeShare}>
                  {t("share")}
                </button>
              </div>
            </article>
            {actionFeedback && <p className="submit-error">{actionFeedback}</p>}

            <button type="button" className="submit-btn" onClick={resetFlow}>
              {t("bookAnother")}
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

function Field({ id, label, error, input }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {input}
      {error ? (
        <small id={id ? `${id}-error` : undefined} role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}

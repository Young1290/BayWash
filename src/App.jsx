import { useEffect, useMemo, useState } from "react";
import { LANGUAGES, messages, slotKeys } from "./i18n";
import { BRAND_COMPANY_NAME, BRAND_WHATSAPP } from "./brand";
import { submitBooking } from "./lib/api";
import { todayDateInputValue } from "./lib/date";
import { validateBookingForm } from "./lib/bookingValidation";
import { buildSubmitErrorMessage } from "./lib/submitError";
import { isSupabaseConfigured } from "./lib/supabase";
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
  carPlate: "",
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

function buildWhatsAppHref(rawPhone) {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("60")) return `https://wa.me/${digits}`;
  if (digits.startsWith("0")) return `https://wa.me/60${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

function withVars(template, vars) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

const LANG_STORAGE_KEY = "washnear_lang";
const initialLoginForm = {
  name: "",
  phone: "",
};

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
  const [step, setStep] = useState("login");
  const [profile, setProfile] = useState(null);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [loginErrors, setLoginErrors] = useState({});
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [carPhotoFile, setCarPhotoFile] = useState(null);
  const [carPhotoPreviewUrl, setCarPhotoPreviewUrl] = useState("");
  const [platePhotoFile, setPlatePhotoFile] = useState(null);
  const [platePhotoPreviewUrl, setPlatePhotoPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [actionFeedback, setActionFeedback] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [copyDone, setCopyDone] = useState(false);
  const [savedReferrerCode, setSavedReferrerCode] = useState(null);
  const [savedReferrerUserId, setSavedReferrerUserId] = useState(null);

  const text = useMemo(() => messages[lang], [lang]);
  const configError = !isSupabaseConfigured ? tError("missingClientConfig") : "";
  const supportHref = buildWhatsAppHref(BRAND_WHATSAPP);

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

  useEffect(() => {
    return () => {
      if (carPhotoPreviewUrl) URL.revokeObjectURL(carPhotoPreviewUrl);
      if (platePhotoPreviewUrl) URL.revokeObjectURL(platePhotoPreviewUrl);
    };
  }, [carPhotoPreviewUrl, platePhotoPreviewUrl]);

  function t(key) {
    return text[key];
  }
  function tx(key, fallback = "") {
    return text[key] ?? messages.en[key] ?? fallback;
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

  function updateLoginField(field, value) {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    setLoginErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function normalizePlate(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, "")
      .replace(/\s+/g, " ")
      .trimStart();
  }

  function pickImageFile(event, onFile, onPreviewUrl) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setActionFeedback(tx("fileImageOnly", "Please upload an image file only."));
      return;
    }
    onFile(file);
    onPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setActionFeedback("");
  }

  function clearImage(onFile, onPreviewUrl) {
    onFile(null);
    onPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }

  function startBookingAsMember(event) {
    event.preventDefault();
    const nextName = loginForm.name.trim();
    const nextPhone = loginForm.phone.trim();
    const nextErrors = {};
    if (!nextName) nextErrors.name = tError("required");
    if (!normalizeMyPhoneToE164(nextPhone)) nextErrors.phone = tError("invalidPhone");
    setLoginErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setProfile({ kind: "member", name: nextName, phoneRaw: nextPhone });
    setForm((prev) => ({ ...prev, name: nextName, phone: nextPhone }));
    setStep("booking");
  }

  function startBookingAsGuest() {
    setProfile({ kind: "guest" });
    setStep("booking");
    setLoginErrors({});
  }

  function switchProfile() {
    clearImage(setCarPhotoFile, setCarPhotoPreviewUrl);
    clearImage(setPlatePhotoFile, setPlatePhotoPreviewUrl);
    setStep("login");
    setSubmitted(null);
    setSubmitError("");
    setActionFeedback("");
    setErrors({});
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!isSupabaseConfigured) {
      setSubmitError(tError("missingClientConfig"));
      return;
    }

    const result = validateBookingForm(form, tError, todayDateInputValue());
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
        carPlate: form.carPlate,
        carPhotoFile,
        platePhotoFile,
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
        carPlate: booking.car_plate || form.carPlate.trim(),
        carPhotoUrl: booking.car_photo_url || "",
        platePhotoUrl: booking.plate_photo_url || "",
        carPhotoName: carPhotoFile?.name || "",
        platePhotoName: platePhotoFile?.name || "",
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
    clearImage(setCarPhotoFile, setCarPhotoPreviewUrl);
    clearImage(setPlatePhotoFile, setPlatePhotoPreviewUrl);
    setSubmitted(null);
    if (profile?.kind === "member") {
      setForm({
        ...initialForm,
        name: profile.name,
        phone: profile.phoneRaw,
      });
    } else {
      setForm(initialForm);
    }
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
  const selectedSlotLabel = (() => {
    const slot = slotKeys.find((item) => item.value === form.carAvailableSlot);
    return slot ? t(slot.key) : tx("quickSummaryNotSelected", "-");
  })();
  const selectedDateLabel = form.carAvailableDate || tx("quickSummaryNotSelected", "-");
  const selectedPlanLabel = form.planType === "monthly" ? t("planMonthly") : t("planSingle");

  return (
    <main className="page-shell">
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

          <h1>{step === "login" ? tx("loginHeroTitle", "Sign in before booking") : t("heroTitle")}</h1>
          <p className="hero-sub">
            {step === "login"
              ? tx("loginHeroSub", "Use your phone and name once, then complete booking faster.")
              : t("heroSub")}
          </p>

          <div className="stepper">
            <span className={step === "login" ? "step-pill active" : "step-pill"}>
              1. {tx("stepLogin", "Login")}
            </span>
            <span className={step === "booking" ? "step-pill active" : "step-pill"}>
              2. {tx("stepBooking", "Booking")}
            </span>
          </div>

          {savedReferrerCode && (
            <p className="ref-chip">
              <span>{t("referralApplied")}: {savedReferrerCode}</span>
              <button type="button" className="ref-clear-btn" onClick={clearAppliedReferrer}>
                {t("clearReferral")}
              </button>
            </p>
          )}
        </header>

        {step === "login" ? (
          <section className="login-stage">
            <article className="login-card">
              <h2>{tx("loginTitle", "Welcome back")}</h2>
              <p>{tx("loginSub", "Enter your name and phone once to speed up booking.")}</p>
              <form className="login-form" onSubmit={startBookingAsMember} noValidate>
                <Field
                  id="loginName"
                  label={t("nameLabel")}
                  error={loginErrors.name}
                  input={
                    <input
                      id="loginName"
                      value={loginForm.name}
                      onChange={(e) => updateLoginField("name", e.target.value)}
                      placeholder={t("namePlaceholder")}
                      autoComplete="name"
                      aria-invalid={Boolean(loginErrors.name)}
                      aria-describedby={loginErrors.name ? "loginName-error" : undefined}
                    />
                  }
                />
                <Field
                  id="loginPhone"
                  label={t("phoneLabel")}
                  error={loginErrors.phone}
                  input={
                    <input
                      id="loginPhone"
                      value={loginForm.phone}
                      onChange={(e) => updateLoginField("phone", e.target.value)}
                      placeholder={t("phonePlaceholder")}
                      autoComplete="tel"
                      inputMode="tel"
                      aria-invalid={Boolean(loginErrors.phone)}
                      aria-describedby={loginErrors.phone ? "loginPhone-error" : undefined}
                    />
                  }
                />
                <div className="login-actions">
                  <button className="submit-btn" type="submit">
                    {tx("continueBooking", "Continue")}
                  </button>
                  <button type="button" className="ghost-btn" onClick={startBookingAsGuest}>
                    {tx("continueGuest", "Continue As Guest")}
                  </button>
                </div>
              </form>
            </article>
          </section>
        ) : !submitted ? (
          <form className="form" onSubmit={onSubmit} noValidate>
            <section className="profile-chip-row">
              <p className="profile-chip">
                {profile?.kind === "member"
                  ? `${tx("activeProfile", "Profile")}: ${profile.name}`
                  : tx("guestProfile", "Guest booking")}
              </p>
              <button type="button" className="ghost-link-btn" onClick={switchProfile}>
                {tx("switchProfile", "Switch")}
              </button>
            </section>

            <section className="form-section">
              <p className="section-title">{tx("sectionContact", "Contact")}</p>
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
                id="carPlate"
                label={tx("carPlateLabel", "Car plate number")}
                error={errors.carPlate}
                input={
                  <input
                    id="carPlate"
                    value={form.carPlate}
                    onChange={(e) => updateField("carPlate", normalizePlate(e.target.value))}
                    placeholder={tx("carPlatePlaceholder", "Example: BPL 1234")}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.carPlate)}
                    aria-describedby={errors.carPlate ? "carPlate-error" : undefined}
                  />
                }
              />
            </section>

            <section className="form-section">
              <p className="section-title">{tx("sectionLocation", "Location")}</p>
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
            </section>

            <section className="form-section">
              <p className="section-title">{tx("sectionService", "Service")}</p>
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
            </section>

            <section className="form-section">
              <p className="section-title">{tx("sectionMedia", "Photos")}</p>
              <div className="media-grid">
                <div className="media-card">
                  <p className="media-title">{tx("carPhotoLabel", "Car photo (take picture)")}</p>
                  <input
                    id="carPhoto"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => pickImageFile(e, setCarPhotoFile, setCarPhotoPreviewUrl)}
                  />
                  {carPhotoPreviewUrl ? (
                    <div className="media-preview-wrap">
                      <img src={carPhotoPreviewUrl} alt={tx("carPhotoPreviewAlt", "Car preview")} className="media-preview" />
                      <button
                        type="button"
                        className="ghost-link-btn"
                        onClick={() => clearImage(setCarPhotoFile, setCarPhotoPreviewUrl)}
                      >
                        {tx("removeMedia", "Remove")}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="media-card">
                  <p className="media-title">{tx("platePhotoLabel", "Plate photo (upload)")}</p>
                  <input
                    id="platePhoto"
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImageFile(e, setPlatePhotoFile, setPlatePhotoPreviewUrl)}
                  />
                  {platePhotoPreviewUrl ? (
                    <div className="media-preview-wrap">
                      <img src={platePhotoPreviewUrl} alt={tx("platePhotoPreviewAlt", "Plate preview")} className="media-preview" />
                      <button
                        type="button"
                        className="ghost-link-btn"
                        onClick={() => clearImage(setPlatePhotoFile, setPlatePhotoPreviewUrl)}
                      >
                        {tx("removeMedia", "Remove")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="quick-panel" aria-label={tx("quickSummaryTitle", "Booking preview")}>
              <p className="quick-panel-title">{tx("quickSummaryTitle", "Booking preview")}</p>
              <p>
                <strong>{tx("quickSummaryPlate", "Plate")}:</strong> {form.carPlate || tx("quickSummaryNotSelected", "-")}
              </p>
              <p>
                <strong>{tx("quickSummaryPlan", "Plan")}:</strong> {selectedPlanLabel}
              </p>
              <p>
                <strong>{tx("quickSummaryDate", "Date")}:</strong> {selectedDateLabel}
              </p>
              <p>
                <strong>{tx("quickSummarySlot", "Time slot")}:</strong> {selectedSlotLabel}
              </p>
            </section>

            <section className="trust-panel" aria-label={t("trustTitle")}>
              <p className="trust-title">{t("trustTitle")}</p>
              <div className="trust-tags">
                <span className="trust-tag">{tt("trustCompany")}</span>
                <span className="trust-tag">{t("trustHours")}</span>
                <span className="trust-tag">{t("priceHint")}</span>
              </div>
              {supportHref ? (
                <a className="support-link" href={supportHref} target="_blank" rel="noreferrer">
                  {tx("helpCta", "Need help on WhatsApp?")}
                </a>
              ) : (
                <button type="button" className="support-link support-link--disabled" disabled>
                  {tx("helpCtaDisabled", "WhatsApp support unavailable")}
                </button>
              )}
            </section>

            {submitError && <p className="submit-error">{submitError}</p>}
            {!submitError && configError && <p className="submit-error">{configError}</p>}
            {actionFeedback && <p className="submit-error">{actionFeedback}</p>}
            <button className="submit-btn" type="submit" disabled={submitting || !isSupabaseConfigured}>
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
              <p>
                <strong>{tx("summaryPlate", "Plate")}:</strong> {submitted.carPlate || "-"}
              </p>
              <p>
                <strong>{tx("summaryCarPhoto", "Car photo")}:</strong> {submitted.carPhotoName || tx("notUploaded", "Not uploaded")}
              </p>
              {submitted.carPhotoUrl ? (
                <p>
                  <a href={submitted.carPhotoUrl} target="_blank" rel="noreferrer">
                    {tx("viewCarPhoto", "View car photo")}
                  </a>
                </p>
              ) : null}
              <p>
                <strong>{tx("summaryPlatePhoto", "Plate photo")}:</strong> {submitted.platePhotoName || tx("notUploaded", "Not uploaded")}
              </p>
              {submitted.platePhotoUrl ? (
                <p>
                  <a href={submitted.platePhotoUrl} target="_blank" rel="noreferrer">
                    {tx("viewPlatePhoto", "View plate photo")}
                  </a>
                </p>
              ) : null}
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

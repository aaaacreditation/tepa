"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { countries, dialCodes } from "@/lib/countries";
import { SOURCES } from "@/lib/sources";
import { SME_FORM_LABEL, trackConversion } from "../../components/GoogleTag";
import { IconArrow, IconCheck } from "../../components/Icons";
import { metaTrack, newMetaEventId } from "../../components/MetaPixel";
import { openaiTrack } from "../../components/OpenAIPixel";
import {
  formatPhone,
  guessRegion,
  PhoneField,
  type PhoneValue,
  validPhone,
} from "../../components/PhoneField";
import { apply, positionSuggestions } from "../content";
import { useReadinessResult } from "./readiness-store";

/* Two steps, then a confirmation — the Fast Track form's shape, with the
   questions an SME advisor needs. Step 1 is who to contact; step 2 is the
   business. The submit is the conversion: the lead is stored, reported to
   Google Ads and to Meta in the request that saves it, exactly as on the
   other landing pages, and lands in the dashboard at /dashboard/sme.

   Every field is required. The closed answers are checked against the same
   lists in content.ts by app/api/sme/enquiry/route.ts; keep the two in step. */

type Stage = "details" | "business" | "done";

type Details = {
  fullName: string;
  position: string;
  email: string;
  /* The dialling code is picked, not typed; see PhoneField. */
  phoneRegion: string;
  phoneNumber: string;
  country: string;
  organization: string;
  website: string;
};

type Business = {
  sector: string;
  employees: string;
  timeline: string;
  contactMethod: string;
};

type Errors = Partial<Record<keyof Details | keyof Business, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WEBSITE_RE = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i;

function readAttribution() {
  if (typeof document === "undefined") return null;
  const prefix = `${ATTRIBUTION_COOKIE}=`;
  for (const part of document.cookie.split(";")) {
    const entry = part.trim();
    if (!entry.startsWith(prefix)) continue;
    try {
      return parseAttribution(decodeURIComponent(entry.slice(prefix.length)));
    } catch {
      return null;
    }
  }
  return null;
}

type ApplyFormProps = {
  /* Tighter spacing, for the hero card beside the copy. */
  compact?: boolean;
  title?: string;
};

export function ApplyForm({ compact = false, title = apply.formTitle }: ApplyFormProps) {
  const cardClass = compact ? "sap-card sap-card--compact" : "sap-card";
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const readinessResult = useReadinessResult();

  const [stage, setStage] = useState<Stage>("details");
  const [details, setDetails] = useState<Details>({
    fullName: "",
    position: "",
    email: "",
    phoneRegion: "",
    phoneNumber: "",
    country: "",
    organization: "",
    website: "",
  });
  const [business, setBusiness] = useState<Business>({
    sector: "",
    employees: "",
    timeline: "",
    contactMethod: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStage = useRef<Stage>(stage);
  /* Set once the visitor picks a code or a country themselves, after which
     neither guess gets to move it again. */
  const regionPinned = useRef(false);

  /* A first guess from the browser's own locale, in an effect because the
     server has no navigator. */
  useEffect(() => {
    const region = guessRegion();
    if (!region) return;
    setDetails((current) =>
      current.phoneRegion || regionPinned.current ? current : { ...current, phoneRegion: region },
    );
  }, []);

  /* Each stage swaps the card's content, so focus follows the new heading. */
  useEffect(() => {
    if (shownStage.current === stage) return;
    shownStage.current = stage;
    headingRef.current?.focus({ preventScroll: true });
    const card = headingRef.current?.closest(".sap-card");
    if (card && card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stage]);

  const phoneValue: PhoneValue = { region: details.phoneRegion, number: details.phoneNumber };

  function setDetail(name: keyof Details, value: string) {
    setDetails((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function setAnswer(name: keyof Business, value: string) {
    setBusiness((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function focusFirst(form: HTMLFormElement, next: Errors) {
    const first = Object.keys(next)[0];
    if (!first) return;
    const element = form.elements.namedItem(first);
    if (element instanceof RadioNodeList) {
      (element[0] as HTMLElement | undefined)?.focus();
    } else {
      (element as HTMLElement | null)?.focus();
    }
  }

  function onContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!details.fullName.trim()) next.fullName = "Please tell us your name.";
    if (!details.position.trim()) next.position = "Please tell us your position.";
    if (!EMAIL_RE.test(details.email.trim())) next.email = "Please use a valid email address.";
    if (!details.country) next.country = "Please choose your country.";
    if (!details.phoneRegion) {
      next.phoneNumber = "Please choose your country code.";
    } else if (!validPhone(phoneValue)) {
      next.phoneNumber = "Please check your phone number.";
    }
    if (!details.organization.trim()) next.organization = "Please add your business name.";
    if (!WEBSITE_RE.test(details.website.trim())) next.website = "Please add your website.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirst(event.currentTarget, next);
      return;
    }
    setStage("business");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: Errors = {};
    if (!business.sector) next.sector = "Please choose your sector.";
    if (!business.employees) next.employees = "Please choose how many people you employ.";
    if (!business.timeline) next.timeline = "Please choose a timeframe.";
    if (!business.contactMethod) next.contactMethod = "Please choose how we should contact you.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirst(event.currentTarget, next);
      return;
    }

    if (honeypot) {
      setStage("done");
      return;
    }

    setSending(true);
    setSubmitError("");
    const metaEventId = newMetaEventId();
    const phone = formatPhone(phoneValue);
    try {
      const response = await fetch("/api/sme/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: details.fullName.trim(),
          position: details.position.trim(),
          organization: details.organization.trim(),
          email: details.email.trim(),
          phone,
          country: details.country,
          website: details.website.trim(),
          sector: business.sector,
          employees: business.employees,
          timeline: business.timeline,
          contactMethod: business.contactMethod,
          readiness: readinessResult,
          company_website_confirm: honeypot,
          attribution: readAttribution(),
          metaEventId,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(body?.error ?? apply.errorGeneric);
        setSending(false);
        return;
      }

      /* Only once the server has stored the lead, as on the other pages. */
      trackConversion(SME_FORM_LABEL, { email: details.email.trim(), phone });
      metaTrack(
        "Lead",
        { content_name: SOURCES.sme.name, content_category: "sme" },
        metaEventId,
        {
          email: details.email,
          phone,
          fullName: details.fullName,
          country: details.country,
        },
      );
      /* ChatGPT ads. Same event id as the server's copy, so it counts once. */
      openaiTrack("lead_created", { type: "customer_action" }, metaEventId);

      setSending(false);
      setStage("done");
    } catch {
      setSubmitError(apply.errorGeneric);
      setSending(false);
    }
  }

  if (stage === "done") {
    /* Echo back the channel they picked, against the detail they gave. */
    const confirmLead =
      apply.contactConfirm[business.contactMethod as keyof typeof apply.contactConfirm] ??
      apply.contactConfirm.Email;
    const confirmValue = business.contactMethod === "Email" ? details.email.trim() : formatPhone(phoneValue);

    return (
      <div className={`${cardClass} sap-done`} role="status">
        <span className="sap-tick" aria-hidden="true">
          <IconCheck />
        </span>
        <p className="sap-kicker">{apply.doneKicker}</p>
        <h3 ref={headingRef} tabIndex={-1} className="sap-title">
          {apply.doneTitle}
        </h3>
        <p className="bk-confirm">
          {confirmLead} <strong>{confirmValue}</strong>.
        </p>
        <ul className="bk-checklist">
          {apply.doneItems.map((item) => (
            <li key={item.lead}>
              <IconCheck className="bk-check" />
              <span>
                <strong>{item.lead}</strong> {item.body}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <ol className="bk-progress" aria-label={`Step ${stage === "details" ? 1 : 2} of 2`}>
        {[1, 2].map((step) => {
          const current = stage === "details" ? 1 : 2;
          return (
            <li key={step} data-state={step < current ? "done" : step === current ? "current" : "todo"} />
          );
        })}
      </ol>
      <p className="sap-kicker">{stage === "details" ? apply.step1 : apply.step2}</p>
      <h3 ref={headingRef} tabIndex={-1} className="sap-title">
        {title}
      </h3>

      {stage === "details" ? (
        <form onSubmit={onContinue} noValidate className="sap-form">
          <div className="sap-two">
            <Field
              id={fieldId("fullName")}
              name="fullName"
              label="Full name"
              autoComplete="name"
              value={details.fullName}
              onChange={(value) => setDetail("fullName", value)}
              error={errors.fullName}
            />
            <Field
              id={fieldId("position")}
              name="position"
              label="Position"
              placeholder="e.g. Founder, CEO"
              autoComplete="organization-title"
              list={fieldId("positions")}
              value={details.position}
              onChange={(value) => setDetail("position", value)}
              error={errors.position}
            />
          </div>
          <datalist id={fieldId("positions")}>
            {positionSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>

          <div className="sap-two">
            <Field
              id={fieldId("email")}
              name="email"
              label="Work email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={details.email}
              onChange={(value) => setDetail("email", value)}
              error={errors.email}
            />
            <div className="form-field bk-field">
              <label htmlFor={fieldId("country")}>
                Country
                <Required />
              </label>
              <select
                id={fieldId("country")}
                name="country"
                value={details.country}
                onChange={(event) => {
                  const country = event.target.value;
                  setDetails((current) => ({
                    ...current,
                    country,
                    /* Helps someone who left the code alone; a code they chose
                       themselves is never overwritten. */
                    phoneRegion:
                      regionPinned.current || !dialCodes[country] ? current.phoneRegion : country,
                  }));
                  if (errors.country) setErrors((current) => ({ ...current, country: undefined }));
                }}
                required
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? fieldId("country-error") : undefined}
              >
                <option value="" disabled>
                  Select country
                </option>
                {countries.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              {errors.country ? (
                <p id={fieldId("country-error")} className="form-error">
                  {errors.country}
                </p>
              ) : null}
            </div>
          </div>

          <PhoneField
            id={fieldId("phone")}
            value={phoneValue}
            error={errors.phoneNumber}
            onChange={(next) => {
              if (next.region !== details.phoneRegion) regionPinned.current = true;
              setDetails((current) => ({ ...current, phoneRegion: next.region, phoneNumber: next.number }));
              if (errors.phoneNumber) setErrors((current) => ({ ...current, phoneNumber: undefined }));
            }}
          />

          <div className="sap-two">
            <Field
              id={fieldId("organization")}
              name="organization"
              label="Business name"
              placeholder="Registered name"
              autoComplete="organization"
              value={details.organization}
              onChange={(value) => setDetail("organization", value)}
              error={errors.organization}
            />
            <Field
              id={fieldId("website")}
              name="website"
              label="Website"
              inputMode="url"
              autoComplete="url"
              placeholder="yourbusiness.com"
              value={details.website}
              onChange={(value) => setDetail("website", value)}
              error={errors.website}
            />
          </div>

          <div aria-hidden="true" className="sap-honeypot">
            <label htmlFor={fieldId("hp")}>Do not fill this in</label>
            <input
              id={fieldId("hp")}
              name="company_website_confirm"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </div>

          <button type="submit" className="smex-btn smex-btn-gold sap-submit">
            {apply.continue} <IconArrow />
          </button>
          <p className="sap-note">{apply.note}</p>
        </form>
      ) : (
        <form onSubmit={onSubmit} noValidate className="sap-form">
          <ChipGroup
            name="sector"
            legend="Sector"
            options={apply.sectors}
            value={business.sector}
            onChange={(value) => setAnswer("sector", value)}
            error={errors.sector}
            errorId={fieldId("sector-error")}
            columns={3}
          />
          <ChipGroup
            name="employees"
            legend="Number of employees"
            options={apply.employeeCounts}
            value={business.employees}
            onChange={(value) => setAnswer("employees", value)}
            error={errors.employees}
            errorId={fieldId("employees-error")}
          />
          <ChipGroup
            name="timeline"
            legend="When do you want to be accredited?"
            options={apply.timelines}
            value={business.timeline}
            onChange={(value) => setAnswer("timeline", value)}
            error={errors.timeline}
            errorId={fieldId("timeline-error")}
          />
          <ChipGroup
            name="contactMethod"
            legend={apply.contactLegend}
            options={apply.contactMethods}
            value={business.contactMethod}
            onChange={(value) => setAnswer("contactMethod", value)}
            error={errors.contactMethod}
            errorId={fieldId("contactMethod-error")}
          />

          {readinessResult ? (
            <p className="sap-readiness">
              {apply.readinessNote}{" "}
              <strong>
                {readinessResult.score}% · {readinessResult.level}
              </strong>
            </p>
          ) : null}

          {submitError ? (
            <p role="alert" className="sap-submit-error">
              {submitError}
            </p>
          ) : null}

          <div className="bk-actions">
            <button
              type="button"
              className="bk-back"
              onClick={() => {
                setErrors({});
                setStage("details");
              }}
            >
              {apply.back}
            </button>
            <button type="submit" disabled={sending} className="smex-btn smex-btn-gold sap-submit">
              {sending ? (
                <>
                  <span className="sap-spinner" aria-hidden="true" />
                  {apply.submitting}
                </>
              ) : (
                <>
                  {apply.submit} <IconArrow />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* Every field on this form is required, so the marker is part of the label.
   Hidden from screen readers, which announce the input's own required state. */
function Required() {
  return (
    <span className="bk-req" aria-hidden="true">
      *
    </span>
  );
}

type FieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  list?: string;
  error?: string;
};

function Field({ id, name, label, value, onChange, type = "text", inputMode, autoComplete, placeholder, list, error }: FieldProps) {
  return (
    <div className="form-field bk-field">
      <label htmlFor={id}>
        {label}
        <Required />
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder ?? label}
        list={list}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="form-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type ChipGroupProps = {
  name: string;
  legend: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  errorId: string;
  columns?: number;
};

/* Real radio inputs under the chips, so keyboard and screen reader users get
   an ordinary radio group. */
function ChipGroup({ name, legend, options, value, onChange, error, errorId, columns }: ChipGroupProps) {
  return (
    <fieldset className="bk-group" aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}>
      <legend>
        {legend}
        <Required />
      </legend>
      <div
        className="bk-chips"
        data-columns={columns}
        style={columns ? ({ "--bk-columns": columns } as React.CSSProperties) : undefined}
      >
        {options.map((option) => (
          <label key={option} className="bk-chip" data-checked={value === option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              required
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="form-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

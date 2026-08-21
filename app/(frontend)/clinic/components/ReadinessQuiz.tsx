"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { countries } from "@/lib/countries";
import { CLINIC_FORM_LABEL, trackConversion } from "../../components/GoogleTag";
import {
  IconArrow,
  IconArrowLeft,
  IconCheck,
  IconCircle,
  IconMinus,
} from "../../components/Icons";
import { formCopy, result as resultCopy, site } from "../content";
import {
  computeScore,
  type DomainKey,
  type DomainScores,
  type ProfileKey,
  QUESTION_COUNT,
  ROLES,
  SCALE,
  type ScoreResult,
  STEPS,
} from "../quiz";
import { ScoreRing } from "./ScoreRing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WEBSITE_RE = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i;

function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

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

const MARKS = { check: IconCheck, half: IconMinus, empty: IconCircle } as const;

type LeadFields = {
  fullName: string;
  organization: string;
  role: string;
  country: string;
  email: string;
  phone: string;
  website: string;
};

type LeadErrors = Partial<Record<keyof LeadFields | "consent", string>>;

const EMPTY_LEAD: LeadFields = {
  fullName: "",
  organization: "",
  role: "",
  country: "",
  email: "",
  phone: "",
  website: "",
};

export function ReadinessQuiz() {
  const uid = useId();
  const [current, setCurrent] = useState(0);
  const [profile, setProfile] = useState<Partial<Record<ProfileKey, string>>>({});
  const [scores, setScores] = useState<DomainScores>({});
  const [lead, setLead] = useState<LeadFields>(EMPTY_LEAD);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "failed">("idle");
  const [submitError, setSubmitError] = useState("");
  const [scored, setScored] = useState<ScoreResult | null>(null);

  const shellRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /* The first render must not steal focus or scroll — the quiz sits below the
     hero and the visitor has not asked to go there yet. */
  const mounted = useRef(false);

  const step = STEPS[current];
  const total = STEPS.length - 1;
  const percent = Math.min(100, Math.round((current / total) * 100));

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    shellRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    /* Moving focus to the new question is what makes the step change audible
       to a screen reader; without it the swap is silent. */
    headingRef.current?.focus();
  }, [current]);

  const advance = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, STEPS.length - 1));
  }, []);

  function pickProfile(id: ProfileKey, value: string) {
    setProfile((p) => ({ ...p, [id]: value }));
    window.setTimeout(advance, 220);
  }

  function pickScale(domain: DomainKey, value: number) {
    setScores((s) => ({ ...s, [domain]: value }));
    window.setTimeout(advance, 220);
  }

  function setField<K extends keyof LeadFields>(key: K, value: string) {
    setLead((l) => ({ ...l, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: LeadErrors = {};
    if (!lead.fullName.trim()) next.fullName = "Please tell us your name.";
    if (!lead.organization.trim()) next.organization = "Please add your clinic name.";
    if (!lead.role) next.role = "Please choose your role.";
    if (!lead.country) next.country = "Please choose your country.";
    if (!EMAIL_RE.test(lead.email.trim())) next.email = "Please use a valid email address.";
    if (!validPhone(lead.phone.trim())) {
      next.phone = "Please add a phone number with your country code.";
    }
    /* Website is the one optional field, so it is only checked when filled. */
    if (lead.website.trim() && !WEBSITE_RE.test(lead.website.trim())) {
      next.website = "That does not look like a website address.";
    }
    if (!consent) next.consent = formCopy.consentError;

    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      document.getElementById(`${uid}-${firstInvalid}`)?.focus();
      return;
    }

    setStatus("sending");
    setSubmitError("");

    try {
      const response = await fetch("/api/clinic/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lead,
          consent,
          profile,
          scores,
          attribution: readAttribution(),
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(body?.error ?? formCopy.errorGeneric);
        setStatus("failed");
        return;
      }

      /* Only after the server confirmed the lead was stored. */
      trackConversion(CLINIC_FORM_LABEL, {
        email: lead.email.trim(),
        phone: lead.phone.trim(),
      });

      /* The server recomputes the score from the raw answers, so what the
         visitor is shown is exactly what was recorded against their lead. */
      setScored(body?.result ?? computeScore(scores));
      setStatus("idle");
      advance();
    } catch {
      setSubmitError(formCopy.errorGeneric);
      setStatus("failed");
    }
  }

  /* ---------------------------------------------------------------- render */

  const questionNumber = STEPS.slice(0, current + 1).filter(
    (s) => s.kind === "profile" || s.kind === "scale",
  ).length;

  return (
    <div className="cl-shell" ref={shellRef}>
      <div
        className="cl-progress"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Assessment progress"
      >
        <i style={{ width: `${step.kind === "result" ? 100 : percent}%` }} />
      </div>

      <div className="cl-pad">
        {step.kind === "result" && scored ? (
          <Result scored={scored} headingRef={headingRef} />
        ) : (
          <div className="cl-step" key={current}>
            <div className="cl-step-meta">
              <span className="cl-step-tag">{step.kind === "result" ? "" : step.tag}</span>
              <span className="cl-step-count">
                {step.kind === "lead"
                  ? "Last step"
                  : `Step ${questionNumber} of ${QUESTION_COUNT}`}
              </span>
            </div>

            <h2 className="cl-q" tabIndex={-1} ref={headingRef}>
              {step.kind === "result" ? "" : step.question}
            </h2>
            {step.kind !== "result" && step.help ? (
              <p className="cl-help">{step.help}</p>
            ) : null}

            {step.kind === "profile" ? (
              <ul className="cl-opts">
                {step.options.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      className="cl-opt"
                      aria-pressed={profile[step.id] === option}
                      onClick={() => pickProfile(step.id, option)}
                    >
                      <span className="cl-tick" aria-hidden="true" />
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {step.kind === "scale" ? (
              <ul className="cl-opts cl-opts--scale">
                {SCALE.map((option) => {
                  const Mark = MARKS[option.mark];
                  return (
                    <li key={option.label}>
                      <button
                        type="button"
                        className="cl-opt"
                        aria-pressed={scores[step.domain] === option.value}
                        onClick={() => pickScale(step.domain, option.value)}
                      >
                        <span className={`cl-mark cl-mark--${option.mark}`} aria-hidden="true">
                          <Mark />
                        </span>
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {step.kind === "lead" ? (
              <form onSubmit={submit} noValidate>
                <div className="cl-form-grid">
                  <Field
                    id={`${uid}-fullName`}
                    label="Full name"
                    required
                    value={lead.fullName}
                    onChange={(v) => setField("fullName", v)}
                    autoComplete="name"
                    placeholder="Jane Doe"
                    error={errors.fullName}
                  />
                  <Field
                    id={`${uid}-organization`}
                    label="Clinic / organization"
                    required
                    value={lead.organization}
                    onChange={(v) => setField("organization", v)}
                    autoComplete="organization"
                    placeholder="Your clinic name"
                    error={errors.organization}
                  />
                  <SelectField
                    id={`${uid}-role`}
                    label="Your role"
                    required
                    value={lead.role}
                    onChange={(v) => setField("role", v)}
                    placeholder="Select…"
                    options={ROLES.map((r) => [r, r])}
                    error={errors.role}
                  />
                  <SelectField
                    id={`${uid}-country`}
                    label="Country"
                    required
                    value={lead.country}
                    onChange={(v) => setField("country", v)}
                    placeholder="Select…"
                    options={countries.map(([code, name]) => [code, name])}
                    error={errors.country}
                  />
                  <Field
                    id={`${uid}-email`}
                    label="Work email"
                    required
                    type="email"
                    inputMode="email"
                    value={lead.email}
                    onChange={(v) => setField("email", v)}
                    autoComplete="email"
                    placeholder="you@clinic.com"
                    error={errors.email}
                  />
                  <Field
                    id={`${uid}-phone`}
                    label="Phone (with country code)"
                    required
                    type="tel"
                    inputMode="tel"
                    value={lead.phone}
                    onChange={(v) => setField("phone", v)}
                    autoComplete="tel"
                    placeholder="+1 555 000 0000"
                    error={errors.phone}
                  />
                  <Field
                    id={`${uid}-website`}
                    label="Clinic website"
                    optional
                    inputMode="url"
                    value={lead.website}
                    onChange={(v) => setField("website", v)}
                    autoComplete="url"
                    placeholder="https://"
                    error={errors.website}
                  />

                  <label className="cl-consent" data-invalid={Boolean(errors.consent)}>
                    <input
                      id={`${uid}-consent`}
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>{formCopy.consent}</span>
                  </label>

                  {submitError ? (
                    <p role="alert" className="cl-submit-error">
                      {submitError}
                    </p>
                  ) : null}
                </div>

                <div className="cl-nav">
                  <button
                    type="button"
                    className="cl-back"
                    onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  >
                    <IconArrowLeft className="cl-ico" />
                    {formCopy.back}
                  </button>
                  <button
                    type="submit"
                    className="cl-btn cl-btn--navy"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? (
                      <>
                        <span className="cl-spinner" aria-hidden="true" />
                        {formCopy.submitting}
                      </>
                    ) : (
                      <>
                        {formCopy.submit}
                        <IconArrow className="cl-ico" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="cl-nav">
                <button
                  type="button"
                  className="cl-back"
                  hidden={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                >
                  <IconArrowLeft className="cl-ico" />
                  {formCopy.back}
                </button>
                <span />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ result */

function Result({
  scored,
  headingRef,
}: {
  scored: ScoreResult;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  /* Bars and ring start at zero and are driven to their value one frame later,
     so the transition has something to animate from. */
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const tone =
    scored.band.key === "ready" ? "good" : scored.band.key === "nearly" ? "warn" : "weak";

  return (
    <div className="cl-step">
      <div className="cl-result-head">
        <span className={`cl-band cl-band--${tone}`}>{scored.band.label}</span>

        <ScoreRing percent={shown ? scored.percent : 0} display={scored.percent} />

        <h2 tabIndex={-1} ref={headingRef}>
          {scored.band.heading}
        </h2>
        <p>{scored.band.copy}</p>
      </div>

      <h3 className="cl-sr">{resultCopy.breakdownTitle}</h3>
      <ul className="cl-breakdown">
        {scored.domains.map((domain) => (
          <li className="cl-dom" key={domain.key}>
            <div className="cl-dom-top">
              <h3>{domain.name}</h3>
              <span className={`cl-pill cl-pill--${domain.tone}`}>{domain.label}</span>
            </div>
            <div className="cl-bar">
              <i
                data-tone={domain.tone}
                style={{ width: `${shown ? domain.percent : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="cl-result-cta">
        <h3>{resultCopy.ctaTitle}</h3>
        <p>{resultCopy.ctaBody}</p>
        <div className="cl-cta-btns">
          <a className="cl-btn cl-btn--white" href={site.clinicProgramme}>
            {resultCopy.ctaPrimary}
            <IconArrow className="cl-ico" />
          </a>
          <a className="cl-btn cl-btn--ghost" href={`mailto:${site.email}`}>
            {resultCopy.ctaSecondary}
          </a>
        </div>
      </div>

      <p className="cl-saved">{resultCopy.savedNote}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ fields */

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  required,
  optional,
  error,
}: FieldProps) {
  return (
    <div className={`cl-field${optional ? " cl-field--full" : ""}`}>
      <label htmlFor={id}>
        {label} {required ? <span className="req">*</span> : null}
        {optional ? <span className="opt">({formCopy.optional})</span> : null}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="cl-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: ReadonlyArray<readonly [string, string]>;
  required?: boolean;
  error?: string;
};

function SelectField({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
  required,
  error,
}: SelectFieldProps) {
  return (
    <div className="cl-field">
      <label htmlFor={id}>
        {label} {required ? <span className="req">*</span> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(([optValue, text]) => (
          <option key={optValue} value={optValue}>
            {text}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className="cl-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

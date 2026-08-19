"use client";

import { useId, useState } from "react";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { countries } from "@/lib/countries";
import { CLINIC_FORM_LABEL, trackConversion } from "../../components/GoogleTag";
import { IconArrow, IconCheck, IconLock } from "../icons";
import { formCopy, site } from "../content";

type RequiredField = "fullName" | "organization" | "email" | "phone" | "country";
type Errors = Partial<Record<RequiredField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* 7 to 15 digits covers every national numbering plan. Punctuation and a
   leading + are the visitor's business; only the digit count is checked. */
function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/* Read the attribution cookie the landing page wrote so the click id can ride
   along in the request body as well as the Cookie header. */
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

type ConsultationFormProps = {
  /* The page renders this form twice; the heading is the only thing that
     differs between the hero and the closing section. */
  badge?: string;
  title?: string;
  lede?: string;
  /* Both placements are a normal vertical form — one field per row, submit
     underneath. The value only picks the trim: `panel` is the hero card
     sitting beside the headline, `stack` is the closing card. */
  layout?: "panel" | "stack";
};

export function ConsultationForm({
  badge = formCopy.badge,
  title = formCopy.title,
  lede = formCopy.lede,
  layout = "panel",
}: ConsultationFormProps) {
  const uid = useId();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");

  const fieldId = (name: string) => `${uid}-${name}`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    const next: Errors = {};
    if (!data.fullName?.trim()) next.fullName = "Please tell us your name.";
    if (!data.organization?.trim()) next.organization = "Please add your clinic name.";
    if (!EMAIL_RE.test(data.email?.trim() ?? "")) {
      next.email = "Please use a valid email address.";
    }
    if (!validPhone(data.phone?.trim() ?? "")) {
      next.phone = "Please add a number with your country code.";
    }
    if (!data.country) next.country = "Please choose your country.";

    setErrors(next);
    const firstInvalid = Object.keys(next)[0] as RequiredField | undefined;
    if (firstInvalid) {
      (form.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
      return;
    }

    if (data.company_website_confirm) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/clinic/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        /* The server reads the click id from the cookie; this copy is the
           fallback for browsers that dropped it before submit. */
        body: JSON.stringify({ ...data, attribution: readAttribution() }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(body?.error ?? formCopy.errorGeneric);
        setStatus("failed");
        return;
      }

      /* Only after the server confirmed the lead was stored. Firing on submit
         would count enquiries that never actually arrived. */
      trackConversion(CLINIC_FORM_LABEL, {
        email: data.email?.trim(),
        phone: data.phone?.trim(),
      });

      form.reset();
      setStatus("sent");
    } catch {
      setMessage(formCopy.errorGeneric);
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className={`cl-form-card cl-form-card--${layout} cl-form-done`} role="status">
        <span className="cl-form-tick">
          <IconCheck />
        </span>
        <h2>{formCopy.successTitle}</h2>
        <p>{formCopy.successBody}</p>
        <p className="cl-form-done-mail">
          Need it sooner? Email <a href={`mailto:${site.email}`}>{site.email}</a> or
          call <a href={site.phoneHref}>{site.phoneLabel}</a>.
        </p>
      </div>
    );
  }

  return (
    <div className={`cl-form-card cl-form-card--${layout}`}>
      <div className="cl-form-intro">
        <p className="cl-form-badge">{badge}</p>
        <h2>{title}</h2>
        <p className="cl-form-lede">{lede}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="cl-form">
        <div className="cl-form-fields">
          <Field
            id={fieldId("fullName")}
            name="fullName"
            label="Full name"
            autoComplete="name"
            placeholder="Full name"
            error={errors.fullName}
          />
          <Field
            id={fieldId("organization")}
            name="organization"
            label="Clinic or organization"
            autoComplete="organization"
            placeholder="Clinic or organization"
            error={errors.organization}
          />
          <Field
            id={fieldId("email")}
            name="email"
            label="Work email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Work email"
            error={errors.email}
          />
          <Field
            id={fieldId("phone")}
            name="phone"
            label="Phone or WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Phone or WhatsApp"
            error={errors.phone}
          />
          <div className="cl-field cl-field--wide">
            <label htmlFor={fieldId("country")}>Country</label>
            <select
              id={fieldId("country")}
              name="country"
              defaultValue=""
              aria-invalid={Boolean(errors.country)}
              aria-describedby={
                errors.country ? `${fieldId("country")}-error` : undefined
              }
            >
              <option value="" disabled>
                Country
              </option>
              {countries.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            {errors.country ? (
              <p id={`${fieldId("country")}-error`} className="cl-field-error">
                {errors.country}
              </p>
            ) : null}
          </div>
        </div>

        <div aria-hidden="true" className="cl-honeypot">
          <label htmlFor={fieldId("hp")}>Do not fill this in</label>
          <input
            id={fieldId("hp")}
            name="company_website_confirm"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="cl-form-action">
          {status === "failed" ? (
            <p role="alert" className="cl-form-error">
              {message || formCopy.errorGeneric}
            </p>
          ) : null}

          <button type="submit" disabled={status === "sending"} className="cl-btn cl-btn--gold">
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

          <p className="cl-form-note">
            <IconLock />
            {formCopy.note}
          </p>
        </div>
      </form>
    </div>
  );
}

type FieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  error?: string;
};

/* The visible label is the placeholder, as in the approved artwork, but a real
   label is still rendered and visually hidden — a placeholder disappears the
   moment someone types, and it is not a label to a screen reader at all. */
function Field({
  id,
  name,
  label,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  error,
}: FieldProps) {
  return (
    <div className="cl-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
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

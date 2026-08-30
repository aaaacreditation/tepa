"use client";

import { useId, useState } from "react";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { countries } from "@/lib/countries";
import { HEALTHCARE_FORM_LABEL, trackConversion } from "../../components/GoogleTag";
import { facilityTypes, formCopy, site } from "../content";
import { IconArrow, IconCheck, IconLock } from "../../components/Icons";

type RequiredField =
  | "fullName"
  | "organization"
  | "facilityType"
  | "email"
  | "phone"
  | "country"
  | "website";
type Errors = Partial<Record<RequiredField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/* Anything with a dot-separated domain counts; visitors paste websites with
   and without a scheme and rejecting either loses the lead. */
const WEBSITE_RE = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i;

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

type EnquiryFormProps = {
  /* Both placements are a normal vertical form — one field per row, submit
     underneath. The value only picks the trim: `panel` is the hero card
     sitting beside the headline, `stack` is the closing card. */
  layout?: "panel" | "stack";
};

/* The same card /clinic uses, carrying the healthcare enquiry: seven fields
   the surveyor needs to pick the applicable standards, plus an optional note
   on scope. It posts to /api/healthcare/enquiry, which stores the lead under
   the "healthcare" source and queues the Healthcare Enquiry conversion. */
export function EnquiryForm({ layout = "panel" }: EnquiryFormProps) {
  const uid = useId();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");

  const fieldId = (name: string) => `${uid}-${name}`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    /* Mirrors the server checks in app/api/healthcare/enquiry/route.ts; keep
       the two in step. */
    const next: Errors = {};
    if (!data.fullName?.trim()) next.fullName = "Please tell us your name.";
    if (!data.organization?.trim()) next.organization = "Please add your facility name.";
    if (!data.facilityType) next.facilityType = "Please choose a facility type.";
    if (!EMAIL_RE.test(data.email?.trim() ?? "")) {
      next.email = "Please use a valid email address.";
    }
    if (!validPhone(data.phone?.trim() ?? "")) {
      next.phone = "Please add a phone number with your country code.";
    }
    if (!data.country) next.country = "Please choose your country.";
    if (!WEBSITE_RE.test(data.website?.trim() ?? "")) {
      next.website = "Please add your website.";
    }

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
      const response = await fetch("/api/healthcare/enquiry", {
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
         would count enquiries that never actually arrived. A blank label is a
         no-op: the server upload is what counts the lead today. */
      trackConversion(HEALTHCARE_FORM_LABEL, {
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
      <div className={`hc-form-card hc-form-card--${layout} hc-form-done`} role="status">
        <span className="hc-form-tick">
          <IconCheck />
        </span>
        <h2>{formCopy.successTitle}</h2>
        <p>{formCopy.successBody}</p>
        <p className="hc-form-done-mail">
          Need it sooner? Email <a href={`mailto:${site.email}`}>{site.email}</a> or
          call <a href={site.phoneHref}>{site.phoneLabel}</a>.
        </p>
      </div>
    );
  }

  return (
    <div className={`hc-form-card hc-form-card--${layout}`}>
      <form onSubmit={onSubmit} noValidate className="hc-form">
        <div className="hc-form-fields">
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
            label="Facility name"
            autoComplete="organization"
            placeholder="Facility name"
            error={errors.organization}
          />
          <Select
            id={fieldId("facilityType")}
            name="facilityType"
            label="Facility type"
            placeholder="Facility type"
            options={facilityTypes.map((type) => [type, type])}
            error={errors.facilityType}
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
            placeholder="Phone or WhatsApp (with country code)"
            error={errors.phone}
          />
          <Select
            id={fieldId("country")}
            name="country"
            label="Country"
            placeholder="Country"
            options={countries.map(([code, name]) => [code, name])}
            error={errors.country}
          />
          <Field
            id={fieldId("website")}
            name="website"
            label="Website"
            inputMode="url"
            autoComplete="url"
            placeholder="Website"
            error={errors.website}
          />
          <div className="hc-field">
            <label htmlFor={fieldId("message")}>Scope of services (optional)</label>
            <textarea
              id={fieldId("message")}
              name="message"
              rows={3}
              placeholder="Scope of services (optional): departments, bed count, specialties, accreditation you already hold"
            />
          </div>
        </div>

        <div aria-hidden="true" className="hc-honeypot">
          <label htmlFor={fieldId("hp")}>Do not fill this in</label>
          <input
            id={fieldId("hp")}
            name="company_website_confirm"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="hc-form-action">
          {status === "failed" ? (
            <p role="alert" className="hc-form-error">
              {message || formCopy.errorGeneric}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "sending"}
            className="hc-button hc-button--primary"
          >
            {status === "sending" ? (
              <>
                <span className="hc-spinner" aria-hidden="true" />
                {formCopy.submitting}
              </>
            ) : (
              <>
                {formCopy.submit}
                <IconArrow className="hc-icon" />
              </>
            )}
          </button>

          <p className="hc-form-note">
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

/* The visible label is the placeholder, as on /clinic, but a real label is
   still rendered and visually hidden — a placeholder disappears the moment
   someone types, and it is not a label to a screen reader at all. */
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
    <div className="hc-field">
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
        <p id={`${id}-error`} className="hc-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SelectProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: ReadonlyArray<readonly [string, string]>;
  error?: string;
};

function Select({ id, name, label, placeholder, options, error }: SelectProps) {
  return (
    <div className="hc-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name}
        defaultValue=""
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className="hc-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

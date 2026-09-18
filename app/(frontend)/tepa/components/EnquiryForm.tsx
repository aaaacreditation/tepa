"use client";

import { useId, useState } from "react";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { countries } from "@/lib/countries";
import { formCopy, positionSuggestions, site } from "../content";
import { SOURCES } from "@/lib/sources";
import { FORM_LABEL, trackConversion } from "../../components/GoogleTag";
import { metaTrack, newMetaEventId } from "../../components/MetaPixel";
import { IconArrow, IconCheck } from "./Icons";

type RequiredField =
  | "fullName"
  | "position"
  | "organization"
  | "email"
  | "phone"
  | "country"
  | "website"
  | "message";
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
  /* The page renders this form twice; the heading is the only thing that
     differs between the hero copy and the closing section. */
  badge?: string;
  title?: string;
};

export function EnquiryForm({
  badge = formCopy.badge,
  title = formCopy.title,
}: EnquiryFormProps) {
  const uid = useId();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");

  const fieldId = (name: string) => `${uid}-${name}`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    /* Every field is required. Mirrors the server checks in
       app/api/tepa/enquiry/route.ts; keep the two in step. */
    const next: Errors = {};
    if (!data.fullName?.trim()) next.fullName = "Please tell us your name.";
    if (!data.position?.trim()) next.position = "Please tell us your position.";
    if (!data.organization?.trim()) next.organization = "Please add your organization.";
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
    if (!data.message?.trim()) {
      next.message = "Please tell us which programs you want accredited.";
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
    /* Minted here so the pixel's Lead below and the server's Conversions API
       call carry the same id, and Meta counts one enquiry rather than two. */
    const metaEventId = newMetaEventId();
    try {
      const response = await fetch("/api/tepa/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        /* The server reads the click id from the cookie; this copy is the
           fallback for browsers that dropped it before submit. */
        body: JSON.stringify({ ...data, attribution: readAttribution(), metaEventId }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(body?.error ?? formCopy.errorGeneric);
        setStatus("failed");
        return;
      }

      /* Only after the server confirmed the lead was stored. Firing on submit
         would count enquiries that never actually arrived. */
      trackConversion(FORM_LABEL, { email: data.email?.trim(), phone: data.phone?.trim() });
      metaTrack(
        "Lead",
        { content_name: SOURCES.tepa.name, content_category: "tepa" },
        metaEventId,
        {
          email: data.email,
          phone: data.phone,
          fullName: data.fullName,
          country: data.country,
        },
      );

      form.reset();
      setStatus("sent");
    } catch {
      setMessage(formCopy.errorGeneric);
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="eligibility-card eligibility-success" role="status">
        <span className="success-icon">
          <IconCheck />
        </span>
        <p className="form-kicker">Thank you</p>
        <h2>{formCopy.successTitle}</h2>
        <p>{formCopy.successBody}</p>
        <p>
          Need it sooner? Email <a href={`mailto:${site.email}`}>{site.email}</a>
        </p>
      </div>
    );
  }

  return (
    <div className="eligibility-card">
      <div className="form-heading">
        <p className="form-kicker">{badge}</p>
        <h2>{title}</h2>
      </div>

      <form onSubmit={onSubmit} noValidate className="eligibility-form">
        <FormField
          id={fieldId("fullName")}
          name="fullName"
          label="Full name"
          autoComplete="name"
          placeholder="Full name"
          error={errors.fullName}
        />

        {/* Free text with suggestions rather than a fixed list: the exact
            title is what sales wants to see, and a list would only ever miss
            one. */}
        <FormField
          id={fieldId("position")}
          name="position"
          label="Position"
          autoComplete="organization-title"
          placeholder="Position (e.g. CEO, COO, Quality Manager)"
          list={fieldId("positions")}
          error={errors.position}
        />
        <datalist id={fieldId("positions")}>
          {positionSuggestions.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>

        <FormField
          id={fieldId("organization")}
          name="organization"
          label="Organization"
          autoComplete="organization"
          placeholder="Organization"
          error={errors.organization}
        />

        <FormField
          id={fieldId("email")}
          name="email"
          label="Work email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Work email"
          error={errors.email}
        />

        <FormField
          id={fieldId("phone")}
          name="phone"
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Phone number, with country code"
          error={errors.phone}
        />

        <div className="form-field">
          <label htmlFor={fieldId("country")}>Country</label>
          <select
            id={fieldId("country")}
            name="country"
            defaultValue=""
            required
            aria-invalid={Boolean(errors.country)}
            aria-describedby={errors.country ? fieldId("country-error") : undefined}
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
            <p id={fieldId("country-error")} className="form-error">
              {errors.country}
            </p>
          ) : null}
        </div>

        <FormField
          id={fieldId("website")}
          name="website"
          label="Website"
          inputMode="url"
          autoComplete="url"
          placeholder="Website"
          error={errors.website}
        />

        <div className="form-field">
          <label htmlFor={fieldId("message")}>Programs for accreditation</label>
          <textarea
            id={fieldId("message")}
            name="message"
            rows={3}
            required
            placeholder="Programs for accreditation"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? fieldId("message-error") : undefined}
          />
          {errors.message ? (
            <p id={fieldId("message-error")} className="form-error">
              {errors.message}
            </p>
          ) : null}
        </div>

        <div aria-hidden="true" className="honeypot">
          <label htmlFor={fieldId("hp")}>Do not fill this in</label>
          <input
            id={fieldId("hp")}
            name="company_website_confirm"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {status === "failed" ? (
          <p role="alert" className="form-submit-error">
            {message || formCopy.errorGeneric}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="tepa-button tepa-button--navy form-submit"
        >
          {status === "sending" ? (
            <>
              <span className="form-spinner" aria-hidden="true" />
              {formCopy.submitting}
            </>
          ) : (
            <>
              {formCopy.submit}
              <IconArrow className="button-icon" />
            </>
          )}
        </button>

        <p className="form-note">
          <span aria-hidden="true">▣</span>
          {formCopy.note}
        </p>
      </form>
    </div>
  );
}

type FormFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  /* id of a <datalist> offering suggestions; the field still takes any text. */
  list?: string;
  error?: string;
};

/* Every field on this form is required. The form runs with noValidate so the
   messages in onSubmit are the ones shown, but the attribute still tells
   assistive technology that the field is mandatory. */
function FormField({
  id,
  name,
  label,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  list,
  error,
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        list={list}
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

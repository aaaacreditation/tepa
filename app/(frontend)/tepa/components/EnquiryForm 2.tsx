"use client";

import { useId, useState } from "react";
import { formCopy, site } from "../content";
import { countries } from "@/lib/countries";
import { IconArrow, IconCalendar, IconCheck } from "./Icons";

type Errors = Partial<Record<"fullName" | "organization" | "email" | "country", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function EnquiryForm() {
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
    if (!data.organization?.trim()) next.organization = "Please add your organization.";
    if (!EMAIL_RE.test(data.email?.trim() ?? "")) next.email = "Please use a valid email address.";
    if (!data.country) next.country = "Please choose your country.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    // Honeypot: real people leave this empty.
    if (data.company_website_confirm) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/tepa/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(body?.error ?? formCopy.errorGeneric);
        setStatus("failed");
        return;
      }
      form.reset();
      setStatus("sent");
    } catch {
      setMessage(formCopy.errorGeneric);
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="card-lift rounded-2xl border border-navy-500/10 bg-white p-8 text-center sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy-50 text-navy-500">
          <IconCheck className="h-7 w-7" />
        </div>
        <h3 className="display mt-5 text-2xl text-navy-800">{formCopy.successTitle}</h3>
        <p className="lede mt-3 text-[0.9375rem] leading-relaxed text-ink-500">
          {formCopy.successBody}
        </p>
        <a
          href={site.calendly}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-navy mt-6 w-full"
        >
          <IconCalendar className="h-4 w-4" />
          {formCopy.successCta}
        </a>
      </div>
    );
  }

  return (
    <div className="card-lift overflow-hidden rounded-2xl border border-white/12 bg-white">
      <div className="deep-field-flat relative px-7 py-5">
        <span className="eyebrow text-gold-300">{formCopy.badge}</span>
        <h2 className="display mt-1.5 text-[1.35rem] leading-snug text-white">{formCopy.title}</h2>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-3.5 px-7 py-6">
        <div>
          <label className="field-label" htmlFor={fieldId("fullName")}>
            Full name *
          </label>
          <input
            id={fieldId("fullName")}
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            className="field"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? fieldId("fullName-err") : undefined}
          />
          {errors.fullName && (
            <p id={fieldId("fullName-err")} className="mt-1.5 text-xs text-[#c0483c]">
              {errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor={fieldId("organization")}>
            Organization *
          </label>
          <input
            id={fieldId("organization")}
            name="organization"
            type="text"
            autoComplete="organization"
            placeholder="Your training company"
            className="field"
            aria-invalid={Boolean(errors.organization)}
            aria-describedby={errors.organization ? fieldId("organization-err") : undefined}
          />
          {errors.organization && (
            <p id={fieldId("organization-err")} className="mt-1.5 text-xs text-[#c0483c]">
              {errors.organization}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor={fieldId("email")}>
              Work email *
            </label>
            <input
              id={fieldId("email")}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="field"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? fieldId("email-err") : undefined}
            />
            {errors.email && (
              <p id={fieldId("email-err")} className="mt-1.5 text-xs text-[#c0483c]">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor={fieldId("phone")}>
              Phone
            </label>
            <input
              id={fieldId("phone")}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 555 000 1234"
              className="field"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor={fieldId("country")}>
              Country *
            </label>
            <select
              id={fieldId("country")}
              name="country"
              defaultValue=""
              className="field"
              aria-invalid={Boolean(errors.country)}
              aria-describedby={errors.country ? fieldId("country-err") : undefined}
            >
              <option value="" disabled>
                Select a country
              </option>
              {countries.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            {errors.country && (
              <p id={fieldId("country-err")} className="mt-1.5 text-xs text-[#c0483c]">
                {errors.country}
              </p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor={fieldId("website")}>
              Website
            </label>
            <input
              id={fieldId("website")}
              name="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="company.com"
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor={fieldId("message")}>
            Tell us about your program
          </label>
          <textarea
            id={fieldId("message")}
            name="message"
            rows={3}
            placeholder="Course titles, delivery format, number of delegates each year"
            className="field resize-none"
          />
        </div>

        {/* Honeypot, visually and semantically hidden from people */}
        <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
          <label htmlFor={fieldId("hp")}>Do not fill this in</label>
          <input id={fieldId("hp")} name="company_website_confirm" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {status === "failed" && (
          <p role="alert" className="rounded-xl bg-[#fdf1f0] px-4 py-3 text-sm text-[#a03a30]">
            {message || formCopy.errorGeneric}
          </p>
        )}

        <button type="submit" disabled={status === "sending"} className="btn btn-gold w-full disabled:opacity-70">
          {status === "sending" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/25 border-t-navy-900" />
              {formCopy.submitting}
            </>
          ) : (
            <>
              {formCopy.submit}
              <IconArrow className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs leading-relaxed text-ink-500">{formCopy.note}</p>
      </form>
    </div>
  );
}

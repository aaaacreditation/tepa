"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { countries } from "@/lib/countries";
import { SOURCES } from "@/lib/sources";
import {
  CALENDLY_LABEL,
  FORM_LABEL,
  trackConversion,
} from "../../components/GoogleTag";
import { metaTrack, newMetaEventId } from "../../components/MetaPixel";
import { IconArrow, IconCalendar, IconCheck } from "../../tepa/components/Icons";
import { booking, links, positionSuggestions, site } from "../content";

/* Two steps, then the calendar.

   Step 1 is who to call. Step 2 is what the assessor needs to prepare, and
   also what sorts the leads: an individual learner is sent to the directory
   instead of becoming a lead, and the other answers land in the message
   column of the TEPA dashboard. The enquiry goes to the same endpoint as
   /tepa, so the lead, its attribution and its conversions are handled
   exactly as they are there. */

const PAGE_PATH = "/trainingandeducationandprovidersandaccreditation";

type Stage = "details" | "qualify" | "schedule" | "booked";

type Details = {
  fullName: string;
  position: string;
  email: string;
  phone: string;
  country: string;
  organization: string;
  website: string;
};

type Qualify = {
  orgType: string;
  programs: string;
  timeline: string;
};

type Errors = Partial<Record<keyof Details | keyof Qualify, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WEBSITE_RE = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i;

/* Stricter than /tepa on purpose: most unreachable leads there typed a
   local number with no country code, which an assessor calling from the US
   cannot dial. A leading + or 00 is required; the digit count covers every
   national numbering plan. */
function validIntlPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+") && !trimmed.startsWith("00")) return false;
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 8 && digits.length <= 15;
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

/* A contact card rather than a tel: link, which would dial instead of save.
   Phones open it as "Add to contacts", so the assessor's call shows up as AAA
   instead of an unknown US number the visitor lets ring out. */
const CONTACT_CARD = `data:text/vcard;charset=utf-8,${encodeURIComponent(
  [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:AAA Accreditation (${site.org})`,
    `ORG:${site.org}`,
    `TEL;TYPE=WORK,VOICE:${site.phoneHref.replace("tel:", "")}`,
    `EMAIL;TYPE=WORK:${site.email}`,
    `URL:${site.website}`,
    "END:VCARD",
  ].join("\r\n"),
)}`;

/* The page renders this form twice. A booking made in either copy is one
   booking, so the Calendly conversion is guarded once for the whole page. */
let scheduleTracked = false;

type BookingFormProps = {
  badge?: string;
  title?: string;
};

export function BookingForm({ badge, title = booking.title }: BookingFormProps) {
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const [stage, setStage] = useState<Stage>("details");
  const [details, setDetails] = useState<Details>({
    fullName: "",
    position: "",
    email: "",
    phone: "",
    country: "",
    organization: "",
    website: "",
  });
  const [qualify, setQualify] = useState<Qualify>({
    orgType: "",
    programs: "",
    timeline: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [calendarHeight, setCalendarHeight] = useState(680);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStage = useRef<Stage>(stage);

  /* Each stage swaps the card's content, so focus follows the new heading
     rather than being left on a button that no longer exists. Compared with
     the last stage shown, not a first-render flag, so a remount on page load
     never pulls focus into the form. */
  useEffect(() => {
    if (shownStage.current === stage) return;
    shownStage.current = stage;
    headingRef.current?.focus({ preventScroll: true });
    const card = headingRef.current?.closest(".eligibility-card");
    if (card && card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stage]);

  /* Calendly reports from inside its iframe with postMessage: the page height
     so the frame never scrolls inside itself, and the booking itself. */
  useEffect(() => {
    if (stage !== "schedule") return;

    function onMessage(event: MessageEvent) {
      if (event.origin !== "https://calendly.com") return;
      const data = event.data as { event?: string; payload?: { height?: string } } | null;
      if (!data || typeof data.event !== "string") return;

      if (data.event === "calendly.page_height") {
        const height = Number.parseInt(data.payload?.height ?? "", 10);
        if (Number.isFinite(height) && height > 0) {
          setCalendarHeight(Math.max(560, Math.min(height, 1400)));
        }
      }

      if (data.event === "calendly.event_scheduled") {
        if (!scheduleTracked) {
          scheduleTracked = true;
          trackConversion(CALENDLY_LABEL);
          metaTrack("Schedule", { content_name: "Calendly call", content_category: "tepa" });
        }
        setStage("booked");
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [stage]);

  const isIndividual = qualify.orgType === booking.individual;

  function setDetail(name: keyof Details, value: string) {
    setDetails((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function setAnswer(name: keyof Qualify, value: string) {
    setQualify((current) => ({ ...current, [name]: value }));
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
    if (!validIntlPhone(details.phone)) {
      next.phone = "Please start with your country code, for example +971 50 123 4567.";
    }
    if (!details.country) next.country = "Please choose your country.";
    if (!details.organization.trim()) next.organization = "Please add your organization.";
    if (!WEBSITE_RE.test(details.website.trim())) next.website = "Please add your website.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirst(event.currentTarget, next);
      return;
    }
    setStage("qualify");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isIndividual) return;

    const next: Errors = {};
    if (!qualify.orgType) next.orgType = "Please choose your organization type.";
    if (!qualify.programs) next.programs = "Please choose how many programs.";
    if (!qualify.timeline) next.timeline = "Please choose a timeframe.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirst(event.currentTarget, next);
      return;
    }

    if (honeypot) {
      setStage("schedule");
      return;
    }

    const message = [
      `Organization type: ${qualify.orgType}`,
      `Programs to accredit: ${qualify.programs}`,
      `Wants accreditation: ${qualify.timeline}`,
      `Page: Fast Track test (${PAGE_PATH})`,
    ].join("\n");

    setSending(true);
    setSubmitError("");
    const metaEventId = newMetaEventId();
    try {
      const response = await fetch("/api/tepa/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: details.fullName.trim(),
          position: details.position.trim(),
          organization: details.organization.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
          country: details.country,
          website: details.website.trim(),
          message,
          company_website_confirm: honeypot,
          attribution: readAttribution(),
          metaEventId,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(body?.error ?? booking.errorGeneric);
        setSending(false);
        return;
      }

      /* Only once the server has stored the lead, as on /tepa. */
      trackConversion(FORM_LABEL, { email: details.email.trim(), phone: details.phone.trim() });
      metaTrack(
        "Lead",
        { content_name: SOURCES.tepa.name, content_category: "tepa" },
        metaEventId,
        {
          email: details.email,
          phone: details.phone,
          fullName: details.fullName,
          country: details.country,
        },
      );

      setSending(false);
      setStage("schedule");
    } catch {
      setSubmitError(booking.errorGeneric);
      setSending(false);
    }
  }

  if (stage === "booked") {
    return (
      <div className="eligibility-card bk-card bk-booked" role="status">
        <span className="success-icon">
          <IconCheck />
        </span>
        <p className="form-kicker">{booking.bookedKicker}</p>
        <h2 ref={headingRef} tabIndex={-1} className="bk-title">
          {booking.bookedTitle}
        </h2>
        <ul className="bk-checklist">
          {booking.bookedItems.map((item) => (
            <li key={item.lead}>
              <IconCheck className="bk-check" />
              <span>
                <strong>{item.lead}</strong> {item.body}
              </span>
            </li>
          ))}
        </ul>
        <p className="bk-small">
          <IconCalendar className="bk-inline-icon" />
          {booking.bookedNote}
        </p>
        <a
          href={CONTACT_CARD}
          download="AAA-Accreditation.vcf"
          className="tepa-button tepa-button--outline-navy bk-full"
        >
          {booking.saveContact}
        </a>
      </div>
    );
  }

  if (stage === "schedule") {
    const params = new URLSearchParams({
      embed_domain: window.location.host,
      embed_type: "Inline",
      hide_gdpr_banner: "1",
      hide_event_type_details: "1",
      name: details.fullName.trim(),
      email: details.email.trim(),
    });
    const prefilled = new URLSearchParams({
      name: details.fullName.trim(),
      email: details.email.trim(),
    });

    return (
      <div className="eligibility-card bk-card bk-schedule">
        <Progress current={3} />
        <p className="form-kicker">{booking.step3}</p>
        <h2 ref={headingRef} tabIndex={-1} className="bk-title">
          {booking.scheduleTitle}
        </h2>
        <p className="bk-lede">{booking.scheduleBody}</p>
        <div className="bk-calendar">
          <iframe
            src={`${site.calendly}?${params.toString()}`}
            title="Choose a time for your application review"
            style={{ height: calendarHeight }}
            loading="lazy"
          />
        </div>
        <a
          className="bk-fallback"
          href={`${site.calendly}?${prefilled.toString()}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {booking.scheduleFallback}
          <IconArrow className="link-icon" />
        </a>
      </div>
    );
  }

  return (
    <div className="eligibility-card bk-card">
      <Progress current={stage === "details" ? 1 : 2} />
      <div className="form-heading">
        <p className="form-kicker">
          {badge ? `${badge} · ` : ""}
          {stage === "details" ? booking.step1 : booking.step2}
        </p>
        <h2 ref={headingRef} tabIndex={-1}>
          {title}
        </h2>
      </div>

      {stage === "details" ? (
        <form onSubmit={onContinue} noValidate className="eligibility-form">
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
            placeholder="Position, e.g. CEO, Quality Manager"
            autoComplete="organization-title"
            list={fieldId("positions")}
            value={details.position}
            onChange={(value) => setDetail("position", value)}
            error={errors.position}
          />
          <datalist id={fieldId("positions")}>
            {positionSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>

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
          <Field
            id={fieldId("phone")}
            name="phone"
            label="Phone, with country code"
            placeholder="+ country code and number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={details.phone}
            onChange={(value) => setDetail("phone", value)}
            error={errors.phone}
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
              onChange={(event) => setDetail("country", event.target.value)}
              required
              aria-invalid={Boolean(errors.country)}
              aria-describedby={errors.country ? fieldId("country-error") : undefined}
            >
              <option value="" disabled>
                Choose your country
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

          <Field
            id={fieldId("organization")}
            name="organization"
            label="Organization name"
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
            value={details.website}
            onChange={(value) => setDetail("website", value)}
            error={errors.website}
          />

          <div aria-hidden="true" className="honeypot">
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

          <button type="submit" className="tepa-button tepa-button--navy form-submit">
            {booking.continue}
            <IconArrow className="button-icon" />
          </button>
          <p className="form-note">
            <span aria-hidden="true">▣</span>
            {booking.note}
          </p>
        </form>
      ) : (
        <form onSubmit={onSubmit} noValidate className="eligibility-form bk-qualify">
          <ChipGroup
            name="orgType"
            legend="Organization type"
            options={booking.orgTypes}
            value={qualify.orgType}
            onChange={(value) => setAnswer("orgType", value)}
            error={errors.orgType}
            errorId={fieldId("orgType-error")}
          />

          {isIndividual ? (
            <div className="bk-individual" role="status">
              <p>{booking.individualNote}</p>
              <a
                href={links.directory}
                target="_blank"
                rel="noopener noreferrer"
                className="tepa-button tepa-button--outline-navy bk-full"
              >
                {booking.individualCta}
                <IconArrow className="button-icon" />
              </a>
            </div>
          ) : (
            <>
              <ChipGroup
                name="programs"
                legend="Programs to accredit"
                options={booking.programCounts}
                value={qualify.programs}
                onChange={(value) => setAnswer("programs", value)}
                error={errors.programs}
                errorId={fieldId("programs-error")}
              />
              <ChipGroup
                name="timeline"
                legend="When do you want to be accredited?"
                options={booking.timelines}
                value={qualify.timeline}
                onChange={(value) => setAnswer("timeline", value)}
                error={errors.timeline}
                errorId={fieldId("timeline-error")}
              />
            </>
          )}

          {submitError ? (
            <p role="alert" className="form-submit-error">
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
              {booking.back}
            </button>
            {isIndividual ? null : (
              <button
                type="submit"
                disabled={sending}
                className="tepa-button tepa-button--navy form-submit"
              >
                {sending ? (
                  <>
                    <span className="form-spinner" aria-hidden="true" />
                    {booking.submitting}
                  </>
                ) : (
                  <>
                    {booking.submit}
                    <IconCalendar className="button-icon" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Progress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="bk-progress" aria-label={`Step ${Math.min(current, 2)} of 2`}>
      {[1, 2, 3].map((step) => (
        <li key={step} data-state={step < current ? "done" : step === current ? "current" : "todo"} />
      ))}
    </ol>
  );
}

/* Every field on this form is required, so the marker is part of the label
   rather than a prop. Hidden from screen readers, which announce the input's
   own required state instead of reading out a star. */
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
  /* id of a <datalist> of suggestions; the field still takes any text. */
  list?: string;
  error?: string;
};

function Field({
  id,
  name,
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  list,
  error,
}: FieldProps) {
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
};

/* Real radio inputs under the chips, so keyboard and screen reader users get
   an ordinary radio group. */
function ChipGroup({ name, legend, options, value, onChange, error, errorId }: ChipGroupProps) {
  return (
    <fieldset
      className="bk-group"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend>
        {legend}
        <Required />
      </legend>
      <div className="bk-chips">
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

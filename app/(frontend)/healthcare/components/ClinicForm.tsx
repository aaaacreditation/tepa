"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@/lib/attribution";
import { countries, dialCodes } from "@/lib/countries";
import { SOURCES } from "@/lib/sources";
import { HEALTHCARE_FORM_LABEL, trackConversion } from "../../components/GoogleTag";
import { metaTrack, newMetaEventId } from "../../components/MetaPixel";
import { IconArrow, IconCheck, IconLock } from "../../components/Icons";
import {
  formatPhone,
  guessRegion,
  PhoneField,
  type PhoneValue,
  validPhone,
} from "../../components/PhoneField";
import {
  branchCounts,
  clinicSizes,
  contactMethods,
  employeeCounts,
  formCopy,
  positionSuggestions,
  site,
} from "../content";

/* The clinic application, in two steps and then a confirmation, the way the
   Fast Track form on the training-provider page works.

   Step 1 is who to contact and which clinic. Step 2 is the clinic's size,
   which is what sales needs before the first call and what sorts the leads:
   branches, services, headcount, and the size band with its starting fee. A
   clinic that chooses a band has read the price and chosen to continue, which
   is the strongest signal a form can collect. Last, the channel the clinic
   wants to be reached on, which decides how the lead is worked.

   Every answer is required. The server repeats every check in
   app/api/healthcare/enquiry/route.ts; keep the two in step. */

type Stage = "details" | "clinic" | "done";

type Details = {
  fullName: string;
  position: string;
  email: string;
  organization: string;
  country: string;
  city: string;
  /* The dialling code is picked, not typed; see PhoneField. */
  phoneRegion: string;
  phoneNumber: string;
};

type Clinic = {
  branches: string;
  specialty: string;
  employees: string;
  clinicSize: string;
  contactMethod: string;
};

type Errors = Partial<Record<keyof Details | keyof Clinic, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

type ClinicFormProps = {
  /* `panel` is the hero card beside the headline, `stack` the closing card.
     They differ only in trim. */
  layout?: "panel" | "stack";
};

export function ClinicForm({ layout = "panel" }: ClinicFormProps) {
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const [stage, setStage] = useState<Stage>("details");
  const [details, setDetails] = useState<Details>({
    fullName: "",
    position: "",
    email: "",
    organization: "",
    country: "",
    city: "",
    phoneRegion: "",
    phoneNumber: "",
  });
  const [clinic, setClinic] = useState<Clinic>({
    branches: "",
    specialty: "",
    employees: "",
    clinicSize: "",
    contactMethod: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStage = useRef<Stage>(stage);
  /* Set once the visitor picks a code themselves, after which neither the
     locale guess nor the country field gets to move it again. */
  const regionPinned = useRef(false);

  /* A first guess from the browser's own locale. In an effect because the
     server has no navigator: a guess rendered during SSR would hydrate
     against a different one. */
  useEffect(() => {
    const region = guessRegion();
    if (!region) return;
    setDetails((current) =>
      current.phoneRegion || regionPinned.current ? current : { ...current, phoneRegion: region },
    );
  }, []);

  /* Each stage swaps the card's content, so focus follows the new heading
     rather than being left on a button that no longer exists. */
  useEffect(() => {
    if (shownStage.current === stage) return;
    shownStage.current = stage;
    headingRef.current?.focus({ preventScroll: true });
    const card = headingRef.current?.closest(".hc-form-card");
    if (card && card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stage]);

  const phoneValue: PhoneValue = { region: details.phoneRegion, number: details.phoneNumber };

  function setDetail(name: keyof Details, value: string) {
    setDetails((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function setAnswer(name: keyof Clinic, value: string) {
    setClinic((current) => ({ ...current, [name]: value }));
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
    if (!details.organization.trim()) next.organization = "Please add your clinic's name.";
    if (!details.country) next.country = "Please choose your clinic's country.";
    if (!details.city.trim()) next.city = "Please add your clinic's city.";
    if (!details.phoneRegion) {
      next.phoneNumber = "Please choose your country code.";
    } else if (!validPhone(phoneValue)) {
      next.phoneNumber = "Please check your phone number.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirst(event.currentTarget, next);
      return;
    }
    setStage("clinic");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: Errors = {};
    if (!clinic.branches) next.branches = "Please choose how many branches.";
    if (!clinic.specialty.trim()) next.specialty = "Please list your specialities or services.";
    if (!clinic.employees) next.employees = "Please choose how many employees.";
    if (!clinic.clinicSize) next.clinicSize = "Please choose your clinic's size.";
    if (!clinic.contactMethod) next.contactMethod = "Please choose how we should contact you.";

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
    /* Minted here so the pixel's Lead below and the server's Conversions API
       call carry the same id, and Meta counts one application, not two. */
    const metaEventId = newMetaEventId();
    const phone = formatPhone(phoneValue);
    try {
      const response = await fetch("/api/healthcare/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: details.fullName.trim(),
          position: details.position.trim(),
          email: details.email.trim(),
          phone,
          organization: details.organization.trim(),
          country: details.country,
          city: details.city.trim(),
          branches: clinic.branches,
          specialty: clinic.specialty.trim(),
          employees: clinic.employees,
          clinicSize: clinic.clinicSize,
          contactMethod: clinic.contactMethod,
          company_website_confirm: honeypot,
          attribution: readAttribution(),
          metaEventId,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(body?.error ?? formCopy.errorGeneric);
        setSending(false);
        return;
      }

      /* Only after the server confirmed the lead was stored. Firing on submit
         would count applications that never arrived. */
      trackConversion(HEALTHCARE_FORM_LABEL, { email: details.email.trim(), phone });
      metaTrack(
        "Lead",
        { content_name: SOURCES.healthcare.name, content_category: "healthcare" },
        metaEventId,
        {
          email: details.email,
          phone,
          fullName: details.fullName,
          country: details.country,
        },
      );

      setSending(false);
      setStage("done");
    } catch {
      setSubmitError(formCopy.errorGeneric);
      setSending(false);
    }
  }

  if (stage === "done") {
    /* The channel they picked, against the contact detail they actually gave,
       so the promise can be checked rather than taken on trust. */
    const confirmLead =
      formCopy.contactConfirm[clinic.contactMethod as keyof typeof formCopy.contactConfirm] ??
      formCopy.contactConfirm.Email;
    const confirmValue =
      clinic.contactMethod === "Email" ? details.email.trim() : formatPhone(phoneValue);

    return (
      <div className={`hc-form-card hc-form-card--${layout} hc-cf-done`} role="status">
        <span className="hc-form-tick">
          <IconCheck />
        </span>
        <p className="hc-cf-kicker">{formCopy.doneKicker}</p>
        <h2 ref={headingRef} tabIndex={-1} className="hc-cf-title">
          {formCopy.doneTitle}
        </h2>

        <p className="hc-cf-confirm">
          {confirmLead} <strong>{confirmValue}</strong>.
        </p>

        <ul className="hc-cf-checklist">
          {formCopy.doneItems.map((item) => (
            <li key={item.lead}>
              <IconCheck />
              <span>
                <strong>{item.lead}</strong> {item.body}
              </span>
            </li>
          ))}
        </ul>

        <p className="hc-form-done-mail">
          Need it sooner? Email <a href={`mailto:${site.email}`}>{site.email}</a> or call{" "}
          <a href={site.phoneHref}>{site.phoneLabel}</a>.
        </p>
      </div>
    );
  }

  return (
    <div className={`hc-form-card hc-form-card--${layout}`}>
      <Progress current={stage === "details" ? 1 : 2} />
      <p className="hc-cf-kicker">{stage === "details" ? formCopy.step1 : formCopy.step2}</p>
      <h2 ref={headingRef} tabIndex={-1} className="hc-cf-title">
        {formCopy.title}
      </h2>

      {stage === "details" ? (
        <form onSubmit={onContinue} noValidate className="hc-form">
          <div className="hc-form-fields">
            <Field
              id={fieldId("fullName")}
              name="fullName"
              label="Your full name"
              autoComplete="name"
              value={details.fullName}
              onChange={(value) => setDetail("fullName", value)}
              error={errors.fullName}
            />
            <Field
              id={fieldId("position")}
              name="position"
              label="Position / job title"
              placeholder="e.g. Owner, Medical Director, Clinic Manager"
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
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={details.email}
              onChange={(value) => setDetail("email", value)}
              error={errors.email}
            />
            <Field
              id={fieldId("organization")}
              name="organization"
              label="Name of the clinic"
              autoComplete="organization"
              value={details.organization}
              onChange={(value) => setDetail("organization", value)}
              error={errors.organization}
            />

            {/* Location is two answers in one row: the country comes from a
                list so the phone code can follow it, the city is typed. */}
            <div className="hc-field-pair">
              <div className="hc-field hc-field--labelled">
                <label htmlFor={fieldId("country")}>
                  Clinic country
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
                      /* Only helps someone who left the code alone. A code
                         they chose themselves is never overwritten. */
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
                    Country
                  </option>
                  {countries.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                {errors.country ? (
                  <p id={fieldId("country-error")} className="hc-field-error">
                    {errors.country}
                  </p>
                ) : null}
              </div>
              <Field
                id={fieldId("city")}
                name="city"
                label="Clinic city"
                autoComplete="address-level2"
                placeholder="City"
                value={details.city}
                onChange={(value) => setDetail("city", value)}
                error={errors.city}
              />
            </div>

            <PhoneField
              id={fieldId("phone")}
              value={phoneValue}
              label="Phone number, with country code"
              error={errors.phoneNumber}
              onChange={(next) => {
                if (next.region !== details.phoneRegion) regionPinned.current = true;
                setDetails((current) => ({
                  ...current,
                  phoneRegion: next.region,
                  phoneNumber: next.number,
                }));
                if (errors.phoneNumber) {
                  setErrors((current) => ({ ...current, phoneNumber: undefined }));
                }
              }}
            />
          </div>

          <div aria-hidden="true" className="hc-honeypot">
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

          <div className="hc-form-action">
            <button type="submit" className="hc-button hc-button--primary">
              {formCopy.continue}
              <IconArrow className="hc-icon" />
            </button>
            <p className="hc-form-note">
              <IconLock />
              {formCopy.note}
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmit} noValidate className="hc-form hc-cf-clinic">
          <ChipGroup
            name="branches"
            legend="Number of branches"
            options={branchCounts}
            value={clinic.branches}
            onChange={(value) => setAnswer("branches", value)}
            error={errors.branches}
            errorId={fieldId("branches-error")}
          />
          <Field
            id={fieldId("specialty")}
            name="specialty"
            label="Medical speciality / services provided"
            placeholder="e.g. dental, dermatology, IVF, physiotherapy"
            value={clinic.specialty}
            onChange={(value) => setAnswer("specialty", value)}
            error={errors.specialty}
          />
          <ChipGroup
            name="employees"
            legend="Number of employees"
            options={employeeCounts}
            value={clinic.employees}
            onChange={(value) => setAnswer("employees", value)}
            error={errors.employees}
            errorId={fieldId("employees-error")}
          />

          {/* The size band carries its starting fee, the same three the Fees
              section shows, so choosing one is choosing it knowingly. */}
          <fieldset
            className="hc-group"
            aria-invalid={Boolean(errors.clinicSize)}
            aria-describedby={errors.clinicSize ? fieldId("clinicSize-error") : fieldId("clinicSize-hint")}
          >
            <legend>
              Clinic size
              <Required />
            </legend>
            <div className="hc-tier-options">
              {clinicSizes.map((size) => (
                <label
                  key={size.value}
                  className="hc-tier-option"
                  data-checked={clinic.clinicSize === size.value}
                >
                  <input
                    type="radio"
                    name="clinicSize"
                    value={size.value}
                    checked={clinic.clinicSize === size.value}
                    onChange={() => setAnswer("clinicSize", size.value)}
                    required
                  />
                  <span className="hc-tier-name">{size.value}</span>
                  <span className="hc-tier-price">{size.price}</span>
                </label>
              ))}
            </div>
            {errors.clinicSize ? (
              <p id={fieldId("clinicSize-error")} className="hc-field-error">
                {errors.clinicSize}
              </p>
            ) : (
              <p id={fieldId("clinicSize-hint")} className="hc-group-hint">
                {formCopy.sizeHint}
              </p>
            )}
          </fieldset>

          <ChipGroup
            name="contactMethod"
            legend={formCopy.contactLegend}
            options={contactMethods}
            value={clinic.contactMethod}
            onChange={(value) => setAnswer("contactMethod", value)}
            error={errors.contactMethod}
            errorId={fieldId("contactMethod-error")}
          />

          {submitError ? (
            <p role="alert" className="hc-form-error">
              {submitError}
            </p>
          ) : null}

          <div className="hc-cf-actions">
            <button
              type="button"
              className="hc-cf-back"
              onClick={() => {
                setErrors({});
                setStage("details");
              }}
            >
              {formCopy.back}
            </button>
            <button type="submit" disabled={sending} className="hc-button hc-button--primary">
              {sending ? (
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
          </div>
        </form>
      )}
    </div>
  );
}

function Progress({ current }: { current: 1 | 2 }) {
  return (
    <ol className="hc-cf-progress" aria-label={`Step ${current} of 2`}>
      {[1, 2].map((step) => (
        <li
          key={step}
          data-state={step < current ? "done" : step === current ? "current" : "todo"}
        />
      ))}
    </ol>
  );
}

/* Every field is required, so the marker is part of the label rather than a
   prop. Hidden from screen readers, which announce the input's own required
   state instead of reading out a star. */
function Required() {
  return (
    <span className="hc-req" aria-hidden="true">
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
    <div className="hc-field hc-field--labelled">
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
        <p id={`${id}-error`} className="hc-field-error">
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
      className="hc-group"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend>
        {legend}
        <Required />
      </legend>
      <div className="hc-chips">
        {options.map((option) => (
          <label key={option} className="hc-chip" data-checked={value === option}>
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
        <p id={errorId} className="hc-field-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

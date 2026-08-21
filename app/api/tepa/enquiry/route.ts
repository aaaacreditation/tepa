import { after } from "next/server";
import { countries } from "@/lib/countries";
import {
  type Attribution,
  attributionFromCookieHeader,
  EMPTY_ATTRIBUTION,
} from "@/lib/attribution";
import { drainConversions, enqueueConversion } from "@/lib/conversions";
import { insertLead } from "@/lib/leads";
import {
  ORGANIZATION_TYPES,
  PROGRAM_COUNTS,
  ROLES,
  type Qualification,
  scoreLead,
} from "@/lib/qualification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/* Mirrors the client checks in EnquiryForm.tsx; keep the two in step. */
const WEBSITE_RE = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i;
const MAX_LEN = 2000;
const VALID_COUNTRY = new Set(countries.map(([code]) => code));
/* Validated against the same arrays the form renders from, so a mismatch
   between the two is a compile error rather than a lead stored with an answer
   the scorer will silently ignore. */
const VALID_ORGANIZATION_TYPE: Set<string> = new Set(ORGANIZATION_TYPES);
const VALID_PROGRAM_COUNT: Set<string> = new Set(PROGRAM_COUNTS);
const VALID_ROLE: Set<string> = new Set(ROLES);

function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export type Enquiry = {
  fullName: string;
  organization: string;
  email: string;
  country: string;
  countryName: string;
  phone: string;
  website: string;
  message: string;
  organizationType: string;
  programCount: string;
  contactRole: string;
  receivedAt: string;
  source: string;
  attribution: Attribution;
  qualification: Qualification;
};

/* Small in memory throttle. Enough to blunt casual abuse on a single instance;
   put a real limiter in front of this if the campaign scales horizontally. */
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function throttled(ip: string) {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  if (HITS.size > 5000) HITS.clear();
  return recent.length > MAX_PER_WINDOW;
}

const clean = (value: unknown) =>
  typeof value === "string" ? value.trim().slice(0, MAX_LEN) : "";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (throttled(ip)) {
    return Response.json(
      { error: "Too many enquiries from this connection. Please try again in a minute." },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  // Bots fill hidden fields. Accept quietly so they do not learn anything.
  if (clean(payload.company_website_confirm)) {
    return Response.json({ ok: true });
  }

  const fullName = clean(payload.fullName);
  const organization = clean(payload.organization);
  const email = clean(payload.email);
  const phone = clean(payload.phone);
  const country = clean(payload.country);
  const website = clean(payload.website);
  const organizationType = clean(payload.organizationType);
  const programCount = clean(payload.programCount);
  const contactRole = clean(payload.role);

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.fullName = "Full name is required.";
  if (!organization) fieldErrors.organization = "Organization is required.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "A valid email address is required.";
  if (!validPhone(phone)) fieldErrors.phone = "A valid phone number is required.";
  if (!VALID_COUNTRY.has(country)) fieldErrors.country = "A valid country is required.";
  if (!WEBSITE_RE.test(website)) fieldErrors.website = "A website is required.";
  if (!VALID_ORGANIZATION_TYPE.has(organizationType)) {
    fieldErrors.organizationType = "Please choose the type of organization.";
  }
  if (!VALID_PROGRAM_COUNT.has(programCount)) {
    fieldErrors.programCount = "Please choose how many programs you want accredited.";
  }
  if (!VALID_ROLE.has(contactRole)) fieldErrors.role = "Please choose your role.";

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  /* The click id rides in on the first party cookie the landing page wrote, so
     it survives the visitor leaving for Calendly and coming back. The body is
     read as a fallback for the case where the cookie was blocked. */
  const cookieAttribution = attributionFromCookieHeader(request.headers.get("cookie"));
  const attribution = hasAnyClickId(cookieAttribution)
    ? cookieAttribution
    : mergeBodyAttribution(cookieAttribution, payload);

  const message = clean(payload.message);

  /* Scored here, at submit, and stored on the row. Doing it on read would mean
     a later change to the weights quietly rewriting verdicts a reviewer had
     already worked from. This only informs the dashboard — nothing about the
     tier changes what is reported to Google Ads. */
  const qualification = scoreLead({
    fullName,
    organization,
    email,
    website,
    message,
    countryCode: country,
    organizationType,
    programCount,
    role: contactRole,
  });

  const enquiry: Enquiry = {
    fullName,
    organization,
    email,
    country,
    countryName: countries.find(([code]) => code === country)?.[1] ?? country,
    phone,
    website,
    message,
    organizationType,
    programCount,
    contactRole,
    receivedAt: new Date().toISOString(),
    source: "tepa",
    attribution,
    qualification,
  };

  try {
    await deliver(enquiry);
  } catch (error) {
    console.error("[tepa/enquiry] delivery failed", error);
    return Response.json(
      { error: "We could not record your enquiry. Please email us directly." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}

/* Every enquiry lands in Postgres as a lead with status "lead" and shows up
   in the dashboard at /dashboard/tepa. Throwing from here returns a 502 to
   the visitor, so the form tells them to email instead of silently dropping
   the lead. The log line stays as a plain text backup of the payload. */
async function deliver(enquiry: Enquiry) {
  const leadId = await insertLead({
    source: enquiry.source,
    fullName: enquiry.fullName,
    organization: enquiry.organization,
    email: enquiry.email,
    countryCode: enquiry.country,
    countryName: enquiry.countryName,
    phone: enquiry.phone,
    website: enquiry.website,
    message: enquiry.message,
    attribution: enquiry.attribution,
    organizationType: enquiry.organizationType,
    programCount: enquiry.programCount,
    contactRole: enquiry.contactRole,
    qualification: enquiry.qualification,
  });
  console.info("[tepa/enquiry]", JSON.stringify(enquiry));

  /* Queue the "lead" conversion in the same request that stored the lead, so
     the two cannot disagree. Nothing is queued unless GOOGLE_ADS_ACTION_LEAD
     is set, which is how a setup that already counts the submit with the gtag
     snippet avoids counting it twice. */
  const queued = await enqueueConversion(leadId, "lead");

  /* Sending happens after the response so Google's latency never shows up in
     the visitor's form submit, and a failure there leaves a retryable outbox
     row rather than a 502 on a lead that was in fact saved. */
  if (queued) {
    after(async () => {
      try {
        await drainConversions(5);
      } catch (error) {
        console.error("[tepa/enquiry] conversion drain failed", error);
      }
    });
  }
}

function hasAnyClickId(attribution: Attribution): boolean {
  return Boolean(attribution.gclid || attribution.gbraid || attribution.wbraid);
}

/* Safari's tracking prevention can drop the cookie before the form is sent.
   The form posts whatever it still holds in memory as a second chance. */
function mergeBodyAttribution(
  base: Attribution,
  payload: Record<string, unknown>,
): Attribution {
  const fromBody = payload.attribution;
  if (!fromBody || typeof fromBody !== "object") return base;

  const body = fromBody as Record<string, unknown>;
  const pick = (key: string, fallback: string) => {
    const value = body[key];
    return typeof value === "string" && value.trim() ? value.trim().slice(0, 512) : fallback;
  };

  return {
    ...EMPTY_ATTRIBUTION,
    ...base,
    gclid: pick("gclid", base.gclid),
    gbraid: pick("gbraid", base.gbraid),
    wbraid: pick("wbraid", base.wbraid),
    utmSource: pick("utmSource", base.utmSource),
    utmMedium: pick("utmMedium", base.utmMedium),
    utmCampaign: pick("utmCampaign", base.utmCampaign),
    utmTerm: pick("utmTerm", base.utmTerm),
    utmContent: pick("utmContent", base.utmContent),
  };
}

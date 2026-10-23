import { after } from "next/server";
import { apply, readiness } from "@/app/(frontend)/sme/content";
import {
  type Attribution,
  attributionFromCookieHeader,
  EMPTY_ATTRIBUTION,
  hasClickId,
  metaIdsFromCookies,
} from "@/lib/attribution";
import { countries } from "@/lib/countries";
import { drainConversions, enqueueConversion } from "@/lib/conversions";
import { insertLead } from "@/lib/leads";
import { cleanMetaEventId } from "@/lib/meta-identity";
import { openaiIdsFromCookies } from "@/lib/openai-capi";
import { queueEnquiryForOdoo } from "@/lib/odoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE = "sme";

/* Mirrors the client checks in app/(frontend)/sme/components/ApplyForm.tsx;
   keep the two in step. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WEBSITE_RE = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i;
const MAX_LEN = 2000;
/* A job title, not an essay. */
const MAX_SHORT_LEN = 120;
const VALID_COUNTRY = new Set(countries.map(([code]) => code));
/* The closed answers are checked against the same lists the form draws from,
   so nothing the form cannot produce is stored. */
const VALID_SECTORS = new Set<string>(apply.sectors);
const VALID_EMPLOYEES = new Set<string>(apply.employeeCounts);
const VALID_TIMELINES = new Set<string>(apply.timelines);
const VALID_CONTACT = new Set<string>(apply.contactMethods);
const VALID_LEVELS = new Set<string>(readiness.levels.map((level) => level.name));

function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export type Enquiry = {
  fullName: string;
  organization: string;
  position: string;
  email: string;
  country: string;
  countryName: string;
  phone: string;
  website: string;
  sector: string;
  employees: string;
  timeline: string;
  contactMethod: string;
  /* The free readiness check, when the visitor took it before applying. */
  readiness: { score: number; level: string } | null;
  receivedAt: string;
  source: string;
  attribution: Attribution;
  /* Meta's matching keys, read off the request; see lib/db.ts. */
  metaEventId: string;
  fbp: string;
  fbc: string;
  clientIp: string;
  clientUserAgent: string;
  /* The ChatGPT ads pixel's cookies; see lib/openai-capi.ts. */
  oaiOppref: string;
  oaiObref: string;
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

/* Optional and advisory, so a malformed value is dropped rather than refused. */
function cleanReadiness(value: unknown): Enquiry["readiness"] {
  if (!value || typeof value !== "object") return null;
  const { score, level } = value as Record<string, unknown>;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 100) return null;
  if (typeof level !== "string" || !VALID_LEVELS.has(level)) return null;
  return { score, level };
}

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
  const position = clean(payload.position).slice(0, MAX_SHORT_LEN);
  const email = clean(payload.email);
  const phone = clean(payload.phone);
  const organization = clean(payload.organization);
  const country = clean(payload.country);
  const website = clean(payload.website);
  const sector = clean(payload.sector);
  const employees = clean(payload.employees);
  const timeline = clean(payload.timeline);
  const contactMethod = clean(payload.contactMethod);

  /* Every question on the form is mandatory. */
  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.fullName = "Full name is required.";
  if (!position) fieldErrors.position = "Your position is required.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "A valid email address is required.";
  if (!validPhone(phone)) fieldErrors.phone = "A valid phone number is required.";
  if (!organization) fieldErrors.organization = "The business name is required.";
  if (!VALID_COUNTRY.has(country)) fieldErrors.country = "A valid country is required.";
  if (!WEBSITE_RE.test(website)) fieldErrors.website = "A website is required.";
  if (!VALID_SECTORS.has(sector)) fieldErrors.sector = "The sector is required.";
  if (!VALID_EMPLOYEES.has(employees)) fieldErrors.employees = "The number of employees is required.";
  if (!VALID_TIMELINES.has(timeline)) fieldErrors.timeline = "A timeframe is required.";
  if (!VALID_CONTACT.has(contactMethod)) {
    fieldErrors.contactMethod = "A preferred contact channel is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  /* The click id rides in on the first party cookie the landing page wrote, so
     it survives the visitor leaving the page and coming back. The body is read
     as a fallback for the case where the cookie was blocked. */
  const cookieAttribution = attributionFromCookieHeader(request.headers.get("cookie"));
  const attribution = hasClickId(cookieAttribution)
    ? cookieAttribution
    : mergeBodyAttribution(cookieAttribution, payload);

  /* What Meta matches the enquiry on besides the hashed contact details. The
     form minted the event id before posting, so its pixel call and the
     server's Conversions API call share it and Meta counts one enquiry. */
  const metaIds = metaIdsFromCookies(request.headers.get("cookie"), attribution);
  const openaiIds = openaiIdsFromCookies(request.headers.get("cookie"));
  const metaEventId = cleanMetaEventId(payload.metaEventId);
  const clientIp = ip === "unknown" ? "" : ip;
  const clientUserAgent = (request.headers.get("user-agent") ?? "").slice(0, 512);

  const enquiry: Enquiry = {
    fullName,
    organization,
    position,
    email,
    country,
    countryName: countries.find(([code]) => code === country)?.[1] ?? country,
    phone,
    website,
    sector,
    employees,
    timeline,
    contactMethod,
    readiness: cleanReadiness(payload.readiness),
    receivedAt: new Date().toISOString(),
    source: SOURCE,
    attribution,
    metaEventId,
    fbp: metaIds.fbp,
    fbc: metaIds.fbc,
    clientIp,
    clientUserAgent,
    oaiOppref: openaiIds.oppref,
    oaiObref: openaiIds.obref,
  };

  try {
    await deliver(enquiry);
  } catch (error) {
    console.error("[sme/enquiry] delivery failed", error);
    return Response.json(
      { error: "We could not record your application. Please email us directly." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}

/* Every application lands in Postgres as a lead with status "lead" and shows up
   in the dashboard at /dashboard/sme. Throwing from here returns a 502 to the
   visitor, so the form tells them to email instead of silently dropping the
   lead. The log line stays as a plain text backup of the payload. */
async function deliver(enquiry: Enquiry) {
  /* The business answers ride in the message rather than earning columns, so
     every landing page keeps writing the same shape of row into the shared
     leads table. One answer per line, read top to bottom before the first
     call. */
  const message = [
    `Sector: ${enquiry.sector}`,
    `Employees: ${enquiry.employees}`,
    `Wants accreditation: ${enquiry.timeline}`,
    ...(enquiry.readiness
      ? [`Readiness check: ${enquiry.readiness.score}% (${enquiry.readiness.level})`]
      : []),
    /* Same wording as the other forms, so sales reads the channel in the same
       place on every lead, and lib/odoo.ts tags it. */
    `Preferred contact: ${enquiry.contactMethod}`,
    "Page: /sme (SMEs accreditation application)",
  ]
    .join("\n")
    .slice(0, MAX_LEN);

  const leadId = await insertLead({
    source: enquiry.source,
    fullName: enquiry.fullName,
    organization: enquiry.organization,
    position: enquiry.position,
    email: enquiry.email,
    countryCode: enquiry.country,
    countryName: enquiry.countryName,
    phone: enquiry.phone,
    website: enquiry.website,
    message,
    attribution: enquiry.attribution,
    fbp: enquiry.fbp,
    fbc: enquiry.fbc,
    clientIp: enquiry.clientIp,
    clientUserAgent: enquiry.clientUserAgent,
    oaiOppref: enquiry.oaiOppref,
    oaiObref: enquiry.oaiObref,
  });
  console.info("[sme/enquiry]", JSON.stringify(enquiry));

  /* Into the Odoo CRM, after the response; see lib/odoo.ts. */
  await queueEnquiryForOdoo(leadId, SOURCE, message);

  /* Queue the "lead" conversion for each ad platform in the same request that
     stored the lead. Google's row needs GOOGLE_ADS_ACTION_LEAD_SME configured;
     Meta's needs the Conversions API token and carries the pixel's event id. */
  const queued = await enqueueConversion(leadId, "lead", new Date(), enquiry.source, {
    metaEventId: enquiry.metaEventId,
  });

  /* Sending happens after the response so Google's latency never shows up in
     the visitor's form submit. */
  if (queued) {
    after(async () => {
      try {
        await drainConversions(5);
      } catch (error) {
        console.error("[sme/enquiry] conversion drain failed", error);
      }
    });
  }
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
    fbclid: pick("fbclid", base.fbclid),
    utmSource: pick("utmSource", base.utmSource),
    utmMedium: pick("utmMedium", base.utmMedium),
    utmCampaign: pick("utmCampaign", base.utmCampaign),
    utmTerm: pick("utmTerm", base.utmTerm),
    utmContent: pick("utmContent", base.utmContent),
  };
}

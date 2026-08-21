import { after } from "next/server";
import {
  computeScore,
  DOMAINS,
  type DomainKey,
  type DomainScores,
  MAX_PER_DOMAIN,
  type ProfileKey,
  profileOptions,
  ROLES,
} from "@/app/(frontend)/clinic/quiz";
import {
  type Attribution,
  attributionFromCookieHeader,
  EMPTY_ATTRIBUTION,
} from "@/lib/attribution";
import { countries } from "@/lib/countries";
import { drainConversions, enqueueConversion } from "@/lib/conversions";
import { insertLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE = "clinic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/* Mirrors the client checks in components/ReadinessQuiz.tsx; keep in step. */
const WEBSITE_RE = /^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i;
const MAX_LEN = 2000;
const VALID_COUNTRY = new Set(countries.map(([code]) => code));
const VALID_ROLE = new Set<string>(ROLES);
const DOMAIN_KEYS = new Set<string>(DOMAINS.map((d) => d.key));

const PROFILE_KEYS: ProfileKey[] = [
  "clinicType",
  "size",
  "region",
  "reason",
  "timeline",
];

const PROFILE_LABEL: Record<ProfileKey, string> = {
  clinicType: "Clinic type",
  size: "Practitioners",
  region: "Region",
  reason: "Main reason",
  timeline: "Timeline",
};

function validPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

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
      { error: "Too many submissions from this connection. Please try again in a minute." },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const fullName = clean(payload.fullName);
  const organization = clean(payload.organization);
  const role = clean(payload.role);
  const email = clean(payload.email);
  const phone = clean(payload.phone);
  const country = clean(payload.country);
  const website = clean(payload.website);
  const consent = payload.consent === true;

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.fullName = "Full name is required.";
  if (!organization) fieldErrors.organization = "Clinic name is required.";
  if (!VALID_ROLE.has(role)) fieldErrors.role = "A valid role is required.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "A valid email address is required.";
  if (!validPhone(phone)) fieldErrors.phone = "A valid phone number is required.";
  if (!VALID_COUNTRY.has(country)) fieldErrors.country = "A valid country is required.";
  /* Website is optional here — unlike the other two landing pages — because the
     quiz already qualifies the lead well enough without it. */
  if (website && !WEBSITE_RE.test(website)) {
    fieldErrors.website = "That does not look like a website address.";
  }
  /* Consent is the record that permission to contact was given, so a missing
     one is a hard failure rather than something to fix up server side. */
  if (!consent) fieldErrors.consent = "Consent to be contacted is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  const profile = readProfile(payload.profile);
  const scores = readScores(payload.scores);
  /* Recomputed here rather than trusted from the body: the score is what the
     sales team prioritises on, and a posted number is a claim, not a fact. */
  const scored = computeScore(scores);

  const cookieAttribution = attributionFromCookieHeader(request.headers.get("cookie"));
  const attribution = hasAnyClickId(cookieAttribution)
    ? cookieAttribution
    : mergeBodyAttribution(cookieAttribution, payload);

  try {
    const leadId = await insertLead({
      source: SOURCE,
      fullName,
      organization,
      email,
      countryCode: country,
      countryName: countries.find(([code]) => code === country)?.[1] ?? country,
      phone,
      website,
      /* The whole assessment folded into the shared message column, so every
         landing page keeps writing the same shape of row and the dashboard
         needs no per-source rendering. */
      message: summarize(role, profile, scored),
      attribution,
    });

    console.info(
      "[clinic/enquiry]",
      JSON.stringify({
        leadId,
        organization,
        country,
        role,
        profile,
        scores,
        percent: scored.percent,
        band: scored.band.label,
      }),
    );

    const queued = await enqueueConversion(leadId, "lead");
    if (queued) {
      after(async () => {
        try {
          await drainConversions(5);
        } catch (error) {
          console.error("[clinic/enquiry] conversion drain failed", error);
        }
      });
    }
  } catch (error) {
    console.error("[clinic/enquiry] delivery failed", error);
    return Response.json(
      { error: "We could not save your answers. Please email us directly." },
      { status: 502 },
    );
  }

  /* The score goes back so the browser renders exactly what was stored. */
  return Response.json({ ok: true, result: scored });
}

/* Only options that actually appear in the quiz are kept; anything else is a
   forged field and is dropped rather than stored. */
function readProfile(raw: unknown): Partial<Record<ProfileKey, string>> {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const out: Partial<Record<ProfileKey, string>> = {};

  for (const key of PROFILE_KEYS) {
    const value = clean(input[key]);
    if (value && profileOptions(key).includes(value)) out[key] = value;
  }
  return out;
}

function readScores(raw: unknown): DomainScores {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const out: DomainScores = {};

  for (const [key, value] of Object.entries(input)) {
    if (!DOMAIN_KEYS.has(key)) continue;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) continue;
    out[key as DomainKey] = Math.min(MAX_PER_DOMAIN, Math.max(0, Math.round(n)));
  }
  return out;
}

function summarize(
  role: string,
  profile: Partial<Record<ProfileKey, string>>,
  scored: ReturnType<typeof computeScore>,
): string {
  const lines = [
    `Readiness score: ${scored.percent}% — ${scored.band.label}`,
    "",
    `Role: ${role}`,
    ...PROFILE_KEYS.filter((key) => profile[key]).map(
      (key) => `${PROFILE_LABEL[key]}: ${profile[key]}`,
    ),
    "",
    "Domain scores:",
    ...scored.domains.map(
      (d) => `  ${d.name}: ${d.points}/${MAX_PER_DOMAIN} — ${d.label}`,
    ),
  ];
  return lines.join("\n").slice(0, MAX_LEN);
}

function hasAnyClickId(attribution: Attribution): boolean {
  return Boolean(attribution.gclid || attribution.gbraid || attribution.wbraid);
}

/* Safari's tracking prevention can drop the cookie before the form is sent.
   The quiz posts whatever it still holds in memory as a second chance. */
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

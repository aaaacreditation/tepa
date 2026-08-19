import { after } from "next/server";
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
const MAX_LEN = 2000;
const VALID_COUNTRY = new Set(countries.map(([code]) => code));

/* 7 to 15 digits covers every national numbering plan. Punctuation and a
   leading + are the visitor's business; only the digit count is checked. */
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

  /* Mirrors the client checks in components/ConsultationForm.tsx; keep the two
     in step. Five fields, exactly what the approved consultation form asks
     for — every extra one is a lead the campaign does not get. */
  const fullName = clean(payload.fullName);
  const organization = clean(payload.organization);
  const email = clean(payload.email);
  const phone = clean(payload.phone);
  const country = clean(payload.country);

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.fullName = "Full name is required.";
  if (!organization) fieldErrors.organization = "Clinic name is required.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "A valid email address is required.";
  if (!validPhone(phone)) fieldErrors.phone = "A valid phone number is required.";
  if (!VALID_COUNTRY.has(country)) fieldErrors.country = "A valid country is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

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
      /* The consultation form asks for neither, so both columns stay empty
         rather than being filled with a placeholder the sales team would have
         to learn to ignore. Every landing page still writes the same shape of
         row, so the dashboard needs no per-source rendering. */
      website: "",
      message: "Requested a free clinic accreditation consultation call.",
      attribution,
    });

    console.info(
      "[clinic/enquiry]",
      JSON.stringify({ leadId, organization, country }),
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
      { error: "We could not save your request. Please email us directly." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
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

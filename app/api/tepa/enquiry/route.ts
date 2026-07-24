import { countries } from "@/app/(frontend)/tepa/countries";
import { insertLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LEN = 2000;
const VALID_COUNTRY = new Set(countries.map(([code]) => code));

export type Enquiry = {
  fullName: string;
  organization: string;
  email: string;
  country: string;
  countryName: string;
  phone: string;
  website: string;
  message: string;
  receivedAt: string;
  source: string;
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
  const country = clean(payload.country);

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.fullName = "Full name is required.";
  if (!organization) fieldErrors.organization = "Organization is required.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "A valid email address is required.";
  if (!VALID_COUNTRY.has(country)) fieldErrors.country = "A valid country is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  const enquiry: Enquiry = {
    fullName,
    organization,
    email,
    country,
    countryName: countries.find(([code]) => code === country)?.[1] ?? country,
    phone: clean(payload.phone),
    website: clean(payload.website),
    message: clean(payload.message),
    receivedAt: new Date().toISOString(),
    source: "tepa",
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
  await insertLead({
    source: enquiry.source,
    fullName: enquiry.fullName,
    organization: enquiry.organization,
    email: enquiry.email,
    countryCode: enquiry.country,
    countryName: enquiry.countryName,
    phone: enquiry.phone,
    website: enquiry.website,
    message: enquiry.message,
  });
  console.info("[tepa/enquiry]", JSON.stringify(enquiry));
}

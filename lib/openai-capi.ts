import "server-only";
import { createHash } from "node:crypto";
import { normalizeMetaEmail, normalizeMetaPhone } from "./meta-identity";

/* Client for the OpenAI Ads Conversions API: the server half of the ChatGPT
   ads pixel.

   It mirrors the Meta pair. The enquiry is reported twice, once by the pixel
   in the browser and once from here, with one shared id so OpenAI counts it
   once; it deduplicates on pixel, event type and id and keeps the first copy
   it receives. The server copy survives ad blockers and is the only one that
   carries hashed contact details. contents_viewed goes the same way, through
   app/api/openai/view, since a page view has no lead row to queue against.

   Only the enquiry itself (lead_created) is reported. The pipeline stages that
   happen later in the dashboard are not sent to OpenAI.

   Reference: developers.openai.com/ads/conversions-api. Written against fetch
   with no SDK, like the Google and Meta clients: one POST. */

const ENDPOINT = "https://bzr.openai.com/v1/events";

/* Shows up against each event in Ads Manager as the integration that sent it. */
const INTEGRATION_SOURCE = "aaa-landing-pages";

export type OpenAIConfig = {
  pixelId: string;
  apiKey: string;
  /* OpenAI validates the event fully, then discards it. For staging, or to
     prove a key works without writing a fake conversion. */
  validateOnly: boolean;
};

export type OpenAIConfigResult =
  | { ok: true; config: OpenAIConfig }
  | { ok: false; missing: string[] };

export function readOpenAIConfig(): OpenAIConfigResult {
  const pixelId = (
    process.env.OPENAI_PIXEL_ID ||
    process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID ||
    ""
  ).trim();
  const apiKey = (process.env.OPENAI_ADS_API_KEY ?? "").trim();
  const validateOnly = process.env.OPENAI_ADS_VALIDATE_ONLY === "true";

  const missing: string[] = [];
  if (!pixelId) missing.push("NEXT_PUBLIC_OPENAI_PIXEL_ID");
  if (!apiKey) missing.push("OPENAI_ADS_API_KEY");

  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, config: { pixelId, apiKey, validateOnly } };
}

export function isOpenAIConfigured(): boolean {
  return readOpenAIConfig().ok;
}

/* ==========================================================================
   Matching keys
   ========================================================================== */

const sha256Hex = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

/* OpenAI takes each identifier as a list of hashes. Empty is left out
   entirely rather than sent as a hash of "". */
const hashedList = (value: string) => (value ? [sha256Hex(value)] : undefined);

/* Names: lowercase, whitespace and ASCII punctuation removed, everything else
   kept, digits and non-Latin scripts included. Stricter than Meta's rule, so
   Meta's normaliser is not reused here. The forms ask for one "Full name"
   field; the first word is the given name, the rest the family name. */
const ASCII_PUNCTUATION = /[\s!-\/:-@\[-`{-~]/g;

function splitOpenAIName(fullName: string | undefined): { first: string; last: string } {
  const words = (fullName ?? "")
    .trim()
    .split(/\s+/)
    .map((word) => word.toLowerCase().replace(ASCII_PUNCTUATION, ""))
    .filter(Boolean);
  if (words.length === 0) return { first: "", last: "" };
  return { first: words[0], last: words.slice(1).join("") };
}

/* OpenAI's cookies carry opaque values; anything that does not look like one
   is dropped rather than forwarded. */
const OPAQUE = /^[A-Za-z0-9._~-]{1,512}$/;
export const cleanOpaque = (value: string | undefined | null): string => {
  const v = (value ?? "").trim();
  return OPAQUE.test(v) ? v : "";
};

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

function validIp(value: string): string | undefined {
  const ip = value.trim();
  if (IPV4.test(ip)) return ip;
  if (ip.includes(":") && IPV6.test(ip)) return ip;
  return undefined;
}

export type OpenAIUser = {
  email?: string;
  phone?: string;
  fullName?: string;
  /* ISO 3166-1 alpha-2. */
  country?: string;
  /* The lead id. */
  externalId?: string;
  /* The pixel's __obref cookie, sent raw. */
  obref?: string;
  clientIp?: string;
  clientUserAgent?: string;
};

export function buildOpenAIUser(user: OpenAIUser): Record<string, unknown> {
  const { first, last } = splitOpenAIName(user.fullName);
  const country = (user.country ?? "").trim().toUpperCase();
  const entries: Array<[string, unknown]> = [
    /* Email and phone rules are the same as Meta's: trimmed lowercase email;
       phone as digits with the country code, no leading zeros, 8–15 long. */
    ["emails_sha256", hashedList(normalizeMetaEmail(user.email))],
    ["phone_numbers_sha256", hashedList(normalizeMetaPhone(user.phone))],
    ["first_names_sha256", hashedList(first)],
    ["last_names_sha256", hashedList(last)],
    ["external_ids_sha256", hashedList((user.externalId ?? "").trim())],
    ["countries", /^[A-Z]{2}$/.test(country) ? [country] : undefined],
    ["obref", cleanOpaque(user.obref) || undefined],
    ["ip_address", validIp(user.clientIp ?? "")],
    ["user_agent", (user.clientUserAgent ?? "").trim() || undefined],
  ];
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

/* ==========================================================================
   Send
   ========================================================================== */

export type OpenAIEventType = "lead_created" | "contents_viewed";

export type OpenAIEvent = {
  type: OpenAIEventType;
  /* Must equal the event_id the pixel used, or OpenAI counts the event twice. */
  id: string;
  eventTime: Date;
  /* Required for web events: scheme and host included. */
  sourceUrl: string;
  /* The click reference from the ad, captured by the pixel in __oppref. */
  oppref?: string;
  user: OpenAIUser;
  /* data.type has to match the event: customer_action for lead_created,
     contents for contents_viewed. */
  data: Record<string, unknown>;
};

export type OpenAIOutcome = {
  acceptedEvents: number;
};

export class OpenAICapiError extends Error {
  readonly retryable: boolean;
  readonly status: number;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "OpenAICapiError";
    this.status = status;
    this.retryable = retryable;
  }
}

/* OpenAI rejects the batch if any event is dated further back. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function sendOpenAIEvent(
  config: OpenAIConfig,
  event: OpenAIEvent,
): Promise<OpenAIOutcome> {
  const now = Date.now();
  const timestampMs = Math.min(now, event.eventTime.getTime());
  if (now - timestampMs > MAX_AGE_MS) {
    throw new OpenAICapiError(
      "Event is older than the 7 days OpenAI accepts, so it can no longer be reported.",
      0,
      false,
    );
  }

  const user = buildOpenAIUser(event.user);
  const oppref = cleanOpaque(event.oppref);

  const payload = {
    validate_only: config.validateOnly,
    integration_source: INTEGRATION_SOURCE,
    events: [
      {
        id: event.id,
        type: event.type,
        timestamp_ms: timestampMs,
        action_source: "web",
        source_url: event.sourceUrl,
        ...(oppref ? { oppref } : {}),
        ...(Object.keys(user).length > 0 ? { user } : {}),
        data: event.data,
      },
    ],
  };

  const response = await fetch(`${ENDPOINT}?pid=${encodeURIComponent(config.pixelId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();
  let body: {
    accepted_events?: number;
    error?: { message?: string; code?: string | null; errors?: Array<{ message?: string }> };
  } = {};
  try {
    body = JSON.parse(text);
  } catch {
    /* Handled below by status. */
  }

  if (!response.ok || body.error) {
    const error = body.error ?? {};
    const details = (error.errors ?? []).map((e) => e.message).filter(Boolean);
    const detail = [error.message, ...details].filter(Boolean).join(" ") || summarize(text);

    /* Rate limits and server trouble are worth another go. 401 is a bad or
       revoked key: left retryable, capped by the attempt limit, so a key fixed
       in the environment drains what queued in the meantime. Any other 4xx is
       an invalid event that will fail the same way again. */
    const retryable =
      response.status === 401 || response.status === 429 || response.status >= 500;

    throw new OpenAICapiError(
      `OpenAI Conversions API rejected the event (HTTP ${response.status}${
        error.code ? `, ${error.code}` : ""
      }): ${summarize(detail || "no detail")}`,
      response.status,
      retryable,
    );
  }

  return { acceptedEvents: Number(body.accepted_events ?? 0) };
}

function summarize(text: string, limit = 400): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > limit ? `${collapsed.slice(0, limit)}…` : collapsed;
}

/* ==========================================================================
   Browser ids
   ========================================================================== */

export const OPENAI_CLICK_COOKIE = "__oppref";
export const OPENAI_BROWSER_COOKIE = "__obref";

function cookieValue(header: string | null, name: string): string {
  if (!header) return "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return part.slice(index + 1).trim();
    }
  }
  return "";
}

export type OpenAIBrowserIds = { oppref: string; obref: string };

/* The pixel writes both cookies on the landing domain, so they ride along with
   any same origin request the page makes. */
export function openaiIdsFromCookies(header: string | null): OpenAIBrowserIds {
  return {
    oppref: cleanOpaque(cookieValue(header, OPENAI_CLICK_COOKIE)),
    obref: cleanOpaque(cookieValue(header, OPENAI_BROWSER_COOKIE)),
  };
}

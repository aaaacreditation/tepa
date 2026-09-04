import "server-only";
import { createHash } from "node:crypto";
import type { PipelineStage } from "./lead-status";
import {
  normalizeMetaCountry,
  normalizeMetaEmail,
  normalizeMetaPhone,
  splitMetaName,
} from "./meta-identity";

/* Client for the Meta Conversions API: the server half of the pixel.

   The enquiry is reported twice, once by the pixel in the browser and once
   from here, with one shared event_id so Meta counts it once. The browser
   copy is fast and carries the pixel's own cookies; the server copy survives
   ad blockers and Safari, and is the only one that can carry hashed contact
   details for matching. The pipeline stages that happen days later in the
   dashboard have no browser at all and only ever come through here.

   One pixel, "AAA - Landing Pages", serves every landing page. Meta tells
   them apart by the page URL and by the content_category each event carries,
   through custom conversions built in Events Manager, so there is nothing to
   configure per page. See docs/meta-conversions.md.

   Written against fetch with no SDK, like the Google client: one POST. */

export const DEFAULT_GRAPH_VERSION = "v26.0";

export type MetaConfig = {
  pixelId: string;
  accessToken: string;
  version: string;
  /* Events Manager → Test events code. Events sent with it show up in that
     tab and count for nothing, so it must be blank in production. */
  testEventCode: string;
};

export type MetaConfigResult =
  | { ok: true; config: MetaConfig }
  | { ok: false; missing: string[] };

export function readMetaConfig(): MetaConfigResult {
  const pixelId = (
    process.env.META_PIXEL_ID ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    ""
  ).replace(/\D/g, "");
  const accessToken = (process.env.META_CAPI_ACCESS_TOKEN ?? "").trim();
  const version = (process.env.META_GRAPH_VERSION ?? "").trim() || DEFAULT_GRAPH_VERSION;
  const testEventCode = (process.env.META_TEST_EVENT_CODE ?? "").trim();

  const missing: string[] = [];
  if (!pixelId) missing.push("NEXT_PUBLIC_META_PIXEL_ID");
  if (!accessToken) missing.push("META_CAPI_ACCESS_TOKEN");

  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, config: { pixelId, accessToken, version, testEventCode } };
}

export function isMetaConfigured(): boolean {
  return readMetaConfig().ok;
}

/* ==========================================================================
   Stage → event
   ========================================================================== */

/* Lead is the standard event Meta's lead objectives already optimise for, and
   Purchase is the standard event whose value Meta will optimise towards. The
   two middle stages have no standard counterpart and go as custom events under
   the names the dashboard uses. Any of the four can be renamed, or switched
   off with "off", through META_EVENT_<STAGE>. */
const DEFAULT_EVENT: Record<PipelineStage, string> = {
  lead: "Lead",
  mql: "MQL",
  sql: "SQL",
  customer: "Purchase",
};

export function metaEventFor(stage: PipelineStage): string | null {
  const raw = process.env[`META_EVENT_${stage.toUpperCase()}`];
  const name = raw === undefined ? DEFAULT_EVENT[stage] : raw.trim();
  if (!name || name.toLowerCase() === "off") return null;
  return name;
}

/* ==========================================================================
   Matching keys
   ========================================================================== */

const sha256Hex = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

/* Empty stays undefined so the key is left out, not sent as a hash of "". */
const hashed = (value: string) => (value ? sha256Hex(value) : undefined);

export type MetaUser = {
  email?: string;
  phone?: string;
  fullName?: string;
  country?: string;
  /* The lead id. Hashed on the way out, as Meta recommends. */
  externalId?: string;
  /* Sent raw: Meta hashes these itself and rejects pre-hashed values. */
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
};

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

function validIp(value: string): string | undefined {
  const ip = value.trim();
  if (IPV4.test(ip)) return ip;
  if (ip.includes(":") && IPV6.test(ip)) return ip;
  return undefined;
}

export function buildUserData(user: MetaUser): Record<string, string> {
  const { fn, ln } = splitMetaName(user.fullName);
  const entries: Array<[string, string | undefined]> = [
    ["em", hashed(normalizeMetaEmail(user.email))],
    ["ph", hashed(normalizeMetaPhone(user.phone))],
    ["fn", hashed(fn)],
    ["ln", hashed(ln)],
    ["country", hashed(normalizeMetaCountry(user.country))],
    ["external_id", hashed((user.externalId ?? "").trim())],
    ["client_ip_address", validIp(user.clientIp ?? "")],
    ["client_user_agent", (user.clientUserAgent ?? "").trim() || undefined],
    ["fbp", (user.fbp ?? "").trim() || undefined],
    ["fbc", (user.fbc ?? "").trim() || undefined],
  ];
  return Object.fromEntries(
    entries.filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

/* ==========================================================================
   Send
   ========================================================================== */

/* "website" is the enquiry itself, which happened on the landing page.
   "system_generated" is Meta's action source for events a CRM reports later,
   which is what a stage change in the dashboard is. */
export type MetaActionSource = "website" | "system_generated";

export type MetaEvent = {
  eventName: string;
  /* Must equal the eventID the pixel used, or Meta counts the event twice. */
  eventId: string;
  eventTime: Date;
  actionSource: MetaActionSource;
  /* Meta requires it for website events. */
  eventSourceUrl?: string;
  user: MetaUser;
  customData?: Record<string, unknown>;
};

export type MetaOutcome = {
  eventsReceived: number;
  traceId: string;
};

export class MetaCapiError extends Error {
  readonly retryable: boolean;
  readonly status: number;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "MetaCapiError";
    this.status = status;
    this.retryable = retryable;
  }
}

/* Meta rejects a batch outright if any event is dated further back. */
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type GraphError = {
  message?: string;
  code?: number;
  error_subcode?: number;
  is_transient?: boolean;
  error_user_msg?: string;
  fbtrace_id?: string;
};

export async function sendMetaEvent(
  config: MetaConfig,
  event: MetaEvent,
): Promise<MetaOutcome> {
  const now = Math.floor(Date.now() / 1000);
  const eventTime = Math.min(now, Math.floor(event.eventTime.getTime() / 1000));
  if (now - eventTime > MAX_AGE_SECONDS) {
    throw new MetaCapiError(
      "Event is older than the 7 days Meta accepts, so it can no longer be reported.",
      0,
      false,
    );
  }

  const userData = buildUserData(event.user);
  if (Object.keys(userData).length === 0) {
    throw new MetaCapiError(
      "Lead has nothing Meta can match on: no email, phone, name, or browser id.",
      0,
      false,
    );
  }

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: eventTime,
        event_id: event.eventId,
        action_source: event.actionSource,
        ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
        user_data: userData,
        ...(event.customData ? { custom_data: event.customData } : {}),
        /* Empty means no restricted data processing. The form states the
           enquiry is a request to be contacted, which is the consent basis,
           the same as for the Google upload. */
        data_processing_options: [],
      },
    ],
    ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
  };

  /* Bearer auth keeps the token out of the URL, and so out of any proxy or
     error log that records request lines. */
  const response = await fetch(
    `https://graph.facebook.com/${config.version}/${config.pixelId}/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  const text = await response.text();
  let body: { events_received?: number; fbtrace_id?: string; error?: GraphError } = {};
  try {
    body = JSON.parse(text);
  } catch {
    /* Handled below by status. */
  }

  if (!response.ok || body.error) {
    const error = body.error ?? {};
    const code = Number(error.code ?? 0);
    const detail = error.error_user_msg || error.message || summarize(text) || "no detail";
    const codes = [code, error.error_subcode].filter(Boolean).join("/");

    /* Meta flags its own transient failures. Rate limits (4, 17, 32, 613),
       generic API trouble (1, 2) and 5xx are worth another go. 190 is a dead
       token: also left retryable, capped by the attempt limit, so a token
       fixed in the environment drains what queued in the meantime. Everything
       else — an invalid parameter, a missing permission — will fail the same
       way again and is settled now. */
    const retryable =
      error.is_transient === true ||
      response.status === 429 ||
      response.status >= 500 ||
      [1, 2, 4, 17, 32, 190, 613].includes(code);

    throw new MetaCapiError(
      `Conversions API rejected the event (HTTP ${response.status}${
        codes ? `, code ${codes}` : ""
      }): ${summarize(detail)}`,
      response.status,
      retryable,
    );
  }

  return {
    eventsReceived: Number(body.events_received ?? 0),
    traceId: typeof body.fbtrace_id === "string" ? body.fbtrace_id : "",
  };
}

/* The outbox keeps one line of any error body. */
function summarize(text: string, limit = 400): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > limit ? `${collapsed.slice(0, limit)}…` : collapsed;
}

import "server-only";
import { createHash } from "node:crypto";

/* Client for the Google Data Manager API, which is where offline conversion
   imports live now.

   The older path, ConversionUploadService.UploadClickConversions on the Google
   Ads API, stopped accepting new integrations on 15 June 2026: a developer
   token that had not already uploaded offline conversions before that date is
   rejected. This project had no tracking at all before now, so it is a new
   integration and has to target the replacement endpoint.
   See https://developers.google.com/data-manager/api/reference/rest/v1/events/ingest

   Written against fetch with no SDK. The whole surface used here is one OAuth
   refresh and one POST, and the official client library would add a large
   dependency tree to a project that currently ships three runtime packages. */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const INGEST_URL = "https://datamanager.googleapis.com/v1/events:ingest";

/* Data Manager authorises against its own scope. A refresh token minted for
   the Google Ads API scope alone will not work here. */
export const DATA_MANAGER_SCOPE = "https://www.googleapis.com/auth/datamanager";

export type GoogleAdsConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  /* Google Ads customer id receiving the conversions, digits only. */
  customerId: string;
  /* Manager (MCC) account id when access is delegated through one. */
  loginCustomerId: string;
};

export type ConfigResult =
  | { ok: true; config: GoogleAdsConfig }
  | { ok: false; missing: string[] };

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export function readConfig(): ConfigResult {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET ?? "";
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN ?? "";
  const customerId = digitsOnly(process.env.GOOGLE_ADS_CUSTOMER_ID ?? "");
  const loginCustomerId = digitsOnly(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? "");

  const missing: string[] = [];
  if (!clientId) missing.push("GOOGLE_ADS_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_ADS_CLIENT_SECRET");
  if (!refreshToken) missing.push("GOOGLE_ADS_REFRESH_TOKEN");
  if (!customerId) missing.push("GOOGLE_ADS_CUSTOMER_ID");

  if (missing.length > 0) return { ok: false, missing };
  return {
    ok: true,
    config: { clientId, clientSecret, refreshToken, customerId, loginCustomerId },
  };
}

export function isConfigured(): boolean {
  return readConfig().ok;
}

/* ==========================================================================
   Access tokens
   ========================================================================== */

type CachedToken = { token: string; expiresAt: number };

declare global {
  var __aaaGoogleAdsToken: CachedToken | undefined;
}

/* Google access tokens last an hour. Refreshing on every conversion would add
   a round trip per upload and burn quota, so the token is cached on globalThis
   and retired a minute early to stay clear of the boundary. */
export async function getAccessToken(config: GoogleAdsConfig): Promise<string> {
  const cached = globalThis.__aaaGoogleAdsToken;
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    const detail = body.error_description || body.error || `HTTP ${response.status}`;
    /* invalid_grant is the one operators hit most: the refresh token was
       revoked, was minted for a different client, or the OAuth consent screen
       is still in Testing mode, where refresh tokens expire after 7 days. */
    throw new Error(`Google OAuth refresh failed: ${detail}`);
  }

  const token = body.access_token;
  globalThis.__aaaGoogleAdsToken = {
    token,
    expiresAt: Date.now() + Math.max(0, (body.expires_in ?? 3600) - 60) * 1000,
  };
  return token;
}

/* Drop the cached token so the next call re-refreshes. Used after a 401. */
export function clearTokenCache() {
  globalThis.__aaaGoogleAdsToken = undefined;
}

/* ==========================================================================
   Identifier normalisation

   Google matches hashed identifiers only if both sides normalise them the same
   way, so getting this wrong silently lowers the match rate rather than
   erroring. Rules: trim, lowercase, strip gmail dots, E.164 for phone, then
   SHA-256 and hex encode.
   ========================================================================== */

const sha256Hex = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return "";

  const at = trimmed.lastIndexOf("@");
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  /* gmail ignores dots and anything after a plus, so the raw address and the
     address Google holds can differ. Normalising both to the same canonical
     form is what makes the hashes line up. */
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const canonical = local.split("+")[0].replace(/\./g, "");
    return canonical ? `${canonical}@gmail.com` : "";
  }
  return `${local}@${domain}`;
}

export function hashEmail(email: string): string {
  const normalized = normalizeEmail(email);
  return normalized ? sha256Hex(normalized) : "";
}

/* Phone numbers must be E.164. Without a country dial code we cannot invent
   one, and a wrong guess produces a hash that matches nobody, so an
   unprefixed number is dropped rather than sent. */
export function hashPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed.startsWith("+")) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return sha256Hex(`+${digits}`);
}

/* ==========================================================================
   Event ingestion
   ========================================================================== */

export type IngestEvent = {
  /* Conversion action id in Google Ads that this stage reports against. */
  conversionActionId: string;
  /* Stable per lead and stage so a retry cannot double count. */
  transactionId: string;
  occurredAt: Date;
  value: number;
  currency: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  email: string;
  phone: string;
};

export type IngestOutcome = {
  requestId: string;
  warnings: string[];
};

type IngestResponse = {
  requestId?: string;
  warnings?: unknown[];
  errors?: unknown[];
};

export class GoogleAdsError extends Error {
  readonly retryable: boolean;
  readonly status: number;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "GoogleAdsError";
    this.status = status;
    this.retryable = retryable;
  }
}

export async function ingestEvent(
  config: GoogleAdsConfig,
  event: IngestEvent,
  options: { validateOnly?: boolean } = {},
): Promise<IngestOutcome> {
  const hashedEmail = hashEmail(event.email);
  const hashedPhone = hashPhone(event.phone);
  const hasClickId = Boolean(event.gclid || event.gbraid || event.wbraid);

  /* Google needs at least one way to tie the conversion to a click. A click id
     is the strong signal; hashed contact details are the enhanced conversions
     fallback for leads that arrived without one. With neither, the upload is
     guaranteed to be unmatched, so refuse locally instead of paying a round
     trip to be told the same thing. */
  if (!hasClickId && !hashedEmail && !hashedPhone) {
    throw new GoogleAdsError(
      "Lead has no gclid and no hashable email or phone, so Google cannot match it to a click.",
      0,
      false,
    );
  }

  const userIdentifiers: Array<Record<string, string>> = [];
  if (hashedEmail) userIdentifiers.push({ emailAddress: hashedEmail });
  if (hashedPhone) userIdentifiers.push({ phoneNumber: hashedPhone });

  const adIdentifiers: Record<string, string> = {};
  if (event.gclid) adIdentifiers.gclid = event.gclid;
  if (event.gbraid) adIdentifiers.gbraid = event.gbraid;
  if (event.wbraid) adIdentifiers.wbraid = event.wbraid;

  /* accountType, not the deprecated `product` field, and the enum value is
     GOOGLE_ADS rather than GOOGLE_ADS_ACCOUNT. Getting this wrong returns a
     400 naming ProductAccount.AccountType. */
  const operatingAccount = {
    accountType: "GOOGLE_ADS",
    accountId: config.customerId,
  };

  const payload: Record<string, unknown> = {
    destinations: [
      {
        operatingAccount,
        /* Only meaningful when a manager account fronts the credentials;
           otherwise the operating account logs in as itself. */
        loginAccount: config.loginCustomerId
          ? { accountType: "GOOGLE_ADS", accountId: config.loginCustomerId }
          : operatingAccount,
        productDestinationId: event.conversionActionId,
      },
    ],
    /* HEX has to agree with the digest encoding used above. */
    encoding: "HEX",
    events: [
      {
        transactionId: event.transactionId,
        eventTimestamp: event.occurredAt.toISOString(),
        eventSource: "WEB",
        ...(Object.keys(adIdentifiers).length > 0 ? { adIdentifiers } : {}),
        ...(userIdentifiers.length > 0 ? { userData: { userIdentifiers } } : {}),
        conversionValue: event.value,
        currency: event.currency,
      },
    ],
    /* The form states the enquiry is a request to be contacted, which is the
       consent basis for reporting it back to the ad platform. */
    consent: {
      adUserData: "CONSENT_GRANTED",
      adPersonalization: "CONSENT_GRANTED",
    },
    validateOnly: Boolean(options.validateOnly),
  };

  const token = await getAccessToken(config);
  const response = await fetch(INGEST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    /* A stale cached token surfaces as a 401. Drop it so the retry refreshes
       rather than replaying the same dead credential. */
    if (response.status === 401) clearTokenCache();

    /* 408/429 and 5xx are transient; most 4xx mean the request itself is wrong
       and replaying it unchanged will fail identically.

       NOT_FOUND on the conversion action is the exception. Google returns it as
       a 400 for a newly created action that has not propagated to Data Manager
       yet, which can take hours. Treating that as permanent would silently drop
       every conversion recorded in the meantime, so it retries. A genuinely
       wrong action id simply exhausts the attempt limit and lands in 'failed',
       where the dashboard shows it. */
    const notFound = /NOT_FOUND|Resource not found/i.test(text);

    const retryable =
      notFound ||
      response.status === 401 ||
      response.status === 408 ||
      response.status === 429 ||
      response.status >= 500;

    throw new GoogleAdsError(
      `Data Manager ingest failed (HTTP ${response.status}): ${summarize(text)}`,
      response.status,
      retryable,
    );
  }

  let parsed: IngestResponse = {};
  try {
    parsed = JSON.parse(text) as IngestResponse;
  } catch {
    /* A 200 with an unreadable body still means Google accepted it. */
  }

  return {
    requestId: typeof parsed.requestId === "string" ? parsed.requestId : "",
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.map((w) => summarize(JSON.stringify(w))).filter(Boolean)
      : [],
  };
}

/* Google error bodies can run to kilobytes. The outbox keeps one line of it. */
function summarize(text: string, limit = 400): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > limit ? `${collapsed.slice(0, limit)}…` : collapsed;
}

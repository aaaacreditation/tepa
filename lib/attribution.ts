/* Ad attribution captured on the landing page.

   Google matches an offline conversion back to the ad click through the click
   identifier, so this value is the difference between a conversion that feeds
   Smart Bidding and one that is invisible to it. The identifier is written to
   a first party cookie the moment the visitor lands and read back server side
   when the enquiry is posted, which survives the visitor wandering the page,
   opening Calendly, and coming back before filling the form.

   No "server-only" import here: the shape and the cookie name are shared with
   the browser component that writes it. */

export const ATTRIBUTION_COOKIE = "aaa_attr";

/* Google Ads counts a click for 90 days by default. Matching that here keeps
   the cookie alive exactly as long as the click is still attributable. */
export const ATTRIBUTION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

/* gclid is the standard click id. gbraid and wbraid replace it on iOS traffic
   where Google cannot pass a user level identifier, and they are mutually
   exclusive with it, so all three are carried and whichever arrived wins. */
export const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type Attribution = {
  gclid: string;
  gbraid: string;
  wbraid: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  landingPath: string;
  referrer: string;
  /* ISO timestamp of when the click identifier was first seen. */
  clickedAt: string;
};

export const EMPTY_ATTRIBUTION: Attribution = {
  gclid: "",
  gbraid: "",
  wbraid: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  landingPath: "",
  referrer: "",
  clickedAt: "",
};

/* Cookie payload uses short keys because browsers cap a cookie at 4KB and a
   referrer URL can be long on its own. */
type Wire = {
  g?: string;
  gb?: string;
  wb?: string;
  us?: string;
  um?: string;
  uc?: string;
  ut?: string;
  un?: string;
  lp?: string;
  rf?: string;
  ts?: string;
};

const MAX_FIELD = 512;

const trim = (value: unknown): string =>
  typeof value === "string" ? value.trim().slice(0, MAX_FIELD) : "";

export function hasClickId(attribution: Attribution): boolean {
  return Boolean(attribution.gclid || attribution.gbraid || attribution.wbraid);
}

/* True when there is anything worth persisting. A visitor arriving from an
   organic search has no click id and no utm tags, and writing a cookie for
   them would be noise. */
export function hasAttribution(attribution: Attribution): boolean {
  return (
    hasClickId(attribution) ||
    Boolean(
      attribution.utmSource ||
        attribution.utmMedium ||
        attribution.utmCampaign ||
        attribution.utmTerm ||
        attribution.utmContent,
    )
  );
}

export function serializeAttribution(attribution: Attribution): string {
  const wire: Wire = {};
  if (attribution.gclid) wire.g = attribution.gclid;
  if (attribution.gbraid) wire.gb = attribution.gbraid;
  if (attribution.wbraid) wire.wb = attribution.wbraid;
  if (attribution.utmSource) wire.us = attribution.utmSource;
  if (attribution.utmMedium) wire.um = attribution.utmMedium;
  if (attribution.utmCampaign) wire.uc = attribution.utmCampaign;
  if (attribution.utmTerm) wire.ut = attribution.utmTerm;
  if (attribution.utmContent) wire.un = attribution.utmContent;
  if (attribution.landingPath) wire.lp = attribution.landingPath;
  if (attribution.referrer) wire.rf = attribution.referrer;
  if (attribution.clickedAt) wire.ts = attribution.clickedAt;
  return JSON.stringify(wire);
}

export function parseAttribution(raw: string | undefined | null): Attribution {
  if (!raw) return { ...EMPTY_ATTRIBUTION };
  try {
    const wire = JSON.parse(raw) as Wire;
    if (!wire || typeof wire !== "object") return { ...EMPTY_ATTRIBUTION };
    return {
      gclid: trim(wire.g),
      gbraid: trim(wire.gb),
      wbraid: trim(wire.wb),
      utmSource: trim(wire.us),
      utmMedium: trim(wire.um),
      utmCampaign: trim(wire.uc),
      utmTerm: trim(wire.ut),
      utmContent: trim(wire.un),
      landingPath: trim(wire.lp),
      referrer: trim(wire.rf),
      clickedAt: trim(wire.ts),
    };
  } catch {
    return { ...EMPTY_ATTRIBUTION };
  }
}

/* Pull attribution out of a query string. Exported so the browser component
   and any server side test can agree on the rules. */
export function attributionFromSearch(
  search: string,
  landingPath: string,
  referrer: string,
  now: string,
): Attribution {
  const params = new URLSearchParams(search);
  const get = (key: string) => trim(params.get(key));

  const attribution: Attribution = {
    gclid: get("gclid"),
    gbraid: get("gbraid"),
    wbraid: get("wbraid"),
    utmSource: get("utm_source"),
    utmMedium: get("utm_medium"),
    utmCampaign: get("utm_campaign"),
    utmTerm: get("utm_term"),
    utmContent: get("utm_content"),
    landingPath: trim(landingPath),
    referrer: trim(referrer),
    clickedAt: now,
  };

  return attribution;
}

/* Read the cookie from a raw Cookie header. Route handlers get the header
   directly, so this avoids pulling in next/headers for one lookup. */
export function attributionFromCookieHeader(header: string | null): Attribution {
  if (!header) return { ...EMPTY_ATTRIBUTION };
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== ATTRIBUTION_COOKIE) continue;
    try {
      return parseAttribution(decodeURIComponent(part.slice(eq + 1).trim()));
    } catch {
      return { ...EMPTY_ATTRIBUTION };
    }
  }
  return { ...EMPTY_ATTRIBUTION };
}

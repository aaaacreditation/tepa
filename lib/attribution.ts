/* Ad attribution captured on the landing page.

   Google matches an offline conversion back to the ad click through the click
   identifier, so this value is the difference between a conversion that feeds
   Smart Bidding and one that is invisible to it. The identifier is written to
   a first party cookie the moment the visitor lands and read back server side
   when the enquiry is posted, which survives the visitor wandering the page,
   opening Calendly, and coming back before filling the form.

   Meta's click id rides in the same cookie. Its own _fbc cookie is written by
   the pixel and dies after seven days on Safari, the same as this one, so the
   attribution cookie keeps a copy that the Conversions API can rebuild fbc
   from when the pixel's cookie has gone; see metaIdsFromCookies.

   No "server-only" import here: the shape and the cookie name are shared with
   the browser component that writes it. */

export const ATTRIBUTION_COOKIE = "aaa_attr";

/* Google Ads counts a click for 90 days by default. Matching that here keeps
   the cookie alive exactly as long as the click is still attributable. */
export const ATTRIBUTION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

/* gclid is Google's click id. gbraid and wbraid replace it on iOS traffic
   where Google cannot pass a user level identifier, and they are mutually
   exclusive with it, so all three are carried and whichever arrived wins.
   fbclid is Meta's, and lives alongside them rather than replacing them: each
   platform attributes on its own last click within its own window. */
export const GOOGLE_CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;
export const CLICK_ID_KEYS = [...GOOGLE_CLICK_ID_KEYS, "fbclid"] as const;

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
  fbclid: string;
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
  fbclid: "",
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
  fb?: string;
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

export function hasGoogleClickId(attribution: Attribution): boolean {
  return Boolean(attribution.gclid || attribution.gbraid || attribution.wbraid);
}

export function hasClickId(attribution: Attribution): boolean {
  return hasGoogleClickId(attribution) || Boolean(attribution.fbclid);
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
  if (attribution.fbclid) wire.fb = attribution.fbclid;
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
      fbclid: trim(wire.fb),
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
    fbclid: get("fbclid"),
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

/* Fold what a visit brought into what the cookie already holds.

   Google and Meta each attribute on their own last click inside their own
   window, so a Meta click must not wipe out a Google click that is still live,
   and vice versa: each platform's id is only replaced by a newer click from
   the same platform. The campaign tags and landing details follow the newest
   click. Without any click they only ever fill an empty cookie, so a visitor
   who comes back through a tagged newsletter link keeps the ad click that
   first brought them. */
export function mergeAttribution(existing: Attribution, incoming: Attribution): Attribution {
  const google = hasGoogleClickId(incoming) ? incoming : existing;
  const newest = hasClickId(incoming) || !hasClickId(existing) ? incoming : existing;

  return {
    gclid: google.gclid,
    gbraid: google.gbraid,
    wbraid: google.wbraid,
    fbclid: incoming.fbclid || existing.fbclid,
    utmSource: newest.utmSource,
    utmMedium: newest.utmMedium,
    utmCampaign: newest.utmCampaign,
    utmTerm: newest.utmTerm,
    utmContent: newest.utmContent,
    landingPath: newest.landingPath,
    referrer: newest.referrer,
    clickedAt: newest.clickedAt,
  };
}

/* One cookie out of a raw Cookie header. Route handlers get the header
   directly, so this avoids pulling in next/headers for a lookup. */
export function cookieFromHeader(header: string | null, name: string): string {
  if (!header) return "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return "";
    }
  }
  return "";
}

export function attributionFromCookieHeader(header: string | null): Attribution {
  return parseAttribution(cookieFromHeader(header, ATTRIBUTION_COOKIE));
}

/* ==========================================================================
   Meta's own cookies
   ========================================================================== */

/* _fbp identifies the browser and is written by the pixel on every visit.
   _fbc holds the click id from the ad and is written when the pixel sees
   fbclid in the URL. Both go to the Conversions API exactly as stored. */
export const META_BROWSER_COOKIE = "_fbp";
export const META_CLICK_COOKIE = "_fbc";

export type MetaBrowserIds = { fbp: string; fbc: string };

/* Meta's format for both is fb.<subdomain index>.<creation time ms>.<value>.
   Anything else is dropped rather than sent, since a malformed id fails the
   whole event. */
const FBP_SHAPE = /^fb\.\d\.\d+\.\d+$/;
const FBC_SHAPE = /^fb\.\d\.\d+\..+$/;

export function metaIdsFromCookies(
  header: string | null,
  attribution: Attribution,
): MetaBrowserIds {
  const fbp = cookieFromHeader(header, META_BROWSER_COOKIE);
  let fbc = cookieFromHeader(header, META_CLICK_COOKIE);

  /* When the pixel's click cookie is gone — Safari expired it, or the pixel
     never ran — it is rebuilt from the fbclid this cookie kept, in the shape
     Meta documents for server side capture: subdomain index 1 and the time
     the click id was first seen. */
  if (!FBC_SHAPE.test(fbc) && attribution.fbclid) {
    const seen = Date.parse(attribution.clickedAt);
    fbc = `fb.1.${Number.isFinite(seen) ? seen : Date.now()}.${attribution.fbclid}`;
  }

  return {
    fbp: FBP_SHAPE.test(fbp) ? fbp.slice(0, MAX_FIELD) : "",
    fbc: FBC_SHAPE.test(fbc) ? fbc.slice(0, MAX_FIELD) : "",
  };
}

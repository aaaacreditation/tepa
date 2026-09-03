"use client";

import { useEffect } from "react";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  attributionFromSearch,
  hasAttribution,
  mergeAttribution,
  parseAttribution,
  serializeAttribution,
} from "@/lib/attribution";

/* Writes the ad click identifier into a first party cookie as soon as the
   visitor lands. The enquiry route reads it back when the form is posted, so a
   visitor who reads the whole page, books a Calendly call, and returns an hour
   later still submits with the click that paid for them attached.

   Renders nothing. Mounted once from the TEPA layout. */
export function AttributionCapture() {
  useEffect(() => {
    /* Reading document.cookie only tells us the value, never the flags, so the
       write below always restates max-age and path. */
    const existing = parseAttribution(readCookie(ATTRIBUTION_COOKIE));

    const incoming = attributionFromSearch(
      window.location.search,
      window.location.pathname,
      /* Same origin referrers are internal navigation, not the traffic source. */
      isExternal(document.referrer) ? document.referrer : "",
      new Date().toISOString(),
    );

    if (!hasAttribution(incoming)) return;

    /* A fresh click replaces the stored one from the same platform and brings
       its campaign tags with it; without a click, tags never overwrite a click
       that is still inside its attribution window. Nothing new means nothing
       written, so the cookie's clock is not restarted by a plain return visit. */
    const merged = serializeAttribution(mergeAttribution(existing, incoming));
    if (merged === serializeAttribution(existing)) return;

    writeCookie(ATTRIBUTION_COOKIE, merged);
  }, []);

  return null;
}

function isExternal(referrer: string): boolean {
  if (!referrer) return false;
  try {
    return new URL(referrer).host !== window.location.host;
  } catch {
    return false;
  }
}

function readCookie(name: string): string {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const entry = part.trim();
    if (entry.startsWith(prefix)) {
      try {
        return decodeURIComponent(entry.slice(prefix.length));
      } catch {
        return "";
      }
    }
  }
  return "";
}

function writeCookie(name: string, value: string) {
  /* Lax lets the cookie ride the top level navigation in from the ad click,
     which Strict would drop. Not HttpOnly because the browser has to write it;
     it holds a click id, never anything about the visitor. */
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${name}=${encodeURIComponent(value)}` +
    `; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}` +
    `; Path=/; SameSite=Lax${secure}`;
}

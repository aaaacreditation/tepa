"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  type MetaIdentity,
  normalizeMetaCountry,
  normalizeMetaEmail,
  normalizeMetaPhone,
  splitMetaName,
} from "@/lib/meta-identity";

/* Meta pixel, loaded only when a pixel id is configured so the page ships no
   third party script until the campaign is wired up — the same rule as the
   Google tag.

   This is the browser half of Meta tracking. PageView and ViewContent are
   browser only. The enquiry's Lead fires here too, with an event id the form
   minted and posted along with the enquiry, so the Conversions API copy the
   server sends is recognised as the same event and counted once. The pipeline
   stages that happen later in the dashboard never touch the browser and go
   through the server alone; see lib/meta-capi.ts. */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export const META_PIXEL_ENABLED = Boolean(PIXEL_ID);

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <RouteChangePageView />
    </>
  );
}

/* The snippet fires the first PageView itself. This covers client side
   navigation, which the landing pages do not do today but a link between two
   of them would. */
function RouteChangePageView() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}

/* One id for both halves of an event. The form mints it before posting the
   enquiry so the server can send its copy with the same id. */
export function newMetaEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const part = () => Math.random().toString(36).slice(2, 12);
  return `${Date.now().toString(36)}-${part()}-${part()}`;
}

/* Fire a Meta event from the browser.

   Missing config is a no-op rather than an error, as with the Google tag: the
   page must keep working for a visitor whether or not the campaign is live. */
export function metaTrack(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId?: string,
  identity?: MetaIdentity,
) {
  if (typeof window === "undefined" || !PIXEL_ID) return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;

  /* Advanced matching: the pixel hashes these before they leave the browser.
     Running init again with the same id merges the values into the pixel
     already on the page instead of starting a second one, which is how Meta
     documents passing details that were not known at page load. */
  if (identity) {
    const matched: Record<string, string> = {};
    const em = normalizeMetaEmail(identity.email);
    const ph = normalizeMetaPhone(identity.phone);
    const { fn, ln } = splitMetaName(identity.fullName);
    const country = normalizeMetaCountry(identity.country);
    if (em) matched.em = em;
    if (ph) matched.ph = ph;
    if (fn) matched.fn = fn;
    if (ln) matched.ln = ln;
    if (country) matched.country = country;
    if (Object.keys(matched).length > 0) fbq("init", PIXEL_ID, matched);
  }

  if (eventId) fbq("track", eventName, params, { eventID: eventId });
  else fbq("track", eventName, params);
}

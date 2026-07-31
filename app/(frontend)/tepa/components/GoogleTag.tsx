"use client";

import Script from "next/script";

/* Google Ads gtag.js, loaded only when a conversion id is configured so the
   page ships no third party script until the campaign is actually wired up.

   This covers the in browser half of the tracking: the form submit and the
   Calendly click, both of which happen while the visitor is still on the page.
   The pipeline stages that happen later, when someone moves a lead to MQL, SQL
   or Customer in the dashboard, cannot be tracked from here at all and go
   through the server side Data Manager upload instead. */

const CONVERSION_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function GoogleTag() {
  if (!CONVERSION_ID) return null;

  return (
    <>
      <Script
        id="gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${CONVERSION_ID}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${CONVERSION_ID}', {
            allow_enhanced_conversions: true
          });
        `}
      </Script>
    </>
  );
}

/* Fire a Google Ads conversion from the browser.

   label is the "send_to" suffix Google shows next to the conversion action.
   Missing config is a no-op rather than an error: the page must keep working
   for a visitor whether or not the campaign is live. */
export function trackConversion(
  label: string,
  params: { value?: number; currency?: string; transactionId?: string; email?: string } = {},
) {
  if (typeof window === "undefined" || !CONVERSION_ID || !label) return;
  if (typeof window.gtag !== "function") return;

  /* Enhanced conversions: Google hashes this in the browser before it leaves,
     and it lifts the match rate for clicks whose cookie has since expired. */
  if (params.email) {
    window.gtag("set", "user_data", { email: params.email });
  }

  window.gtag("event", "conversion", {
    send_to: `${CONVERSION_ID}/${label}`,
    value: params.value ?? 0,
    currency: params.currency ?? "USD",
    ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
  });
}

export const FORM_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_FORM ?? "";
export const CALENDLY_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_CALENDLY ?? "";

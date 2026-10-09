"use client";

import Script from "next/script";

/* The ChatGPT ads pixel (OpenAI Ads measurement), loaded only when a pixel id
   is configured, the same rule as the Google tag and the Meta pixel.

   This is the browser half. The enquiry's lead_created and the engaged
   visit's contents_viewed fire here with an event id the page minted, and the
   server sends its own copy of each with the same id, so OpenAI keeps one;
   see lib/openai-capi.ts. */

const PIXEL_ID = process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID ?? "";
const DEBUG = process.env.NEXT_PUBLIC_OPENAI_PIXEL_DEBUG === "true";

export const OPENAI_PIXEL_ENABLED = Boolean(PIXEL_ID);

declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void;
  }
}

/* OpenAI's snippet, split in two the way the Meta pixel is. The first half is
   the queue: oaiq exists from the start and holds init and anything measured
   before the SDK arrives. The second half is the SDK itself, which the stock
   snippet injects at once; here it waits until the page has finished and the
   browser is idle, then replays the queue as it would have. Every event is
   also sent by the server, so nothing depends on the SDK being early. */
export function OpenAIPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="openai-pixel" strategy="afterInteractive">
        {`!function(w){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q}(window);
oaiq("init",${JSON.stringify({ pixelId: PIXEL_ID, debug: DEBUG })});`}
      </Script>
      <Script
        id="openai-pixel-lib"
        strategy="lazyOnload"
        src="https://bzrcdn.openai.com/sdk/oaiq.min.js"
      />
    </>
  );
}

/* Fire an OpenAI event from the browser. eventId is shared with the server
   copy; without it the two would be counted twice.

   Missing config is a no-op rather than an error: the page must keep working
   for a visitor whether or not the campaign is live. */
export function openaiTrack(
  eventName: "lead_created" | "contents_viewed",
  data: Record<string, unknown>,
  eventId: string,
) {
  if (typeof window === "undefined" || !PIXEL_ID) return;
  const oaiq = window.oaiq;
  if (typeof oaiq !== "function") return;
  oaiq("measure", eventName, data, { event_id: eventId });
}

"use client";

import { useEffect } from "react";
import { CALENDLY_LABEL, trackConversion } from "../../components/GoogleTag";
import { META_PIXEL_ENABLED, metaTrack } from "../../components/MetaPixel";

/* Counts clicks on the Calendly booking links.

   Done with one delegated listener rather than by threading an onClick through
   every CTA: the Calendly link appears in the header, the hero, the symbol
   section, the apply block, the sticky mobile bar and the form success card,
   and all of those are server components today. Delegation keeps them that way
   and automatically covers any booking link added later.

   Booking a call is a separate conversion from sending the form. A visitor can
   do either, both, or neither, and collapsing them would hide which half of
   the page is actually working. */
export function CalendlyTracking() {
  useEffect(() => {
    if (!CALENDLY_LABEL && !META_PIXEL_ENABLED) return;

    /* Same visitor clicking twice is one intent, not two conversions. */
    let fired = false;

    function onClick(event: MouseEvent) {
      if (fired) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href") ?? "";
      if (!href.includes("calendly.com")) return;

      fired = true;
      trackConversion(CALENDLY_LABEL);
      /* Schedule is Meta's standard event for booking an appointment. Browser
         only, like the Google conversion: the click never reaches the server. */
      metaTrack("Schedule", { content_name: "Calendly call", content_category: "tepa" });
    }

    /* Capture phase so the conversion is recorded even if something downstream
       stops propagation, and the listener still runs before the new tab opens. */
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

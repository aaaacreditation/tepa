"use client";

import { useEffect } from "react";
import { getSource } from "@/lib/sources";
import { META_PIXEL_ENABLED, metaTrack } from "./MetaPixel";

/* Fires ViewContent once per visit when the visitor shows real interest:
   past half the page, or fifteen seconds without leaving, whichever comes
   first. Fired on load it would only be PageView under another name, and the
   retargeting audiences built on it would be full of two second bounces.

   Browser only. It carries the landing page as content_category so a custom
   conversion in Events Manager can count each page on its own. */
export function MetaViewContent({
  contentCategory,
  scrollDepth = 0.5,
  dwellMs = 15000,
}: {
  /* The source key from lib/sources.ts. */
  contentCategory: string;
  scrollDepth?: number;
  dwellMs?: number;
}) {
  useEffect(() => {
    if (!META_PIXEL_ENABLED) return;
    let fired = false;

    const fire = (trigger: "scroll" | "dwell") => {
      if (fired) return;
      fired = true;
      metaTrack("ViewContent", {
        content_name: getSource(contentCategory)?.name ?? contentCategory,
        content_category: contentCategory,
        trigger,
      });
      cleanup();
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= scrollDepth) fire("scroll");
    };

    const timer = window.setTimeout(() => fire("dwell"), dwellMs);
    window.addEventListener("scroll", onScroll, { passive: true });

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, [contentCategory, scrollDepth, dwellMs]);

  return null;
}

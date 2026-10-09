"use client";

import { useEffect } from "react";
import { getSource } from "@/lib/sources";
import { META_PIXEL_ENABLED, metaTrack, newMetaEventId } from "./MetaPixel";
import { OPENAI_PIXEL_ENABLED, openaiTrack } from "./OpenAIPixel";

/* Fires ViewContent once per visit when the visitor shows real interest:
   past half the page, or fifteen seconds without leaving, whichever comes
   first. Fired on load it would only be PageView under another name, and the
   retargeting audiences built on it would be full of two second bounces.

   Browser only for Meta. It carries the landing page as content_category so a
   custom conversion in Events Manager can count each page on its own.

   The same moment is ChatGPT ads' contents_viewed, so one definition of an
   engaged visit serves both. OpenAI's copy goes twice, from the pixel and from
   app/api/openai/view with the same event id, and is counted once. */
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
    if (!META_PIXEL_ENABLED && !OPENAI_PIXEL_ENABLED) return;
    let fired = false;

    const fire = (trigger: "scroll" | "dwell") => {
      if (fired) return;
      fired = true;
      const contentName = getSource(contentCategory)?.name ?? contentCategory;
      metaTrack("ViewContent", {
        content_name: contentName,
        content_category: contentCategory,
        trigger,
      });
      if (OPENAI_PIXEL_ENABLED) reportOpenAIView(contentCategory, contentName);
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

function reportOpenAIView(source: string, name: string) {
  const eventId = newMetaEventId();
  openaiTrack(
    "contents_viewed",
    { type: "contents", contents: [{ id: source, name, content_type: "page" }] },
    eventId,
  );

  /* keepalive lets the request finish if the visitor is already leaving. The
     ad's click reference is passed along from the URL for the case where the
     pixel has not yet stored it in its cookie. */
  const oppref = new URLSearchParams(window.location.search).get("oppref") ?? "";
  fetch("/api/openai/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, source, path: window.location.pathname, oppref }),
    keepalive: true,
  }).catch(() => {
    /* The pixel's copy still counts. */
  });
}

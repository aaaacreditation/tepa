"use client";

import { useEffect, useState } from "react";
import { site } from "../content";
import { IconCalendar } from "./Icons";

/** Persistent booking bar on small screens, revealed once the hero is behind us. */
export function MobileCta() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-navy-500/10 bg-white/92 px-4 py-3 backdrop-blur-lg transition-transform duration-400 sm:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-2.5">
        <a href="#enquire" className="btn btn-outline-navy flex-1 !px-4 !py-3 !text-sm">
          Enquire
        </a>
        <a
          href={site.calendly}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-gold flex-1 !px-4 !py-3 !text-sm"
        >
          <IconCalendar className="h-4 w-4" />
          Book a Call
        </a>
      </div>
    </div>
  );
}

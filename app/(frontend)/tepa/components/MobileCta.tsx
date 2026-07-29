"use client";

import { useEffect, useState } from "react";
import { site } from "../content";
import { IconCalendar } from "./Icons";

export function MobileCta() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mobile-cta" data-shown={shown}>
      <a href="#enquire" className="tepa-button tepa-button--navy">
        Check Eligibility
      </a>
      <a
        href={site.calendly}
        target="_blank"
        rel="noopener noreferrer"
        className="tepa-button tepa-button--gold"
      >
        <IconCalendar className="button-icon" />
        Book a Call
      </a>
    </div>
  );
}

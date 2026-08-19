"use client";

import { useEffect, useState } from "react";
import { site } from "../content";
import { IconArrow, IconWhatsApp } from "../icons";

/* The page carries the same consultation form twice, in the hero and at the
   end. The sticky bar sends the visitor to whichever one is closer so it never
   throws them back to the top of a page they have almost finished reading. */
const FORM_IDS = ["consultation", "closing-form"];

export function MobileCta() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const forms = FORM_IDS.map((id) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    /* Nothing to choose between, so let the href do the work. */
    if (forms.length < 2) return;

    const middle = window.innerHeight / 2;
    const nearest = forms.reduce((closest, form) =>
      Math.abs(form.getBoundingClientRect().top - middle) <
      Math.abs(closest.getBoundingClientRect().top - middle)
        ? form
        : closest,
    );

    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nearest.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  /* Two actions, not one: the form is the goal, but a visitor on a phone who
     would rather ask a question than fill in five fields should not have to
     hunt for a way to do it. WhatsApp moves into the bar here, and the
     floating bubble steps aside while the bar is up — three live calls to
     action stacked in one corner is clutter, not choice. */
  return (
    <div className="cl-mobile-cta" data-shown={shown}>
      <a
        className="cl-mobile-wa"
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with an advisor on WhatsApp"
      >
        <IconWhatsApp />
      </a>

      <a href="#consultation" onClick={onClick} className="cl-btn cl-btn--gold">
        Book a Free Consultation
        <IconArrow className="cl-ico" />
      </a>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

/* The page carries the same enquiry form twice, in the hero and at the end.
   The sticky bar sends the visitor to whichever one is closer so it never
   throws them back to the top of a page they have almost finished reading. */
const FORM_IDS = ["enquire", "apply-form"];

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

  return (
    <div className="mobile-cta" data-shown={shown}>
      <a href="#enquire" onClick={onClick} className="tepa-button tepa-button--navy">
        Check My Eligibility
      </a>
    </div>
  );
}

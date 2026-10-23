"use client";

import { useEffect } from "react";

/* The page carries the application form twice: in the hero (#enquire) and
   near the end (#apply). Every "apply" link on the page — masthead, section
   buttons, the readiness result, the mobile bar — goes to whichever of the
   two is closer, so it never throws a visitor back to the top of a page they
   have almost finished reading. Plain #apply / #enquire anchors still work
   without JavaScript. */

export const FORM_IDS = ["enquire", "apply"] as const;

export function forms(): HTMLElement[] {
  return FORM_IDS.map((id) => document.getElementById(id)).filter(
    (element): element is HTMLElement => element !== null,
  );
}

export function FormLinks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest?.('a[href="#apply"], a[href="#enquire"]');
      if (!link) return;
      const targets = forms();
      if (targets.length === 0) return;

      const middle = window.innerHeight / 2;
      const nearest = targets.reduce((closest, form) =>
        Math.abs(form.getBoundingClientRect().top - middle) <
        Math.abs(closest.getBoundingClientRect().top - middle)
          ? form
          : closest,
      );

      event.preventDefault();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      nearest.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}

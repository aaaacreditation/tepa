"use client";

import { useEffect, useState } from "react";
import { IconArrow } from "../icons";

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

  /* One action, spanning the bar. The page asks for exactly one thing, and
     the sections above now carry their own buttons to it, so the bar has no
     second job left to do. */
  return (
    <div className="cl-mobile-cta" data-shown={shown}>
      <a href="#consultation" onClick={onClick} className="cl-btn cl-btn--red">
        Book a Free Consultation
        <IconArrow className="cl-ico" />
      </a>
    </div>
  );
}

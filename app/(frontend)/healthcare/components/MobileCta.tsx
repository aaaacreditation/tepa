"use client";

import { useEffect, useState } from "react";

/* The page carries the same enquiry form twice, in the hero and at the end.
   The sticky bar sends the visitor to whichever one is closer so it never
   throws them back to the top of a page they have almost finished reading. */
const FORM_IDS = ["enquire", "apply-form"];

export function MobileCta() {
  const [shown, setShown] = useState(false);

  /* The bar also steps aside while either form is on screen. It sits over the
     bottom of the viewport, which is exactly where the next field is while
     someone is filling one in, and a button pointing at the form they are
     already in only covers it. Two rectangles per scroll event is cheaper
     than it sounds and, unlike an observer, never goes quiet. */
  useEffect(() => {
    const forms = FORM_IDS.map((id) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    const onScroll = () => {
      const scrolled = window.scrollY > window.innerHeight * 0.75;
      const formInView = forms.some((form) => {
        const box = form.getBoundingClientRect();
        return box.bottom > 0 && box.top < window.innerHeight;
      });
      setShown(scrolled && !formInView);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
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
    <div className="hc-mobile-cta" data-shown={shown} inert={!shown}>
      <a href="#enquire" onClick={onClick} className="hc-button hc-button--primary">
        Apply for Accreditation
      </a>
    </div>
  );
}

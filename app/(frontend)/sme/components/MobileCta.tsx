"use client";

import { useEffect, useState } from "react";
import { forms } from "./FormLinks";

/* A sticky bar on phones once the hero has scrolled away. It steps aside while
   either application form is on screen: it would sit over the next field and
   point at the form the visitor is already in. The click itself is routed to
   the nearer form by FormLinks. */
export function MobileCta() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const targets = forms();
    const onScroll = () => {
      const scrolled = window.scrollY > window.innerHeight * 0.75;
      const formInView = targets.some((form) => {
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

  return (
    <div className="sme-mobile-cta" data-shown={shown} inert={!shown}>
      <a href="#apply" className="smex-btn smex-btn-gold">
        Apply for Accreditation
      </a>
    </div>
  );
}

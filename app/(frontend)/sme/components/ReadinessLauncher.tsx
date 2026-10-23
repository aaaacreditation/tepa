"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconArrow } from "../../components/Icons";
import { readiness } from "../content";
import { ReadinessCheck } from "./ReadinessCheck";

/* Holds the readiness check closed until the visitor asks for it, then opens it
   inline in this section — the website's SME page behaviour, with the check
   rendered as a component rather than the website's iframe app (that app sent
   its leads to an outside inbox, past this site's lead pipeline).

   The "Check your readiness" links higher up the page are plain #readiness
   anchors, caught with a delegated click listener so they open it too. */
export function ReadinessLauncher() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Only ever opens on a click — never on load, even if the URL still carries
  // #readiness from an earlier visit.
  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest?.('a[href="#readiness"]');
      if (link) setOpen(true);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Delayed so this settles after the browser's own hash scrolling.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panelRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="smex-btn smex-btn-blue"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="smex-rc-panel"
      >
        {readiness.start} <IconArrow />
      </button>

      <figure className="smex-strip-preview">
        <Image
          src={readiness.preview}
          alt={readiness.previewAlt}
          width={1536}
          height={1024}
          sizes="(max-width: 860px) 60vw, 300px"
        />
      </figure>

      {open && (
        <div className="smex-rc-panel" id="smex-rc-panel" ref={panelRef}>
          <ReadinessCheck />
        </div>
      )}
    </>
  );
}

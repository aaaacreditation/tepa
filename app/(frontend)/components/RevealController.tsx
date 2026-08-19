"use client";

import { useEffect } from "react";

/**
 * Single observer for a whole landing page. Sections stay server rendered and
 * simply carry `className="reveal"`; this flips them to visible as they scroll
 * in.
 *
 * The hiding itself is opt-in from here rather than from the stylesheet: the
 * scope element only gains `data-reveal="on"` once this effect has run, so a
 * visitor whose JavaScript never arrives — blocked, errored, still loading —
 * reads a fully visible page instead of a blank one.
 *
 * `scope` is the selector for the element the page stylesheet is scoped to.
 */
export function RevealController({ scope = ".tepa" }: { scope?: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(scope);
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (targets.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.setAttribute("data-visible", "true"));
      return;
    }

    /* Anything already on screen is marked visible before hiding is switched
       on, so the first paint of the hero is never undone and re-animated. */
    const remaining: HTMLElement[] = [];
    for (const el of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.setAttribute("data-visible", "true");
      } else {
        remaining.push(el);
      }
    }

    root.setAttribute("data-reveal", "on");
    if (remaining.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    remaining.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [scope]);

  return null;
}

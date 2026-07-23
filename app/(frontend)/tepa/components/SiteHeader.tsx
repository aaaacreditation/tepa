"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { nav, site } from "../content";
import { IconCalendar, IconClose, IconMenu, IconPhone } from "./Icons";

export function SiteHeader() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      data-stuck={stuck}
      className="masthead fixed inset-x-0 top-0 z-50 border-b border-transparent"
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:py-5">
        <a href="#top" className="relative block shrink-0" aria-label={site.org}>
          <Image
            src="/tepa/aaa-logo-light.png"
            alt={site.org}
            width={595}
            height={200}
            priority
            className={`h-9 w-auto transition-opacity duration-300 lg:h-10 ${
              stuck ? "opacity-0" : "opacity-100"
            }`}
          />
          <Image
            src="/tepa/aaa-logo.png"
            alt=""
            width={595}
            height={200}
            aria-hidden="true"
            className={`absolute inset-0 h-9 w-auto transition-opacity duration-300 lg:h-10 ${
              stuck ? "opacity-100" : "opacity-0"
            }`}
          />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Section navigation">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link ${
                stuck ? "text-ink-700 hover:text-navy-500" : "text-white/75 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={site.phoneHref}
            className={`hidden items-center gap-2 text-sm font-medium transition-colors xl:flex ${
              stuck ? "text-ink-700 hover:text-navy-500" : "text-white/75 hover:text-white"
            }`}
          >
            <IconPhone className="h-4 w-4" />
            {site.phoneLabel}
          </a>

          <a
            href={site.calendly}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn hidden !px-5 !py-2.5 !text-[0.8125rem] sm:inline-flex ${
              stuck ? "btn-navy" : "btn-outline-light"
            }`}
          >
            <IconCalendar className="h-4 w-4" />
            Book a Call
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className={`grid h-10 w-10 place-items-center rounded-full border transition-colors lg:hidden ${
              stuck
                ? "border-navy-500/20 text-navy-500"
                : "border-white/25 text-white"
            }`}
          >
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        className={`overflow-hidden border-t border-navy-500/10 bg-white transition-[max-height,opacity] duration-400 lg:hidden ${
          open ? "max-h-[26rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-5 py-3 sm:px-8" aria-label="Mobile navigation">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-navy-500/8 py-3.5 text-[0.9375rem] font-medium text-ink-700 last:border-0"
            >
              {item.label}
            </a>
          ))}
          <a
            href={site.calendly}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="btn btn-navy mt-4 mb-4 w-full"
          >
            <IconCalendar className="h-4 w-4" />
            Book a Free Consultation
          </a>
        </nav>
      </div>
    </header>
  );
}

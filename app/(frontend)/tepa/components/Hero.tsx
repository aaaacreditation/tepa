import Image from "next/image";
import { hero, marquee, site } from "../content";
import { EnquiryForm } from "./EnquiryForm";
import { IconArrow, IconCalendar, IconCheck } from "./Icons";

export function Hero() {
  return (
    <section id="top" className="deep-field grain grid-veil relative isolate overflow-hidden">
      {/* Oversized seal watermark anchored behind the copy column */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-52 top-56 hidden h-[46rem] w-[46rem] opacity-[0.045] lg:block"
      >
        <Image src="/tepa/accreditation-seal.png" alt="" fill sizes="46rem" className="spin-slow object-contain" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 lg:pb-28 lg:pt-36">
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-12">
          {/* Copy */}
          <div className="lg:col-span-7 lg:pr-6">
            <div className="reveal flex items-center gap-3">
              <span className="h-px w-9 bg-gold-400/70" />
              <span className="eyebrow text-gold-300">{hero.eyebrow}</span>
            </div>

            <h1 className="reveal display mt-6 text-[2.6rem] text-white sm:text-[3.4rem] lg:text-[3.9rem]">
              <span className="block">{hero.titleLead}</span>
              <span className="gold-text block italic">{hero.titleAccent}</span>
              <span className="block">{hero.titleTail}</span>
            </h1>

            <p className="reveal lede mt-7 max-w-xl text-[1.0625rem] leading-relaxed text-navy-100/85">
              {hero.lede}
            </p>

            <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={site.calendly} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                <IconCalendar className="h-[1.05rem] w-[1.05rem]" />
                {hero.primaryCta}
              </a>
              <a href="#requirements" className="btn btn-outline-light">
                {hero.secondaryCta}
                <IconArrow className="h-[1.05rem] w-[1.05rem]" />
              </a>
            </div>

            {/* Proof numbers */}
            <dl className="reveal mt-12 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
              {hero.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#0d2743]/70 px-3.5 py-5 backdrop-blur-sm sm:px-5"
                >
                  <dt className="sr-only">{`${stat.label}: ${stat.value} ${stat.unit}`}</dt>
                  <dd>
                    <span className="display block whitespace-nowrap text-[1.4rem] leading-none text-gold-300 sm:text-[1.75rem]">
                      {stat.value}
                      <span className="ml-1 hidden text-[0.8125rem] font-medium tracking-wide text-navy-200/80 sm:inline">
                        {stat.unit}
                      </span>
                    </span>
                    <span className="mt-1 block text-[0.6875rem] font-medium tracking-wide text-navy-200/80 sm:hidden">
                      {stat.unit}
                    </span>
                    <span className="mt-2 block text-[0.625rem] leading-snug text-navy-200/70 sm:mt-1.5 sm:text-[0.6875rem]">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Enquiry card */}
          <div id="enquire" className="reveal lg:col-span-5">
            <EnquiryForm />
          </div>
        </div>
      </div>

      {/* What accreditation gives you */}
      <div className="relative border-t border-white/10 bg-[#071729]/45 backdrop-blur-sm">
        <ul className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-9 gap-y-3 px-5 py-5 sm:px-8">
          {marquee.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-[0.8125rem] text-navy-200/75">
              <IconCheck className="h-4 w-4 shrink-0 text-gold-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

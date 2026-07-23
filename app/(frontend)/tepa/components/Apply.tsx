import Image from "next/image";
import { apply, site } from "../content";
import { IconArrow, IconCalendar } from "./Icons";

export function Apply() {
  return (
    <section id="apply" className="relative bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Proof */}
          <div className="reveal frame-gold">
            <figure className="relative overflow-hidden rounded-2xl">
              <Image
                src="/tepa/certificate-handover.jpg"
                alt="An accredited provider receiving their framed AAA accreditation certificate"
                width={1080}
                height={1080}
                sizes="(max-width: 1024px) 90vw, 34rem"
                className="h-full w-full object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 via-navy-950/80 to-transparent p-6 pt-16 sm:p-8 sm:pt-20">
                <span className="eyebrow text-gold-300">{apply.captionTitle}</span>
                <span className="mt-2 block text-[0.9375rem] leading-snug text-white/85">
                  {apply.captionBody}
                </span>
              </figcaption>
            </figure>
          </div>

          {/* Call to action */}
          <div>
            <div className="reveal flex items-center gap-3">
              <span className="h-px w-9 bg-gold-400" />
              <span className="eyebrow text-gold-500">{apply.eyebrow}</span>
            </div>

            <h2 className="reveal display mt-6 text-[2.4rem] text-navy-800 sm:text-[3rem]">
              {apply.title}
            </h2>

            <p className="reveal lede mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-ink-500">
              {apply.body}
            </p>

            <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={site.quote} target="_blank" rel="noopener noreferrer" className="btn btn-navy">
                {apply.primaryCta}
                <IconArrow className="h-[1.05rem] w-[1.05rem]" />
              </a>
              <a
                href={site.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-navy"
              >
                <IconCalendar className="h-[1.05rem] w-[1.05rem]" />
                {apply.secondaryCta}
              </a>
            </div>

            <p className="reveal mt-8 text-sm text-ink-500">
              Prefer to write? Email{" "}
              <a
                href={`mailto:${site.email}`}
                className="font-medium text-navy-500 underline decoration-gold-400/50 underline-offset-4 transition-colors hover:text-navy-700"
              >
                {site.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

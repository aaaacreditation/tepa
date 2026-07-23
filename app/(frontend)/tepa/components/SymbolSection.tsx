import Image from "next/image";
import { site, symbol } from "../content";
import { IconArrow, IconCheck } from "./Icons";

export function SymbolSection() {
  return (
    <section id="symbol" className="deep-field grain relative isolate overflow-hidden py-24 lg:py-32">
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Seal */}
          <div className="reveal order-2 lg:order-1">
            <div className="seal-halo relative mx-auto grid aspect-square w-full max-w-[26rem] place-items-center">
              <div className="seal-ring absolute inset-[3%] animate-none" aria-hidden="true" />
              <div className="seal-ring absolute inset-[11%]" aria-hidden="true" />
              <Image
                src="/tepa/accreditation-seal.png"
                alt="Accredited Training and Education Provider seal from the American Accreditation Association"
                width={720}
                height={720}
                sizes="(max-width: 1024px) 70vw, 26rem"
                className="seal-float relative w-[74%]"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <div className="reveal flex items-center gap-3">
              <span className="h-px w-9 bg-gold-400/70" />
              <span className="eyebrow text-gold-300">{symbol.eyebrow}</span>
            </div>

            <h2 className="reveal display mt-6 text-[2.1rem] text-white sm:text-[2.6rem]">
              {symbol.title}
            </h2>

            <p className="reveal lede mt-6 text-[1.0625rem] leading-relaxed text-navy-100/80">
              {symbol.body}
            </p>

            <ul className="reveal mt-8 space-y-3.5">
              {symbol.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-navy-100/85">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-400/25 text-gold-200 ring-1 ring-gold-400/50">
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <div className="reveal mt-10">
              <a href={site.calendly} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                {symbol.cta}
                <IconArrow className="h-[1.05rem] w-[1.05rem]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

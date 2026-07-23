import { pillars } from "../content";
import { IconQuality, IconSatisfaction, IconValue, Ornament } from "./Icons";

const icons = {
  value: IconValue,
  satisfaction: IconSatisfaction,
  quality: IconQuality,
};

export function Pillars() {
  return (
    <section id="benefits" className="bg-bone-300 py-24 lg:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="eyebrow text-gold-500">What Accreditation Delivers</span>
          <h2 className="display mt-4 text-[2.1rem] text-navy-800 sm:text-[2.6rem]">
            Three commitments behind every AAA seal
          </h2>
          <Ornament className="mx-auto mt-6 h-4 w-52 text-gold-400" />
        </div>

        <div className="mt-14 grid gap-6 lg:mt-16 lg:grid-cols-3">
          {pillars.map((pillar, i) => {
            const Icon = icons[pillar.icon];
            return (
              <article
                key={pillar.title}
                className="pillar reveal relative flex flex-col overflow-hidden rounded-2xl border border-navy-500/10 bg-white p-8 lg:p-9"
                style={{ transitionDelay: `${i * 110}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy-50 text-navy-500 ring-1 ring-navy-500/10">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="display text-[2.75rem] leading-none text-navy-500/10">
                    {pillar.index}
                  </span>
                </div>

                <h3 className="display mt-7 text-[1.6rem] text-navy-800">{pillar.title}</h3>
                <span className="mt-4 block h-px w-12 bg-gold-400/60" />

                <ul className="mt-5 space-y-4">
                  {pillar.points.map((point) => (
                    <li
                      key={point}
                      className="lede text-[0.9375rem] leading-relaxed text-ink-500"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

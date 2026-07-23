import { requirements } from "../content";
import { Ornament } from "./Icons";

export function Requirements() {
  return (
    <section id="requirements" className="relative bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="eyebrow text-gold-500">{requirements.eyebrow}</span>
          <h2 className="display mt-4 text-[2.1rem] text-navy-800 sm:text-[2.6rem]">
            {requirements.title}
          </h2>
          <Ornament className="mx-auto mt-6 h-4 w-52 text-gold-400" />
          <p className="lede mt-6 text-[1.0625rem] leading-relaxed text-ink-500">
            {requirements.lede}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
          {requirements.groups.map((group, gi) => (
            <div
              key={group.key}
              className="reveal relative rounded-2xl border border-navy-500/10 bg-bone-200 p-8 lg:p-10"
              style={{ transitionDelay: `${gi * 120}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gold-400" />
                <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-navy-500">
                  {group.label}
                </h3>
              </div>

              <ol className="mt-8 space-y-7">
                {group.items.map((item, i) => (
                  <li key={item} className="flex gap-5">
                    <span
                      className="display shrink-0 text-[1.75rem] leading-none text-gold-400/85"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="lede border-l border-navy-500/10 pl-5 text-[0.9375rem] leading-relaxed text-ink-700">
                      {item}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

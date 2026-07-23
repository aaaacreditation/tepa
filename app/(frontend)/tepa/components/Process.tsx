import { process, site } from "../content";
import { IconArrow } from "./Icons";

export function Process() {
  return (
    <section
      id="process"
      className="deep-field-flat grain relative isolate overflow-hidden py-24 lg:py-32"
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="reveal max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-9 bg-gold-400/70" />
            <span className="eyebrow text-gold-300">{process.eyebrow}</span>
          </div>
          <h2 className="display mt-6 text-[2.1rem] text-white sm:text-[2.6rem]">{process.title}</h2>
          <p className="lede mt-5 text-[1.0625rem] leading-relaxed text-navy-100/80">
            {process.lede}
          </p>
        </div>

        <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8">
          {process.stages.map((stage, i) => (
            <li
              key={stage.n}
              className="stage-item reveal relative"
              style={{ transitionDelay: `${i * 110}ms` }}
            >
              <div className="stage-node">{stage.n}</div>
              <h3 className="mt-6 text-[1.0625rem] font-semibold tracking-tight text-white">
                {stage.title}
              </h3>
              <p className="lede mt-3 text-[0.9375rem] leading-relaxed text-navy-200/75">
                {stage.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="reveal mt-16 flex flex-col items-start gap-5 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] text-navy-100/75">
            Most providers move from application to certificate inside two months.
          </p>
          <a href="#enquire" className="btn btn-outline-light shrink-0">
            Start Your Application
            <IconArrow className="h-[1.05rem] w-[1.05rem]" />
          </a>
        </div>
      </div>

      <span className="sr-only">
        Questions about a stage? Call {site.phoneLabel} or email {site.email}.
      </span>
    </section>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { ICONS, IconArrow, IconCheck, IconHelp } from "./icons";
import { ConsultationForm } from "./components/ConsultationForm";
import { MobileCta } from "./components/MobileCta";
import { SiteFooter } from "./components/SiteFooter";
import { SectionCta } from "./components/SectionCta";
import { SiteHeader } from "./components/SiteHeader";
import { StoryVideo } from "./components/StoryVideo";
import { TeamGrid } from "./components/TeamGrid";
import {
  benefits,
  closingForm,
  finalCta,
  fit,
  hero,
  organizations,
  process,
  sectionCtas,
  site,
  standards,
  story,
  team,
} from "./content";

const title = "Clinic Accreditation";
const description =
  "AAA accreditation helps clinics demonstrate their commitment to quality, patient safety, professional practice, and continuous improvement. Book a free consultation with an AAA advisor.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/clinic" },
  openGraph: {
    title: `${title} | ${site.org}`,
    description,
    type: "website",
    siteName: site.org,
    images: [
      {
        url: hero.photo,
        width: 2048,
        height: 1208,
        alt: hero.photoAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${site.org}`,
    description,
    images: [hero.photo],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: site.org,
      url: site.website,
      logo: "/healthcare/aaa-logo.png",
      email: site.email,
      telephone: site.phoneLabel,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address[0],
        addressLocality: "Tysons Corner",
        addressRegion: "VA",
        postalCode: "22182",
        addressCountry: "US",
      },
    },
    {
      "@type": "Service",
      name: "Clinic Accreditation",
      serviceType: "Medical, dental, aesthetic and specialty clinic accreditation",
      provider: { "@type": "Organization", name: site.org },
      description,
      areaServed: "Worldwide",
      audience: {
        "@type": "Audience",
        audienceType: fit.suitable.items.join(", "),
      },
    },
    {
      "@type": "HowTo",
      name: process.title,
      description: process.lede,
      step: process.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.body,
      })),
    },
  ],
};

export default function ClinicLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader />

      <main>
        {/* ================================================================
            Hero — the clinic photograph is the ground the whole section is
            built on rather than a framed picture sitting inside it. Headline
            and proof down the left, the consultation form standing beside
            them as an ordinary vertical card. The form is the whole point of
            the page, so it sits above the fold on a laptop rather than
            waiting for a scroll.

            The children are placed on the grid explicitly at desktop widths,
            which leaves the DOM free to carry the phone order instead:
            headline, form, proof. On a phone the form is the second thing a
            visitor meets rather than the last.
            ================================================================ */}
        <section id="top" className="cl-hero">
          {/* Decorative: the photograph is atmosphere here, not information,
              so it carries no alt text. The clinic in it is credited by name
              in the story section further down the page. */}
          <div className="cl-hero-bg" aria-hidden="true">
            <Image src={hero.photo} alt="" fill preload sizes="100vw" />
          </div>
          <div className="cl-hero-veil" aria-hidden="true" />
          <div className="cl-hero-grid-bg" aria-hidden="true" />
          <div className="cl-hero-aura" aria-hidden="true" />

          <div className="cl-wrap cl-hero-grid">
            <div className="cl-hero-copy">
              <p className="cl-eyebrow cl-eyebrow--gold">{hero.eyebrow}</p>
              <h1>
                {hero.titleLead}{" "}
                <span className="cl-underline">{hero.titleAccent}</span>
              </h1>
              <p className="cl-hero-lede">{hero.lede}</p>
            </div>

            <div id="consultation" className="cl-hero-form">
              <ConsultationForm />
            </div>

            <ul className="cl-proof" aria-label="Accreditation trust indicators">
              {hero.proof.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <li className="cl-proof-card" key={item.label}>
                    <span className="cl-proof-ico">
                      <Icon />
                    </span>
                    <p>
                      <b>{item.value}</b>
                      <small>{item.label}</small>
                    </p>
                  </li>
                );
              })}

              <li className="cl-proof-card cl-proof-card--isqua">
                <Image
                  src="/healthcare/isqua-eea.jpg"
                  alt="ISQua External Evaluation Association"
                  width={800}
                  height={221}
                />
                <small>{hero.isquaNote}</small>
              </li>
            </ul>
          </div>
        </section>

        {/* ================================================================
            Why accreditation matters — three benefit cards over a strip of
            the three things a clinic actually walks away holding.
            ================================================================ */}
        <section id="benefits" className="cl-section cl-section--mist">
          <div className="cl-wrap">
            <header className="cl-heading cl-heading--center reveal">
              <p className="cl-eyebrow">{benefits.eyebrow}</p>
              <h2>{benefits.title}</h2>
              <p className="cl-lede">{benefits.lede}</p>
            </header>

            <ul className="cl-benefit-grid">
              {benefits.items.map((item, index) => {
                const Icon = ICONS[item.icon];
                return (
                  <li
                    className="cl-benefit reveal"
                    key={item.title}
                    style={{ transitionDelay: `${index * 90}ms` }}
                  >
                    <span className="cl-tile">
                      <Icon />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </li>
                );
              })}
            </ul>

            <div className="cl-outcomes reveal">
              <div className="cl-outcomes-head">
                <p className="cl-eyebrow">{benefits.outcomesEyebrow}</p>
                <h3>{benefits.outcomesTitle}</h3>
              </div>

              <ol className="cl-outcome-list">
                {benefits.outcomes.map((outcome, index) => (
                  <li key={outcome.title}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h4>{outcome.title}</h4>
                      <p>{outcome.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <p className="cl-pullquote reveal">{benefits.note}</p>

            <SectionCta {...sectionCtas.benefits} />
          </div>
        </section>

        {/* ================================================================
            What we evaluate — the five standards, with the navy intro panel
            carrying the reassurance that this is not an audit to fail.
            ================================================================ */}
        <section id="standards" className="cl-section cl-section--white">
          <div className="cl-wrap cl-standards-grid">
            <div className="cl-standards-intro reveal">
              <p className="cl-eyebrow cl-eyebrow--gold">{standards.eyebrow}</p>
              <h2>{standards.title}</h2>
              <p className="cl-standards-lede">{standards.lede}</p>
              <p className="cl-standards-note">{standards.reassurance}</p>
            </div>

            <ol className="cl-standards-list">
              {standards.areas.map((area, index) => {
                const Icon = ICONS[area.icon];
                return (
                  <li
                    className="cl-standard reveal"
                    key={area.title}
                    style={{ transitionDelay: `${(index % 2) * 80}ms` }}
                  >
                    <span className="cl-standard-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="cl-tile cl-tile--sm">
                      <Icon />
                    </span>
                    <h3>{area.title}</h3>
                    <p>{area.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Outside the two-column grid: as a third child it would land under
              the sticky intro panel rather than across the section. */}
          <div className="cl-wrap">
            <SectionCta {...sectionCtas.standards} />
          </div>
        </section>

        {/* ================================================================
            The four-step path, with the award photograph and the two dates a
            clinic needs to plan around.
            ================================================================ */}
        <section id="process" className="cl-section cl-section--paper">
          <div className="cl-wrap">
            <header className="cl-heading cl-heading--split reveal">
              <div>
                <p className="cl-eyebrow">{process.eyebrow}</p>
                <h2>{process.title}</h2>
              </div>
              <p className="cl-lede">{process.lede}</p>
            </header>

            <div className="cl-process-layout">
              <ol className="cl-steps">
                {process.steps.map((step, index) => (
                  <li
                    className={`cl-step reveal${index === process.steps.length - 1 ? " is-final" : ""}`}
                    key={step.title}
                    style={{ transitionDelay: `${index * 70}ms` }}
                  >
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <figure className="cl-process-photo reveal">
                <Image
                  src={process.photo}
                  alt={process.photoAlt}
                  fill
                  sizes="(max-width: 1050px) 100vw, 40vw"
                />
                <figcaption>{process.caption}</figcaption>
                <ul className="cl-cycle" aria-label="Accreditation cycle">
                  {process.badges.map((badge) => (
                    <li key={badge.value}>
                      <b>{badge.value}</b>
                      {badge.label}
                    </li>
                  ))}
                </ul>
              </figure>
            </div>

            <SectionCta {...sectionCtas.process} />
          </div>
        </section>

        {/* ================================================================
            Is this right for your clinic — the qualification section, and the
            one place the page names the objection out loud.
            ================================================================ */}
        <section id="fit" className="cl-section cl-section--white">
          <div className="cl-wrap">
            <header className="cl-heading cl-heading--center reveal">
              <p className="cl-eyebrow">{fit.eyebrow}</p>
              <h2>{fit.title}</h2>
              <p className="cl-lede">{fit.lede}</p>
            </header>

            <div className="cl-fit-grid">
              <article className="cl-fit reveal">
                <p className="cl-fit-label">{fit.suitable.label}</p>
                <h3>{fit.suitable.title}</h3>
                <ul>
                  {fit.suitable.items.map((item) => (
                    <li key={item}>
                      <IconCheck />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="cl-fit cl-fit--navy reveal">
                <p className="cl-fit-label">{fit.readiness.label}</p>
                <h3>{fit.readiness.title}</h3>
                <ul>
                  {fit.readiness.items.map((item) => (
                    <li key={item}>
                      <IconCheck />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <aside className="cl-reassure reveal">
              <span aria-hidden="true">
                <IconHelp />
              </span>
              <div>
                <h3>{fit.reassuranceTitle}</h3>
                <p>{fit.reassuranceBody}</p>
              </div>
              <a className="cl-btn cl-btn--red" href="#closing-form">
                Ask an advisor
                <IconArrow className="cl-ico" />
              </a>
            </aside>
          </div>
        </section>

        {/* ================================================================
            Social proof: one accredited clinic tells it, and the logos of the
            others sit under it.
            ================================================================ */}
        <section id="story" className="cl-section cl-section--navy">
          <div className="cl-wrap cl-story-grid">
            <div className="cl-story-video reveal">
              <StoryVideo />
            </div>

            <div className="cl-story-copy reveal">
              <p className="cl-eyebrow cl-eyebrow--gold">{story.eyebrow}</p>
              <h2>{story.title}</h2>
              <p className="cl-story-lede">{story.lede}</p>

              <div className="cl-story-id">
                <span aria-hidden="true">{story.monogram}</span>
                <p>
                  <strong>{story.organization}</strong>
                  <small>{story.location}</small>
                </p>
              </div>

              <ul className="cl-story-points">
                {story.points.map((point) => (
                  <li key={point}>
                    <IconCheck />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="cl-wrap cl-orgs reveal">
            <p className="cl-orgs-label">{organizations.label}</p>
            <ul>
              {organizations.items.map((item) => (
                <li key={item.name}>
                  <Image
                    src={item.logo}
                    alt=""
                    width={108}
                    height={108}
                    sizes="56px"
                  />
                  <p>
                    <b>{item.name}</b>
                    <small>{item.location}</small>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="cl-wrap">
            <SectionCta {...sectionCtas.story} />
          </div>
        </section>

        {/* ================================================================
            The people a visitor would actually be dealing with. Faces do more
            for a consultation booking than another list of benefits.
            ================================================================ */}
        <section id="team" className="cl-section cl-section--mist">
          <div className="cl-wrap">
            <header className="cl-heading cl-heading--center reveal">
              <p className="cl-eyebrow">{team.eyebrow}</p>
              <h2>{team.title}</h2>
              <p className="cl-lede">{team.lede}</p>
            </header>

            <TeamGrid />

            <SectionCta {...sectionCtas.team} />
          </div>
        </section>

        {/* ================================================================
            Closing CTA. The form is repeated here rather than a button back to
            the hero, so a visitor who read the whole page never has to scroll
            back up to act on it.
            ================================================================ */}
        <section id="apply" className="cl-final">
          <div className="cl-hero-grid-bg" aria-hidden="true" />
          <div className="cl-wrap cl-final-grid">
            <div className="cl-final-copy">
              <p className="cl-eyebrow cl-eyebrow--gold reveal">{finalCta.eyebrow}</p>
              <h2 className="reveal">{finalCta.title}</h2>
              <p className="cl-final-lede reveal">{finalCta.body}</p>

              <ul className="cl-final-points reveal">
                <li>
                  <IconCheck />
                  <span>Understand which standards apply to your clinic</span>
                </li>
                <li>
                  <IconCheck />
                  <span>See what the survey involves before you commit</span>
                </li>
                <li>
                  <IconCheck />
                  <span>Get a realistic timeline for your scope of services</span>
                </li>
              </ul>

              <p className="cl-final-contact reveal">
                Prefer to talk now? Call <a href={site.phoneHref}>{site.phoneLabel}</a> or
                email <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>
              <p className="cl-final-note reveal">{finalCta.note}</p>
            </div>

            <div id="closing-form" className="cl-final-form reveal">
              <ConsultationForm
                badge={closingForm.badge}
                title={closingForm.title}
                layout="stack"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileCta />
    </>
  );
}

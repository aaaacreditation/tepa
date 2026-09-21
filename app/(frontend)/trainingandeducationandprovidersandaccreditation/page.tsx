import type { Metadata } from "next";
import Image from "next/image";
import { IconArrow, IconCalendar, IconCheck, IconPhone } from "../tepa/components/Icons";
import { MobileCta } from "../tepa/components/MobileCta";
import { SiteFooter } from "../tepa/components/SiteFooter";
import { SiteHeader } from "../tepa/components/SiteHeader";
import { BookingForm } from "./components/BookingForm";
import { TestimonialCarousel } from "./components/TestimonialCarousel";
import { VideoFacade } from "./components/VideoFacade";
import {
  bonuses,
  booking,
  faq,
  finalCta,
  fit,
  guarantee,
  hero,
  intake,
  journey,
  nav,
  offer,
  outcomes,
  pain,
  pending,
  practice,
  pricing,
  proof,
  site,
} from "./content";

const title = "Accredited Educational Provider Fast Track";
const description =
  "Win the clients who only buy from accredited educational and training providers. Apply for AAA accreditation and an experienced assessor confirms your scope, your timeline and your quote.";

/* A test page: kept out of search so it never competes with /tepa, and
   reached only by the links and campaigns that are pointed at it. */
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/trainingandeducationandprovidersandaccreditation" },
  openGraph: {
    title: `${title} | ${site.org}`,
    description,
    type: "website",
    siteName: site.org,
    images: [{ url: "/tepa/hero-background-v2.png", width: 1319, height: 1086 }],
  },
  robots: { index: false, follow: false },
};

type BonusKey = (typeof bonuses.items)[number]["key"];

export default function FastTrackPage() {
  const faqItems = [
    ...faq.items,
    ...(pending.remoteAssessmentAnswer
      ? [{ q: "Is the assessment done remotely?", a: pending.remoteAssessmentAnswer }]
      : []),
    ...(pending.renewalAnswer
      ? [{ q: "What happens after three years?", a: pending.renewalAnswer }]
      : []),
  ];

  return (
    <>
      <SiteHeader />

      <main>
        <section id="top" className="tepa-hero">
          <div className="hero-background" aria-hidden="true">
            <Image
              src="/tepa/hero-background-v2.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="hero-background-image"
            />
          </div>
          <div className="site-shell hero-grid">
            <div className="hero-copy">
              <p className="section-kicker section-kicker--gold">{hero.eyebrow}</p>
              <h1 className="hero-title">{hero.title}</h1>
              <p className="hero-lede">{hero.lede}</p>

              <p className="ft-reassure">
                <IconCalendar className="ft-reassure-icon" />
                <span>
                  <strong className="ft-reassure-lead">{hero.reassurance}</strong>
                  {hero.reassuranceDetail}
                </span>
              </p>

              <div className="hero-actions">
                <a href="#offer" className="text-link text-link--gold">
                  {hero.secondaryCta}
                  <IconArrow className="link-icon" />
                </a>
              </div>

              <dl className="hero-stats">
                {hero.stats.map((stat) => (
                  <div className="hero-stat" key={stat.label}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </dl>
            </div>

            <div id="enquire" className="hero-form">
              <BookingForm />
            </div>
          </div>
        </section>

        <section id="who-its-for" className="section section--white ft-fit">
          <div className="section-geometry section-geometry--right" aria-hidden="true" />
          <div className="site-shell">
            <header className="section-heading section-heading--center">
              <p className="section-kicker">{fit.eyebrow}</p>
              <h2 className="section-title">{fit.title}</h2>
            </header>

            <ul className="ft-fit-grid">
              {fit.items.map((item) => (
                <li className="ft-fit-card" key={item.title}>
                  <span className="ft-fit-check" aria-hidden="true">
                    <IconCheck />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>

            <ul className="ft-redirects">
              {fit.redirects.map((item) => (
                <li className="ft-redirect" key={item.title}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-link text-link--navy">
                    {item.cta}
                    <IconArrow className="link-icon" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="cost" className="section section--ivory benefits-section">
          <div className="section-geometry section-geometry--right" aria-hidden="true" />
          <div className="site-shell benefits-grid">
            <div className="benefits-intro">
              <p className="section-kicker">{pain.eyebrow}</p>
              <h2 className="section-title ft-title-md">{pain.title}</h2>
              <p className="section-lede">{pain.lede}</p>
              <figure className="benefits-photo ft-pain-photo">
                <Image
                  src="/tepa/practice-meridian.jpeg"
                  alt="A training provider team with its AAA accreditation certificate"
                  fill
                  sizes="(max-width: 900px) 100vw, 43vw"
                  className="cover-image"
                />
                <figcaption>{pain.photoCaption}</figcaption>
              </figure>
            </div>

            <ol className="benefit-list">
              {pain.items.map((item, index) => (
                <li className="benefit-card" key={item.title}>
                  <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="after" className="section section--navy ft-outcomes">
          <div className="dark-geometry" aria-hidden="true" />
          <div className="site-shell ft-outcomes-grid">
            <div className="ft-outcomes-intro">
              <p className="section-kicker section-kicker--gold">{outcomes.eyebrow}</p>
              <h2 className="section-title section-title--light ft-title-md">{outcomes.title}</h2>
              <figure className="ft-outcomes-photo">
                <Image
                  src="/tepa/hero-accreditation.jpeg"
                  alt="A training provider's leadership holding their framed AAA accreditation certificate"
                  fill
                  sizes="(max-width: 900px) 100vw, 40vw"
                  className="cover-image"
                />
              </figure>
            </div>

            <ul className="ft-outcome-list">
              {outcomes.items.map((item) => (
                <li key={item.lead}>
                  <span className="ft-outcome-tick" aria-hidden="true">
                    <IconCheck />
                  </span>
                  <p>
                    <strong>{item.lead}</strong> {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="offer" className="section section--paper ft-offer">
          <div className="section-geometry section-geometry--left" aria-hidden="true" />
          <div className="site-shell">
            <header className="section-heading section-heading--center">
              <p className="section-kicker">{offer.eyebrow}</p>
              <h2 className="section-title">{offer.title}</h2>
              <p className="section-lede">{offer.lede}</p>
            </header>

            <div className="ft-offer-card">
              <ul className="ft-stack">
                {offer.items.map((item) => (
                  <li key={item.title}>
                    <span className="ft-stack-tick" aria-hidden="true">
                      <IconCheck />
                    </span>
                    <p>
                      <strong>{item.title}</strong> {item.body}
                    </p>
                  </li>
                ))}
                {pending.namedAssessor ? (
                  <li>
                    <span className="ft-stack-tick" aria-hidden="true">
                      <IconCheck />
                    </span>
                    <p>
                      <strong>{pending.namedAssessor}</strong>
                    </p>
                  </li>
                ) : null}
              </ul>

              <aside className="ft-offer-panel">
                <Image
                  src="/tepa/accreditation-seal.png"
                  alt=""
                  width={720}
                  height={720}
                  className="ft-offer-seal"
                />
                <p className="section-kicker section-kicker--gold">{offer.panelKicker}</p>
                <h3>{offer.panelTitle}</h3>
                <p>{offer.panelBody}</p>
                <a href="#apply-form" className="tepa-button tepa-button--gold">
                  {offer.cta}
                  <IconArrow className="button-icon" />
                </a>
              </aside>
            </div>

            <div className="ft-bonuses">
              <header className="ft-bonuses-head">
                <p className="section-kicker">
                  {pending.bonusDeadline
                    ? `Included when you book by ${pending.bonusDeadline}`
                    : "Included with your Fast Track"}
                </p>
                <h3>{bonuses.title}</h3>
              </header>
              <ol className="ft-bonus-grid">
                {bonuses.items.map((item, index) => {
                  const value = pending.bonusValues?.[item.key as BonusKey];
                  return (
                    <li className="ft-bonus" key={item.key}>
                      <span className="glance-badge">Bonus {String(index + 1).padStart(2, "0")}</span>
                      <h4>{item.title}</h4>
                      <p>{item.body}</p>
                      {value ? <p className="ft-bonus-value">Value {value}</p> : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        <section id="journey" className="section section--navy journey-section">
          <div className="dark-geometry" aria-hidden="true" />
          <div className="site-shell">
            <header className="section-heading section-heading--center">
              <p className="section-kicker section-kicker--gold">{journey.eyebrow}</p>
              <h2 className="section-title section-title--light">{journey.title}</h2>
            </header>

            <ol className="journey-grid ft-journey-grid">
              {journey.stages.map((stage, index) => {
                const final = index === journey.stages.length - 1;
                return (
                  <li className={`journey-card ${final ? "journey-card--final" : ""}`} key={stage.title}>
                    <span className="journey-number">{String(index + 1).padStart(2, "0")}</span>
                    {final ? (
                      <Image
                        src="/tepa/accreditation-seal.png"
                        alt=""
                        width={720}
                        height={720}
                        className="journey-seal"
                      />
                    ) : (
                      <span className="journey-mark ft-journey-mark" aria-hidden="true">
                        {stage.label}
                      </span>
                    )}
                    <h3>{stage.title}</h3>
                    <p>{stage.body}</p>
                  </li>
                );
              })}
            </ol>

            <div className="journey-action">
              <span>{journey.footnote}</span>
              <a href="#apply-form" className="tepa-button tepa-button--outline-light">
                {journey.cta}
                <IconArrow className="button-icon" />
              </a>
            </div>
          </div>
        </section>

        <section id="proof" className="section section--white ft-proof">
          <div className="section-geometry section-geometry--right" aria-hidden="true" />
          <div className="site-shell">
            <header className="section-heading section-heading--center">
              <p className="section-kicker">{proof.eyebrow}</p>
              <h2 className="section-title">{proof.title}</h2>
            </header>

            <TestimonialCarousel
              stories={practice.stories}
              kicker={proof.storiesKicker}
              title={proof.storiesTitle}
            />

            <div className="ft-proof-grid">
              <VideoFacade videoId={site.videoId} title={site.videoTitle} label={proof.videoLabel} />
              <div className="ft-proof-card">
                <p className="ft-proof-lead">{proof.videoBody}</p>
                <p>{proof.directoryBody}</p>
                <a
                  href={site.directory}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tepa-button tepa-button--outline-navy"
                >
                  {proof.directoryCta}
                  <IconArrow className="button-icon" />
                </a>
                <p className="ft-proof-address">{proof.addressLine}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="guarantee" className="section section--ivory ft-terms">
          <div className="section-geometry section-geometry--left" aria-hidden="true" />
          <div className="site-shell">
            <div className="ft-guarantee">
              <Image
                src="/tepa/accreditation-seal.png"
                alt=""
                width={720}
                height={720}
                className="ft-guarantee-seal"
              />
              <div>
                <p className="section-kicker">{guarantee.eyebrow}</p>
                <h2 className="section-title ft-title-md">{guarantee.title}</h2>
                <p className="ft-guarantee-body">{guarantee.body}</p>
                <p className="ft-guarantee-note">{guarantee.note}</p>
              </div>
            </div>

            <div className="ft-terms-grid">
              <article className="ft-term">
                <p className="section-kicker">{pricing.eyebrow}</p>
                <h3>{pricing.title}</h3>
                {pricing.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
              <article className="ft-term ft-term--gold">
                <p className="section-kicker">{intake.eyebrow}</p>
                <h3>
                  {pending.placesLeft !== null
                    ? `${pending.placesLeft} places left this month`
                    : intake.title}
                </h3>
                {intake.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <a href="#apply-form" className="text-link text-link--navy">
                  {intake.cta}
                  <IconArrow className="link-icon" />
                </a>
              </article>
            </div>
          </div>
        </section>

        <section id="questions" className="section section--white ft-faq">
          <div className="site-shell ft-faq-grid">
            <header>
              <p className="section-kicker">{faq.eyebrow}</p>
              <h2 className="section-title ft-title-md">{faq.title}</h2>
              <p className="section-lede">
                Anything else? Call{" "}
                <a href={site.phoneHref}>{site.phoneLabel}</a> or email{" "}
                <a href={`mailto:${site.email}`}>{site.email}</a>.
              </p>
            </header>
            <div className="ft-faq-list">
              {faqItems.map((item, index) => (
                <details key={item.q} open={index === 0}>
                  <summary>
                    <span>{item.q}</span>
                    <span className="ft-faq-icon" aria-hidden="true" />
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="book" className="section section--navy ft-final">
          <div className="dark-geometry" aria-hidden="true" />
          <div className="site-shell apply-grid">
            <div className="apply-copy">
              <p className="section-kicker section-kicker--gold">{finalCta.eyebrow}</p>
              <h2 className="section-title section-title--light">{finalCta.title}</h2>
              <p className="section-lede section-lede--light">{finalCta.body}</p>
              <p className="ft-final-contact">
                <IconPhone className="ft-reassure-icon" />
                <span>
                  Prefer to talk now? Call <a href={site.phoneHref}>{site.phoneLabel}</a>
                  {pending.whatsapp ? (
                    <>
                      {" "}or message us on WhatsApp{" "}
                      <a href={`https://wa.me/${pending.whatsapp.replace(/\D/g, "")}`}>
                        {pending.whatsapp}
                      </a>
                    </>
                  ) : null}
                  .
                </span>
              </p>

              <figure className="apply-photo">
                <Image
                  src="/tepa/certificate-handover.jpg"
                  alt="An accredited provider holding its framed AAA accreditation certificate in front of a world map"
                  fill
                  sizes="(max-width: 900px) 100vw, 48vw"
                  className="cover-image"
                />
                <figcaption>
                  <span>{finalCta.captionTitle}</span>
                  {finalCta.captionBody}
                </figcaption>
              </figure>
            </div>

            <div id="apply-form" className="apply-form">
              <BookingForm title={booking.closingTitle} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter links={nav} cta={{ label: "Apply for accreditation", href: "#enquire" }} />
      <MobileCta label="Apply for accreditation" />
    </>
  );
}

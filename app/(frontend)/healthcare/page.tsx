import type { Metadata } from "next";
import Image from "next/image";
import { ClinicForm } from "./components/ClinicForm";
import { GalleryMarquee } from "./components/GalleryMarquee";
import { HeroWaves } from "./components/HeroWaves";
import { ICONS, IconArrow, IconCheck, IconCheckCircle, IconMinus } from "../components/Icons";
import { MobileCta } from "./components/MobileCta";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { StoryVideo } from "./components/StoryVideo";
import { TeamGrid } from "./components/TeamGrid";
import {
  apply,
  clinicSizes,
  faq,
  fees,
  fit,
  gallery,
  hero,
  opportunity,
  organizations,
  process,
  site,
  standards,
  story,
  team,
} from "./content";

const title = "Clinic & Healthcare Accreditation";
const description =
  "Independent accreditation for medical, dental, aesthetic and specialist clinics and hospitals. Standards assessed by ISQua EEA, active in 53+ countries. Fees from USD 4,000 by size.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/healthcare" },
  openGraph: {
    title: `${title} | ${site.org}`,
    description,
    type: "website",
    siteName: site.org,
    images: [
      {
        url: hero.photo,
        width: 1400,
        height: 933,
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
      name: title,
      serviceType: "Healthcare facility accreditation",
      provider: { "@type": "Organization", name: site.org },
      description,
      areaServed: "Worldwide",
      audience: {
        "@type": "Audience",
        audienceType: fit.suitable.items.join(", "),
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

/* The page reads as one argument, top to bottom: why change, proof it works,
   what is checked, what the journey is like, who it is for, what it costs,
   and the questions left over. Every section ends by pointing forward into
   the closing form rather than back up to the hero one. */
export default function HealthcareLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader />

      <main>
        {/* ================================================================
            Hero. Left: the promise, three numbers, the starting price, and a
            photograph of an accredited organization holding its award.
            Right: the application form, with the ISQua plate under it.

            The column wrappers dissolve on narrow screens (display:
            contents) and the pieces reorder for a phone: headline,
            photograph, form, proof.
            ================================================================ */}
        <section id="top" className="hc-hero">
          <div className="hc-hero-bg" aria-hidden="true">
            <div className="hc-hero-grid-bg" />
            <div className="hc-hero-orb hc-hero-orb--gold" />
            <div className="hc-hero-orb hc-hero-orb--blue" />
            <div className="hc-hero-orb hc-hero-orb--teal" />
            <HeroWaves />
          </div>

          <div className="hc-shell hc-hero-grid">
            <div className="hc-hero-main">
              <div className="hc-hero-copy">
                <p className="hc-hero-eyebrow">{hero.eyebrow}</p>
                <h1>
                  {hero.titleLead}{" "}
                  <span className="hc-underline">{hero.titleAccent}</span>
                </h1>
                <p className="hc-hero-lede">{hero.lede}</p>

                <ul className="hc-hero-stats" aria-label="Accreditation trust indicators">
                  {hero.proof.map((item) => {
                    const Icon = ICONS[item.icon];
                    return (
                      <li className="hc-hero-stat" key={item.label}>
                        <span className="hc-hero-stat-ico">
                          <Icon />
                        </span>
                        <p>
                          <b>{item.value}</b>
                          <small>{item.label}</small>
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <p className="hc-hero-price">
                  <IconCheck />
                  <span>{hero.price}</span>
                </p>
              </div>

              <figure className="hc-hero-shot">
                <Image
                  src={hero.photo}
                  alt={hero.photoAlt}
                  fill
                  preload
                  quality={92}
                  sizes="(max-width: 1040px) 100vw, 760px"
                />
                <figcaption>
                  <IconCheck />
                  {hero.photoCaption}
                </figcaption>
              </figure>
            </div>

            {/* A plain div rather than an aside: the wrapper is dissolved with
                display: contents on narrow screens, which drops a landmark's
                role in some browsers, so it never carries one. */}
            <div className="hc-hero-side">
              <div id="enquire" className="hc-hero-form">
                <ClinicForm />
              </div>

              <p className="hc-hero-isqua">
                <Image
                  src="/healthcare/isqua-eea.jpg"
                  alt="ISQua External Evaluation Association"
                  width={800}
                  height={221}
                />
                <span>{hero.isquaNote}</span>
              </p>
            </div>
          </div>
        </section>

        {/* 1. The opportunity: why change anything, and why now. */}
        <section id="why" className="hc-section hc-section--white">
          <div className="hc-dots hc-dots--tr" aria-hidden="true" />
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{opportunity.eyebrow}</p>
              <h2 className="hc-title">{opportunity.title}</h2>
              <p className="hc-lede">{opportunity.lede}</p>
            </header>

            <ol className="hc-benefit-grid">
              {opportunity.items.map((item, index) => {
                const Icon = ICONS[item.icon];
                return (
                  <li
                    className="hc-benefit-card reveal"
                    key={item.title}
                    style={{ transitionDelay: `${(index % 3) * 80}ms` }}
                  >
                    <span className="hc-benefit-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="hc-tile">
                      <Icon />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </li>
                );
              })}
            </ol>

            <div className="hc-benefit-action reveal">
              <a href="#apply-form" className="hc-button hc-button--primary">
                {opportunity.cta}
                <IconArrow className="hc-icon" />
              </a>
            </div>
          </div>
        </section>

        {/* 2. The proof: one clinic's own story, then the organizations
            beside it. */}
        <section id="proof" className="hc-section hc-section--navy">
          <div className="hc-dots hc-dots--light hc-dots--bl" aria-hidden="true" />
          <div className="hc-shell">
            <div className="hc-story-grid">
              <div className="reveal">
                <StoryVideo />
              </div>

              <div className="hc-story-copy reveal">
                <p className="hc-label hc-label--light">{story.eyebrow}</p>
                <h2 className="hc-title hc-title--light">{story.title}</h2>
                <p className="hc-lede hc-lede--light">{story.lede}</p>

                <div className="hc-story-id">
                  <Image src={story.logo} alt="" width={176} height={96} sizes="88px" />
                  <p>
                    <strong>{story.organization}</strong>
                    <small>{story.location}</small>
                  </p>
                </div>

                <ul className="hc-story-points">
                  {story.points.map((point) => (
                    <li key={point}>
                      <IconCheck />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="hc-org-label reveal">{organizations.label}</p>
            <ul className="hc-org-grid hc-org-grid--tight">
              {organizations.items.map((item, index) => (
                <li
                  className="hc-org-card reveal"
                  key={item.name}
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <span className="hc-org-logo">
                    <Image
                      src={item.logo}
                      alt={`${item.name} logo`}
                      width={108}
                      height={108}
                      sizes="108px"
                    />
                  </span>
                  <h3>{item.name}</h3>
                  <p>{item.location}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="gallery" className="hc-section hc-section--mist">
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{gallery.eyebrow}</p>
              <h2 className="hc-title">{gallery.title}</h2>
              <p className="hc-lede">{gallery.lede}</p>
            </header>
          </div>

          <GalleryMarquee />
        </section>

        {/* 3. The teaching: what a surveyor checks, useful before anyone
            applies. */}
        <section id="standards" className="hc-section hc-section--navy">
          <div className="hc-dots hc-dots--light hc-dots--tr" aria-hidden="true" />
          <div className="hc-shell">
            <header className="reveal">
              <p className="hc-label hc-label--light">{standards.eyebrow}</p>
              <h2 className="hc-title hc-title--light hc-title--wide">{standards.title}</h2>
              <p className="hc-lede hc-lede--light">{standards.lede}</p>
            </header>

            <ol className="hc-ledger">
              {standards.areas.map((area, index) => {
                const Icon = ICONS[area.icon];
                return (
                  <li
                    className="hc-ledger-row reveal"
                    key={area.title}
                    style={{ transitionDelay: `${index * 70}ms` }}
                  >
                    <span className="hc-ledger-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="hc-ledger-title">
                      <span className="hc-tile">
                        <Icon />
                      </span>
                      {area.title}
                    </h3>
                    <p>{area.body}</p>
                  </li>
                );
              })}
            </ol>

            <div className="hc-ledger-action reveal">
              <a href="#apply-form" className="hc-button hc-button--primary">
                {opportunity.cta}
                <IconArrow className="hc-icon" />
              </a>
              <a
                href={site.standards}
                target="_blank"
                rel="noopener noreferrer"
                className="hc-text-link"
              >
                {standards.standardsCta}
              </a>
            </div>
          </div>
        </section>

        {/* 4. The ownership experience: the journey step by step, then what
            the clinic holds at the end of it. */}
        <section id="process" className="hc-section hc-section--paper">
          <div className="hc-dots hc-dots--bl" aria-hidden="true" />
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{process.eyebrow}</p>
              <h2 className="hc-title">{process.title}</h2>
              <p className="hc-lede">{process.lede}</p>
            </header>

            <ol className="hc-steps">
              {process.steps.map((step, index) => (
                <li
                  className="hc-step reveal"
                  key={step.title}
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <span className="hc-step-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>

            <ul className="hc-outcomes reveal" aria-label="What your clinic holds once accredited">
              {process.outcomes.map((item) => (
                <li key={item.label}>
                  <b>{item.value}</b>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Who it is for, and who it is not for. */}
        <section id="fit" className="hc-section hc-section--navy">
          <div className="hc-dots hc-dots--light hc-dots--bl" aria-hidden="true" />
          <div className="hc-shell hc-eligibility-grid">
            <div>
              <p className="hc-label hc-label--light reveal">{fit.eyebrow}</p>
              <h2 className="hc-title hc-title--light reveal">{fit.title}</h2>

              <div className="hc-fit-columns">
                <div className="reveal">
                  <h3 className="hc-fit-label">{fit.suitable.label}</h3>
                  <ul className="hc-eligibility-list hc-eligibility-list--single">
                    {fit.suitable.items.map((item) => (
                      <li key={item}>
                        <IconCheckCircle />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="reveal">
                  <h3 className="hc-fit-label hc-fit-label--muted">{fit.unsuitable.label}</h3>
                  <ul className="hc-fit-not">
                    {fit.unsuitable.items.map((item) => (
                      <li key={item}>
                        <IconMinus />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="hc-eligibility-card reveal">
              <h3>{fit.cardTitle}</h3>
              <p>{fit.cardBody}</p>
              <div className="hc-eligibility-actions">
                <a href="#apply-form" className="hc-button hc-button--primary">
                  {fit.cardCta}
                  <IconArrow className="hc-icon" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 6. The investment, the same four sizes the form asks about. */}
        <section id="fees" className="hc-section hc-section--white">
          <div className="hc-dots hc-dots--tr" aria-hidden="true" />
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{fees.eyebrow}</p>
              <h2 className="hc-title">{fees.title}</h2>
              <p className="hc-lede">{fees.lede}</p>
            </header>

            <ul className="hc-fee-grid">
              {clinicSizes.map((size, index) => (
                <li
                  className="hc-fee-card reveal"
                  key={size.value}
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <h3>{size.value}</h3>
                  <p className="hc-fee-price">
                    <small>{fees.from}</small>
                    {size.price.replace("+", "")}
                  </p>
                </li>
              ))}
            </ul>

            <p className="hc-fee-note reveal">{fees.note}</p>

            <div className="hc-benefit-action reveal">
              <a href="#apply-form" className="hc-button hc-button--primary">
                {fees.cta}
                <IconArrow className="hc-icon" />
              </a>
            </div>
          </div>
        </section>

        <section id="team" className="hc-section hc-section--mist">
          <div className="hc-dots hc-dots--bl" aria-hidden="true" />
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{team.eyebrow}</p>
              <h2 className="hc-title">{team.title}</h2>
              <p className="hc-lede">{team.lede}</p>
            </header>

            <TeamGrid />
          </div>
        </section>

        {/* 7. The objections, answered before the call. */}
        <section id="faq" className="hc-section hc-section--white">
          <div className="hc-shell hc-faq-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{faq.eyebrow}</p>
              <h2 className="hc-title">{faq.title}</h2>
            </header>

            <div className="hc-faq">
              {faq.items.map((item) => (
                <details className="hc-faq-item reveal" key={item.q}>
                  <summary>
                    {item.q}
                    <span className="hc-faq-mark" aria-hidden="true" />
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="apply" className="hc-apply">
          <div className="hc-dots hc-dots--light hc-dots--tr" aria-hidden="true" />
          <div className="hc-shell hc-apply-grid">
            <div className="hc-apply-copy">
              <p className="hc-label hc-label--light reveal">{apply.eyebrow}</p>
              <h2 className="hc-title hc-title--light reveal">{apply.title}</h2>
              <p className="hc-lede reveal">{apply.body}</p>
              <p className="hc-apply-email reveal">
                Prefer to write? Email{" "}
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>

              <figure className="hc-apply-photo reveal">
                <Image
                  src={apply.photo}
                  alt={apply.photoAlt}
                  fill
                  sizes="(max-width: 1040px) 100vw, 46vw"
                />
                <figcaption>
                  <span>{apply.captionTitle}</span>
                  {apply.captionBody}
                </figcaption>
              </figure>
            </div>

            {/* Second copy of the hero form, so every call to action below
                the fold has a form to land on without sending the visitor
                back to the top. */}
            <div id="apply-form" className="hc-apply-form reveal">
              <ClinicForm layout="stack" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileCta />
    </>
  );
}

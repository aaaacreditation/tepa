import type { Metadata } from "next";
import Image from "next/image";
import { Fragment } from "react";
import { IconArrow } from "../components/Icons";
import { ApplyForm } from "./components/ApplyForm";
import { FormLinks } from "./components/FormLinks";
import { MobileCta } from "./components/MobileCta";
import { ReadinessLauncher } from "./components/ReadinessLauncher";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { about, apply, close, faq, framework, hero, process, readiness, sectors, site, stories } from "./content";
import { LineIcon } from "./icons";

/* /sme — the SMEs Accreditation landing page.

   The sections, their order and their wording follow the AAA website's
   client-approved SMEs Accreditation Program page; see content.ts. What
   changes for a landing page: a masthead over the hero instead of the site
   header, every "apply" lands on the application form below (#apply) rather
   than the website's /apply, and that form feeds /dashboard/sme. */

const title = "SMEs Accreditation Program";
const description =
  "Get an independent AAA SMEs Accreditation and a Business Readiness Score stakeholders trust. Recognised in 59 countries. Take the free 2-minute check.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sme" },
  openGraph: {
    title: `${title} | ${site.org}`,
    description,
    type: "website",
    siteName: site.org,
    images: [{ url: hero.photo, alt: hero.photoAlt }],
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
  "@type": "Service",
  name: title,
  description,
  serviceType: "SMEs accreditation",
  provider: {
    "@type": "Organization",
    name: site.org,
    url: site.website,
    email: site.email,
    telephone: site.phoneLabel,
  },
  areaServed: "Worldwide",
};

export default function SmePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />

      <main id="top">
        {/* Hero: copy on the left, the application form on the right, over
            the team photo as a background — the same layout as /tepa. */}
        <section className="sme-hero">
          <div className="sme-hero-bg" aria-hidden="true">
            <Image
              src={hero.photo}
              alt=""
              fill
              preload
              sizes="100vw"
              /* Drawn at 42% opacity under a navy wash, as /tepa does with its
                 hero photo, so compression artefacts cannot be seen. */
              quality={50}
              className="sme-hero-bg-img"
            />
          </div>
          {/* Head, form and body are separate grid areas: beside each other on
              desktop, and on phones the form comes straight after the title
              rather than after the long intro. */}
          <div className="container sme-hero-grid">
            <div className="sme-hero-head">
              <p className="sme-hero-kicker reveal">{hero.kicker}</p>
              <h1 className="reveal">{hero.title}</h1>
            </div>
            <div className="sme-hero-body">
              <p className="sme-hero-lead reveal">{hero.lead}</p>
              <div className="sme-hero-links reveal">
                <a href="#readiness" className="sme-hero-link">
                  {hero.primary} <IconArrow />
                </a>
                <a href={site.calendly} target="_blank" rel="noopener noreferrer" className="sme-hero-link sme-hero-link--quiet">
                  {hero.secondary} <IconArrow />
                </a>
              </div>
              <dl className="sme-hero-stats reveal">
                {hero.stats.map((stat) => (
                  <div className="sme-hero-stat" key={stat.label}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="enquire" className="sme-hero-form reveal">
              <ApplyForm compact title={hero.formTitle} />
            </div>
          </div>
        </section>

        <div className="smex-hero-rail sme-rail" aria-label="Program principles">
          <div className="container">
            {hero.rail.map((item, i) => (
              <Fragment key={item}>
                <span>{item}</span>
                {i < hero.rail.length - 1 ? <i>★</i> : null}
              </Fragment>
            ))}
          </div>
        </div>

        {/* What is SMEs Accreditation + sectors */}
        <section className="smex-journey" id="about">
          <div className="container">
            <div className="smex-about-split" id="who">
              <div className="smex-about-copy reveal">
                <h2>{about.title}</h2>
                <span className="smex-about-rule" aria-hidden="true" />
                {about.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="smex-about-cards">
                {about.cards.map((c, i) => (
                  <article className="smex-about-card reveal" key={c.big} style={{ transitionDelay: `${i * 60}ms` }}>
                    <h3>
                      <span className="t1">{c.big}</span>
                      <span className="t2">{c.small}</span>
                    </h3>
                    <span className="smex-about-card-rule" aria-hidden="true" />
                    <p>{c.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="smex-sub reveal" id="sectors">
              <h3>{about.sectorsTitle}</h3>
              <p>{about.sectorsText}</p>
            </div>
          </div>

          <div className="smex-sector-strip reveal" aria-label="Industries we accredit">
            <div className="smex-sector-cols">
              {sectors.map((s) => (
                <div className="smex-sector-col" key={s.name}>
                  <div className="smex-sector-photo">
                    <Image src={s.img} alt={s.name} fill sizes="(max-width: 720px) 33vw, (max-width: 1100px) 17vw, 9vw" />
                  </div>
                  <div className="smex-sector-cell">
                    <span className="smex-sector-glyph">
                      <LineIcon name={s.icon} />
                    </span>
                    <span className="smex-sector-name">{s.name}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="smex-sector-band">
              <span className="smex-sector-band-ico" aria-hidden="true">
                <LineIcon name="globe" />
              </span>
              <p>{about.bandText}</p>
              <div className="smex-about-ctas">
                <a href="#readiness" className="smex-btn smex-btn-gold">
                  {about.bandPrimary} <IconArrow />
                </a>
                <a href="#process" className="smex-btn smex-btn-ghost">
                  {about.bandSecondary}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Six pillars */}
        <section className="sme-cats" id="framework">
          <div className="container">
            <div className="smex-fw-head reveal">
              <div className="sme-head">
                <h2>{framework.title}</h2>
                <p>{framework.text}</p>
              </div>
              <figure className="smex-fw-photo">
                <Image src={framework.photo} alt={framework.photoAlt} fill sizes="(max-width: 1100px) 92vw, 38vw" />
                <figcaption>
                  <span>{framework.caption.kicker}</span>
                  <strong>{framework.caption.title}</strong>
                </figcaption>
              </figure>
            </div>
            <div className="sme-cats-grid">
              {framework.pillars.map((c, i) => (
                <article className="smex-mvv-card reveal" key={c.title} tabIndex={0} style={{ transitionDelay: `${i * 55}ms` }}>
                  <div className="smex-mvv-in">
                    <div className="smex-mvv-top">
                      <span className="smex-mvv-ico" aria-hidden="true">
                        <LineIcon name={c.icon} />
                      </span>
                      <span className="smex-mvv-no" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3>{c.title}</h3>
                    <span className="smex-mvv-rule" aria-hidden="true" />
                    <div className="smex-hover-panel">
                      <h4>{c.title}</h4>
                      <p>{c.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="sme-process" id="process">
          <div className="container">
            <div className="smex-proc-head reveal">
              <div className="sme-head">
                <h2>{process.title}</h2>
                <p>{process.text}</p>
                <div className="smex-proc-ctas">
                  <a href="#apply" className="smex-btn smex-btn-blue">
                    {process.primary} <IconArrow />
                  </a>
                  <a href={site.calendly} target="_blank" rel="noopener noreferrer" className="smex-btn smex-btn-ghost-navy">
                    {process.secondary}
                  </a>
                </div>
              </div>
              <figure className="smex-proc-photo">
                <Image src={process.photo} alt={process.photoAlt} fill sizes="(max-width: 1100px) 92vw, 38vw" />
              </figure>
            </div>
            <div className="smex-timeline reveal">
              <div className="smex-proc-grid">
                <ol className="smex-proc-steps">
                  {process.steps.map((step, i) => (
                    <li className="smex-proc-step" key={step.title} style={{ "--i": i } as React.CSSProperties}>
                      <span className="smex-proc-badge" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="smex-proc-ico">
                        <LineIcon name={step.icon} />
                      </span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </li>
                  ))}
                </ol>
                <aside className="smex-proc-cert">
                  <Image src={process.seal} alt={process.sealAlt} width={887} height={900} className="smex-proc-seal" />
                  <p>
                    Accreditation Certificate valid for <strong>{process.validity}</strong>
                  </p>
                </aside>
              </div>
              <p className="smex-proc-note">
                <em>{process.note}</em>
              </p>
            </div>
          </div>
        </section>

        {/* Readiness check */}
        <section className="smex-strip" id="readiness">
          <div className="container">
            <div className="smex-strip-card reveal">
              <div className="smex-strip-copy">
                <h2>{readiness.title}</h2>
                <p>{readiness.text}</p>
              </div>
              <ReadinessLauncher />
            </div>
          </div>
        </section>

        {/* Success stories */}
        <section className="smex-legacy" id="accredited">
          <div className="container">
            <div className="smex-stories-head reveal">
              <div className="sme-head">
                <span className="eyebrow">{stories.eyebrow}</span>
                <h2>{stories.title}</h2>
                <p>{stories.text}</p>
              </div>
              <aside className="smex-stories-featured">
                <strong>{stories.featuredLabel}</strong>
                <span>{stories.featured}</span>
              </aside>
            </div>
          </div>
          <div className="smex-carousel reveal" aria-label="AAA success stories">
            <div className="smex-carousel-track">
              {[...stories.items, ...stories.items].map((s, i) => (
                <figure
                  className="smex-story-card"
                  key={`${s.name}-${i}`}
                  aria-hidden={i >= stories.items.length || undefined}
                >
                  <div className="smex-story-photo">
                    <Image
                      src={s.img}
                      alt={i < stories.items.length ? `${s.name} — AAA accreditation story` : ""}
                      fill
                      sizes="400px"
                    />
                    <span className="smex-story-loc">{s.country}</span>
                  </div>
                  <figcaption>
                    <div>
                      <div className="smex-story-title">
                        <h3>{s.name}</h3>
                        {s.logo ? (
                          <Image src={s.logo} alt={`${s.name} logo`} width={120} height={52} className="smex-story-logo" />
                        ) : null}
                      </div>
                      <p className="smex-story-quote">&ldquo;{s.quote}&rdquo;</p>
                    </div>
                    <div className="smex-story-foot">
                      <span className="smex-story-badge">Accredited</span>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="container">
            <div className="smex-legacy-cta reveal">
              <a href={stories.allLink} target="_blank" rel="noopener noreferrer" className="smex-btn smex-btn-blue">
                {stories.allLabel}
              </a>
              <a href="#apply" className="smex-btn smex-btn-gold">
                {stories.apply} <IconArrow />
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="sme-faq" id="faq">
          <div className="container">
            <div className="sme-head reveal">
              <h2>{faq.title}</h2>
              <p>{faq.text}</p>
            </div>
            <div className="sme-faq-list">
              {faq.items.map((item, index) => (
                <details className="sme-faq-item" key={item.q} open={index === 0}>
                  <summary>
                    <span>{item.q}</span>
                    <span className="sme-faq-plus" aria-hidden="true" />
                  </summary>
                  <div className="sme-faq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Application form, the second copy of the hero's — for visitors who
            read the whole page before applying. */}
        <section className="sap" id="apply">
          <div className="container sap-grid">
            <div className="sap-copy reveal">
              <span className="eyebrow">{apply.eyebrow}</span>
              <h2>{apply.title}</h2>
              <p>{apply.text}</p>
              <ul className="sap-points">
                {apply.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="sap-alt">
                Prefer to talk first?{" "}
                <a href={site.calendly} target="_blank" rel="noopener noreferrer">
                  Book a free consultation
                </a>
                .
              </p>
            </div>
            <ApplyForm />
          </div>
        </section>

        {/* Closing call to action */}
        <section className="sme-contact" id="contact">
          <span className="sme-contact-corner" />
          <div className="container">
            <div className="smex-close-strip reveal">
              <div className="smex-close-copy">
                <span className="eyebrow">{close.eyebrow}</span>
                <h2>{close.title}</h2>
                <p>{close.text}</p>
              </div>
              <figure className="smex-close-photo">
                <Image src={close.photo} alt={close.photoAlt} fill sizes="(max-width: 720px) 92vw, 330px" />
              </figure>
              <div className="smex-close-actions">
                <a href="#apply" className="smex-btn smex-btn-gold">
                  {close.apply} <IconArrow />
                </a>
                <a href={site.calendly} target="_blank" rel="noopener noreferrer" className="smex-btn smex-btn-ghost">
                  {close.meeting}
                </a>
                <a href={site.applicationForm} download className="smex-btn smex-btn-ghost">
                  <LineIcon name="download" /> {close.download}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileCta />
      <FormLinks />
    </>
  );
}

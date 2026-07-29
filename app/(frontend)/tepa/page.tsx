import type { Metadata } from "next";
import Image from "next/image";
import { EnquiryForm } from "./components/EnquiryForm";
import { IconArrow, IconCalendar } from "./components/Icons";
import { MobileCta } from "./components/MobileCta";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { TestimonialMarquee } from "./components/TestimonialMarquee";
import {
  apply,
  benefits,
  glance,
  hero,
  journey,
  practice,
  site,
} from "./content";

const title = "Accreditation of Training & Education Providers";
const description =
  "Build trust, reach new markets, and demonstrate the quality of your training programs with globally recognized AAA accreditation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tepa" },
  openGraph: {
    title: `${title} | ${site.org}`,
    description,
    type: "website",
    siteName: site.org,
    images: [
      {
        url: "/tepa/hero-background-v2.png",
        width: 1319,
        height: 1086,
        alt: "AAA-accredited training provider receiving its certificate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${site.org}`,
    description,
    images: ["/tepa/hero-background-v2.png"],
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
      logo: "/tepa/identity-v4.png",
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
      serviceType: "Training and education provider accreditation",
      provider: { "@type": "Organization", name: site.org },
      description,
      areaServed: "Worldwide",
    },
    {
      "@type": "HowTo",
      name: journey.title,
      description: journey.lede,
      totalTime: "P8W",
      step: journey.stages.map((stage, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: stage.title,
        text: stage.body,
      })),
    },
  ],
};

export default function TepaLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              <p className="section-kicker section-kicker--gold reveal">{hero.eyebrow}</p>
              <h1 className="hero-title reveal">{hero.title}</h1>
              <p className="hero-lede reveal">{hero.lede}</p>

              <div className="hero-actions reveal">
                <a
                  href={site.calendly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tepa-button tepa-button--gold"
                >
                  <IconCalendar className="button-icon" />
                  {hero.primaryCta}
                </a>
                <a href="#at-a-glance" className="text-link text-link--gold">
                  {hero.secondaryCta}
                  <IconArrow className="link-icon" />
                </a>
              </div>

              <dl className="hero-stats reveal">
                {hero.stats.map((stat) => (
                  <div className="hero-stat" key={stat.label}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </dl>
            </div>

            <div id="enquire" className="hero-form reveal">
              <EnquiryForm />
            </div>
          </div>
        </section>

        <section id="benefits" className="section section--ivory benefits-section">
          <div className="section-geometry section-geometry--right" aria-hidden="true" />
          <div className="site-shell benefits-grid">
            <div className="benefits-intro">
              <p className="section-kicker reveal">{benefits.eyebrow}</p>
              <h2 className="section-title reveal">{benefits.title}</h2>
              <figure className="benefits-photo reveal">
                <Image
                  src="/tepa/practice-beauty-team.jpeg"
                  alt="A professional education group holding AAA-accredited certificates"
                  fill
                  sizes="(max-width: 900px) 100vw, 43vw"
                  className="cover-image"
                />
                <figcaption>Professional training in practice · United States</figcaption>
              </figure>
            </div>

            <ol className="benefit-list">
              {benefits.items.map((item, index) => (
                <li
                  className="benefit-card reveal"
                  key={item.title}
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
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

        <section id="journey" className="section section--navy journey-section">
          <div className="dark-geometry" aria-hidden="true" />
          <div className="site-shell">
            <header className="section-heading section-heading--center reveal">
              <p className="section-kicker section-kicker--gold">{journey.eyebrow}</p>
              <h2 className="section-title section-title--light">{journey.title}</h2>
              <p className="section-lede section-lede--light">{journey.lede}</p>
            </header>

            <ol className="journey-grid">
              {journey.stages.map((stage, index) => (
                <li
                  className={`journey-card reveal ${
                    index === journey.stages.length - 1 ? "journey-card--final" : ""
                  }`}
                  key={stage.title}
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <span className="journey-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {index === journey.stages.length - 1 ? (
                    <Image
                      src="/tepa/accreditation-seal.png"
                      alt=""
                      width={720}
                      height={720}
                      className="journey-seal"
                    />
                  ) : (
                    <span className="journey-mark" aria-hidden="true">
                      {index === 0 ? "01" : index === 1 ? "✓" : "✓"}
                    </span>
                  )}
                  <h3>{stage.title}</h3>
                  <p>{stage.body}</p>
                </li>
              ))}
            </ol>

            <div className="journey-action reveal">
              <span>Most providers complete accreditation in 3 to 8 weeks.</span>
              <a href="#enquire" className="tepa-button tepa-button--outline-light">
                Start Your Application
                <IconArrow className="button-icon" />
              </a>
            </div>
          </div>
        </section>

        <section id="in-practice" className="section section--paper practice-section">
          <div className="section-geometry section-geometry--left" aria-hidden="true" />
          <div className="site-shell">
            <header className="section-heading section-heading--center reveal">
              <p className="section-kicker">{practice.eyebrow}</p>
              <h2 className="section-title">{practice.title}</h2>
              <p className="section-lede">{practice.lede}</p>
            </header>

            <div className="practice-gallery">
              {practice.images.map((image, index) => (
                <figure
                  className={`practice-shot practice-shot--${index + 1} reveal`}
                  key={image.src}
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 720px) 100vw, 50vw"
                    className="cover-image"
                  />
                  <figcaption>{image.label}</figcaption>
                </figure>
              ))}
            </div>

            <TestimonialMarquee stories={practice.stories} />

            <div className="center-link reveal">
              <a
                href={site.directory}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link text-link--navy"
              >
                Explore Accredited Organizations
                <IconArrow className="link-icon" />
              </a>
            </div>
          </div>
        </section>

        <section id="at-a-glance" className="section section--white glance-section">
          <div className="section-geometry section-geometry--right" aria-hidden="true" />
          <div className="site-shell">
            <header className="section-heading section-heading--center reveal">
              <p className="section-kicker">{glance.eyebrow}</p>
              <h2 className="section-title">{glance.title}</h2>
              <p className="section-lede">{glance.lede}</p>
            </header>

            <ol className="glance-grid">
              {glance.items.map((item, index) => (
                <li
                  className={`glance-card reveal ${
                    index === glance.items.length - 1 ? "glance-card--highlight" : ""
                  }`}
                  key={item.title}
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <span className="glance-icon" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="glance-title-row">
                      <span className="glance-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {"badge" in item && item.badge ? (
                        <span className="glance-badge">{item.badge}</span>
                      ) : null}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="apply" className="section apply-section">
          <div className="site-shell apply-grid">
            <figure className="apply-photo reveal">
              <Image
                src="/tepa/practice-qms.jpeg"
                alt="An accredited provider holding its framed AAA accreditation certificate"
                fill
                sizes="(max-width: 900px) 100vw, 48vw"
                className="cover-image"
              />
              <figcaption>
                <span>{apply.captionTitle}</span>
                {apply.captionBody}
              </figcaption>
            </figure>

            <div className="apply-copy">
              <p className="section-kicker reveal">{apply.eyebrow}</p>
              <h2 className="section-title reveal">{apply.title}</h2>
              <p className="section-lede reveal">{apply.body}</p>
              <div className="apply-actions reveal">
                <a href="#enquire" className="tepa-button tepa-button--navy">
                  {apply.primaryCta}
                  <IconArrow className="button-icon" />
                </a>
                <a
                  href={site.calendly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tepa-button tepa-button--outline-navy"
                >
                  <IconCalendar className="button-icon" />
                  {apply.secondaryCta}
                </a>
              </div>
              <p className="apply-email reveal">
                Prefer to write? Email{" "}
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileCta />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { EnquiryForm } from "./components/EnquiryForm";
import { GalleryMarquee } from "./components/GalleryMarquee";
import { ICONS, IconArrow, IconCheckCircle } from "../components/Icons";
import { MobileCta } from "./components/MobileCta";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { TeamGrid } from "./components/TeamGrid";
import {
  about,
  apply,
  applyForm,
  benefits,
  eligibility,
  gallery,
  hero,
  organizations,
  presence,
  process,
  site,
  standards,
  team,
} from "./content";

const title = "Healthcare Accreditation for Hospitals & Clinics";
const description =
  "Internationally aligned accreditation standards supporting patient safety, clinical excellence, and organizational performance. ISQua EEA assessed, active in 53+ countries.";

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
        url: "/healthcare/gallery/gallery-6.jpeg",
        width: 1400,
        height: 932,
        alt: "Hospital leadership receiving the AAA accreditation plaque",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${site.org}`,
    description,
    images: ["/healthcare/gallery/gallery-6.jpeg"],
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
        audienceType: eligibility.entities.join(", "),
      },
    },
  ],
};

export default function HealthcareLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader />

      <main>
        <section id="top" className="hc-hero">
          {/* Decorative background stack, painted under the content. The photo
              sits at 30% behind the middle of the hero and is masked to fade
              out on every edge, so it reads as part of the gradient rather
              than as a rectangle dropped on top of it. */}
          <div className="hc-hero-aura hc-hero-aura--a" aria-hidden="true" />
          <div className="hc-hero-aura hc-hero-aura--b" aria-hidden="true" />
          <div className="hc-rings" aria-hidden="true" />
          <div className="hc-hero-photo" aria-hidden="true">
            <Image
              src="/healthcare/certificate-handover.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 1040px) 100vw, 1180px"
            />
          </div>
          <div className="hc-hero-scrim" aria-hidden="true" />

          <div className="hc-shell hc-hero-grid">
            <div className="hc-hero-copy">
              <p className="hc-label hc-label--light reveal">{hero.eyebrow}</p>
              <h1 className="hc-hero-title reveal">
                {hero.titleLead}{" "}
                <span className="hc-hero-accent">{hero.titleAccent}</span>
              </h1>
              <p className="hc-hero-lede reveal">{hero.lede}</p>

              {/* No booking button: the form beside this copy is the only
                  thing a visitor is asked to do. */}
              <div className="hc-hero-actions reveal">
                <a href="#standards" className="hc-link">
                  {hero.secondaryCta}
                  <IconArrow className="hc-icon" />
                </a>
              </div>

              <dl className="hc-hero-stats reveal">
                {hero.stats.map((stat) => (
                  <div className="hc-hero-stat" key={stat.label}>
                    <dt>{stat.value}</dt>
                    <dd>{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="enquire" className="hc-hero-form reveal">
              <EnquiryForm />
            </div>
          </div>
        </section>

        <div className="hc-isqua">
          <div className="hc-shell hc-isqua-inner">
            <Image
              src="/healthcare/isqua-eea.jpg"
              alt="ISQua External Evaluation Association"
              width={800}
              height={221}
            />
            <p>
              <strong>AAA Healthcare Accreditation Standards</strong> have been
              assessed by ISQua EEA, confirming alignment with international best
              practice requirements.
            </p>
          </div>
        </div>

        <section id="about" className="hc-section hc-section--mist">
          <div className="hc-dots hc-dots--tr" aria-hidden="true" />
          <div className="hc-shell hc-about-grid">
            <div className="hc-about-copy">
              <p className="hc-label reveal">{about.eyebrow}</p>
              <h2 className="hc-title reveal">{about.title}</h2>
              {about.paragraphs.map((paragraph) => (
                <p className="reveal" key={paragraph.slice(0, 32)}>
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="hc-mv-grid">
              {about.cards.map((card, index) => {
                const Icon = ICONS[card.icon];
                return (
                  <article
                    className="hc-mv-card reveal"
                    key={card.title}
                    style={{ transitionDelay: `${index * 90}ms` }}
                  >
                    <div className="hc-mv-head">
                      <span className="hc-tile">
                        <Icon />
                      </span>
                      <h3>{card.title}</h3>
                    </div>
                    <p>{card.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="hc-section hc-section--navy">
          <div className="hc-dots hc-dots--light hc-dots--bl" aria-hidden="true" />
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label hc-label--light">{presence.eyebrow}</p>
              <h2 className="hc-title hc-title--light">{presence.title}</h2>
              <p className="hc-lede hc-lede--light">{presence.lede}</p>
            </header>

            <figure className="hc-map reveal">
              <div className="hc-map-frame">
                <Image
                  src="/healthcare/map.png"
                  alt={presence.mapAlt}
                  width={1200}
                  height={655}
                  sizes="(max-width: 720px) 100vw, 1200px"
                />
              </div>
            </figure>
          </div>
        </section>

        <section id="benefits" className="hc-section hc-section--white">
          <div className="hc-dots hc-dots--tr" aria-hidden="true" />
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{benefits.eyebrow}</p>
              <h2 className="hc-title">{benefits.title}</h2>
              <p className="hc-lede">{benefits.lede}</p>
            </header>

            <ol className="hc-benefit-grid">
              {benefits.items.map((item, index) => {
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
                Start your accreditation journey
                <IconArrow className="hc-icon" />
              </a>
            </div>
          </div>
        </section>

        <section id="standards" className="hc-section hc-section--navy">
          <div className="hc-dots hc-dots--light hc-dots--tr" aria-hidden="true" />
          <div className="hc-shell">
            <header className="reveal">
              <p className="hc-label hc-label--light">{standards.eyebrow}</p>
              <h2 className="hc-title hc-title--light hc-title--wide">
                {standards.title}
              </h2>
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
          </div>
        </section>

        <section id="process" className="hc-section hc-section--paper">
          <div className="hc-dots hc-dots--bl" aria-hidden="true" />
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{process.eyebrow}</p>
              <h2 className="hc-title">{process.title}</h2>
              <p className="hc-lede">{process.lede}</p>
            </header>

            <figure className="hc-process-figure reveal">
              <Image
                src={process.image}
                alt={process.imageAlt}
                width={1800}
                height={519}
                sizes="(max-width: 1240px) 100vw, 1196px"
              />
              <figcaption>{process.note}</figcaption>
            </figure>
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

        <section id="eligibility" className="hc-section hc-section--navy">
          <div className="hc-dots hc-dots--light hc-dots--bl" aria-hidden="true" />
          <div className="hc-shell hc-eligibility-grid">
            <div>
              <p className="hc-label hc-label--light reveal">{eligibility.eyebrow}</p>
              <h2 className="hc-title hc-title--light reveal">{eligibility.title}</h2>
              <p className="hc-lede hc-lede--light reveal">{eligibility.lede}</p>

              <ul className="hc-eligibility-list reveal">
                {eligibility.entities.map((entity) => (
                  <li key={entity}>
                    <IconCheckCircle />
                    <span>{entity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hc-eligibility-card reveal">
              <h3>{eligibility.cardTitle}</h3>
              <p>{eligibility.cardBody}</p>
              <div className="hc-eligibility-actions">
                <a href="#apply-form" className="hc-button hc-button--primary">
                  {eligibility.cardCta}
                  <IconArrow className="hc-icon" />
                </a>
                <a
                  href={site.standards}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hc-button hc-button--outline"
                >
                  {eligibility.standardsCta}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="organizations" className="hc-section hc-section--white">
          <div className="hc-dots hc-dots--tr" aria-hidden="true" />
          <div className="hc-shell">
            <header className="hc-heading--center reveal">
              <p className="hc-label">{organizations.eyebrow}</p>
              <h2 className="hc-title">{organizations.title}</h2>
              <p className="hc-lede">{organizations.lede}</p>
            </header>

            <ul className="hc-org-grid">
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

            {/* Second copy of the hero form, so every CTA below the fold has a
                form to land on without sending the visitor back to the top. */}
            <div id="apply-form" className="hc-apply-form reveal">
              <EnquiryForm badge={applyForm.badge} title={applyForm.title} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <MobileCta />
    </>
  );
}

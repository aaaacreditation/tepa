import type { Metadata } from "next";
import Image from "next/image";
import {
  ICONS,
  IconArrow,
  IconGlobe,
  IconShield,
  IconSupport,
  IconWhatsApp,
} from "../components/Icons";
import { HeroBackdrop } from "./components/HeroBackdrop";
import { ReadinessQuiz } from "./components/ReadinessQuiz";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { domainsIntro, hero, organizations, quizIntro, result, site } from "./content";
import { DOMAINS, QUESTION_COUNT } from "./quiz";

const title = "Clinic Accreditation Readiness Assessment";
const description =
  "A 2-minute self-assessment built on the standards the American Accreditation Association uses to accredit aesthetic and specialty clinics in 53+ countries. Get your readiness score and a clear next step.";

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
        url: "/healthcare/gallery/gallery-5.jpeg",
        width: 1400,
        height: 934,
        alt: "Clinicians at an AAA-accredited aesthetic clinic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${site.org}`,
    description,
    images: ["/healthcare/gallery/gallery-5.jpeg"],
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
      serviceType: "Aesthetic and specialty clinic accreditation",
      provider: { "@type": "Organization", name: site.org },
      description,
      areaServed: "Worldwide",
    },
    {
      "@type": "Quiz",
      name: title,
      about: { "@type": "Thing", name: "Clinic accreditation readiness" },
      educationalLevel: "Professional",
      numberOfQuestions: QUESTION_COUNT,
      hasPart: DOMAINS.map((domain) => ({
        "@type": "Thing",
        name: domain.name,
      })),
    },
  ],
};

const STAT_ICONS = {
  shield: IconShield,
  globe: IconGlobe,
  support: IconSupport,
} as const;

export default function ClinicLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader />

      <main>
        <section id="top" className="cl-hero">
          <HeroBackdrop />

          <div className="cl-wrap cl-hero-grid">
            <div>
              <span className="cl-eyebrow">
                <i aria-hidden="true" />
                {hero.eyebrow}
              </span>

              <h1>
                {hero.titleLead} <span className="tint">{hero.titleAccent}</span>{" "}
                {hero.titleTail}
              </h1>

              <p className="cl-lede">{hero.lede}</p>

              <div className="cl-hero-cta">
                <a className="cl-btn cl-btn--white" href="#quiz">
                  {hero.primaryCta}
                  <IconArrow className="cl-ico" />
                </a>
                <a className="cl-btn cl-btn--ghost" href="#domains">
                  {hero.secondaryCta}
                </a>
              </div>

              <p className="cl-micro">{hero.micro}</p>
            </div>

            <ul className="cl-stats">
              {hero.stats.map((stat) => {
                const Icon =
                  stat.icon === "isqua"
                    ? null
                    : STAT_ICONS[stat.icon as keyof typeof STAT_ICONS];
                return (
                  <li
                    className={`cl-glass${stat.icon === "isqua" ? " is-isqua" : ""}`}
                    key={stat.label}
                  >
                    {Icon ? (
                      <Icon />
                    ) : (
                      <Image
                        src="/healthcare/isqua-eea.jpg"
                        alt="ISQua EEA accredited standards"
                        width={800}
                        height={221}
                      />
                    )}
                    <b>{stat.value}</b>
                    <span>{stat.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="quiz" className="cl-quiz-section">
          <div className="cl-wrap">
            <div className="cl-intro">
              <p className="cl-kicker">{quizIntro.eyebrow}</p>
              <h2>{quizIntro.title}</h2>
              <p>{quizIntro.lede}</p>
            </div>

            <ReadinessQuiz />

            <div className="cl-trust">
              <p className="cl-trust-label">{result.trustLabel}</p>
              <ul className="cl-logos">
                {organizations.map((org) => (
                  <li key={org.name}>
                    <figure>
                      <Image
                        src={org.logo}
                        alt=""
                        width={62}
                        height={62}
                        sizes="62px"
                      />
                      <figcaption>
                        <b>{org.name}</b>
                        {org.location}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="domains" className="cl-section cl-section--paper">
          <div className="cl-wrap">
            <div className="cl-intro">
              <p className="cl-kicker">{domainsIntro.eyebrow}</p>
              <h2>{domainsIntro.title}</h2>
              <p>{domainsIntro.lede}</p>
            </div>

            <ul className="cl-domain-grid">
              {domainsIntro.items.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <li className="cl-domain" key={item.title}>
                    <span className="cl-domain-ic">
                      <Icon />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />

      <a
        className="cl-wa"
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with an advisor on WhatsApp"
      >
        <IconWhatsApp />
      </a>
    </>
  );
}

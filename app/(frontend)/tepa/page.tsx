import type { Metadata } from "next";
import { Apply } from "./components/Apply";
import { Hero } from "./components/Hero";
import { MobileCta } from "./components/MobileCta";
import { Pillars } from "./components/Pillars";
import { Process } from "./components/Process";
import { Requirements } from "./components/Requirements";
import { RevealController } from "./components/RevealController";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { SymbolSection } from "./components/SymbolSection";
import { WhySection } from "./components/WhySection";
import { process, requirements, site } from "./content";

const title = "Accreditation Of Training & Education Providers";
const description =
  "Have your training programs formally recognized by the American Accreditation Association and display the AAA Accreditation Symbol on your training materials and certificates. Accreditation in 3 to 8 weeks.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tepa" },
  openGraph: {
    title: `${title} | ${site.org}`,
    description,
    type: "website",
    siteName: site.org,
    images: [{ url: "/tepa/accreditation-symbol.jpg", width: 1600, height: 1600, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${site.org}`,
    description,
    images: ["/tepa/accreditation-symbol.jpg"],
  },
  robots: { index: true, follow: true },
};

/** Structured data so the offering and the process show up well in search. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: site.org,
      url: site.website,
      logo: "/tepa/aaa-logo.png",
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
      sameAs: site.social.map((channel) => channel.href),
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
      name: process.title,
      description: process.lede,
      totalTime: "P8W",
      step: process.stages.map((stage, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: stage.title,
        text: stage.body,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: requirements.groups.map((group) => ({
        "@type": "Question",
        name: `What are the accreditation requirements ${group.label.toLowerCase()}?`,
        acceptedAnswer: { "@type": "Answer", text: group.items.join(" ") },
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
        <Hero />
        <Pillars />
        <SymbolSection />
        <Requirements />
        <Process />
        <WhySection />
        <Apply />
      </main>

      <SiteFooter />
      <MobileCta />
      <RevealController />
    </>
  );
}

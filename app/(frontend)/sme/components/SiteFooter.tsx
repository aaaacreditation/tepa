import Image from "next/image";
import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconMail,
  IconPhone,
  IconPin,
  IconTwitter,
  IconWhatsApp,
} from "../../components/Icons";
import { nav, site } from "../content";

const socialIcons = {
  LinkedIn: IconLinkedIn,
  Twitter: IconTwitter,
  Facebook: IconFacebook,
  Instagram: IconInstagram,
};

export function SiteFooter() {
  return (
    <footer className="sme-footer">
      <div className="container sme-footer-grid">
        <div className="sme-footer-brand">
          <Image src="/sme/aaa-logo-white.png" alt={site.org} width={349} height={141} unoptimized />
          <p>
            An independent accreditation body helping small and medium enterprises demonstrate
            credibility, strengthen business practices and grow with confidence.
          </p>
          <div className="sme-footer-socials">
            {site.social.map((channel) => {
              const Icon = socialIcons[channel.name as keyof typeof socialIcons];
              return (
                <a key={channel.name} href={channel.href} target="_blank" rel="noopener noreferrer" aria-label={channel.name}>
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <h2>On this page</h2>
          <nav className="sme-footer-links" aria-label="Footer navigation">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href="#apply">Apply for Accreditation</a>
          </nav>
        </div>

        <div>
          <h2>Contact</h2>
          <ul className="sme-footer-contact">
            <li>
              <IconPin />
              <span>
                {site.address[0]}
                <br />
                {site.address[1]}
              </span>
            </li>
            <li>
              <IconPhone />
              <a href={site.phoneHref}>{site.phoneLabel}</a>
            </li>
            <li>
              <IconWhatsApp />
              <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer">
                WhatsApp {site.whatsappLabel}
              </a>
            </li>
            <li>
              <IconMail />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container sme-footer-bottom">
        <p>© {site.org}. All rights reserved.</p>
        <a href={site.website} target="_blank" rel="noopener noreferrer">
          aaa-accreditation.org
        </a>
      </div>
    </footer>
  );
}

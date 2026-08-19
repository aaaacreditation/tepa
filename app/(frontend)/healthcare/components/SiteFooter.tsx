import Image from "next/image";
import { nav, site } from "../content";
import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconMail,
  IconPhone,
  IconPin,
  IconTwitter,
} from "../../components/Icons";

const socialIcons = {
  LinkedIn: IconLinkedIn,
  Twitter: IconTwitter,
  Facebook: IconFacebook,
  Instagram: IconInstagram,
};

export function SiteFooter() {
  return (
    <footer className="hc-footer">
      <div className="hc-shell hc-footer-grid">
        <div className="hc-footer-brand">
          <Image
            src="/healthcare/aaa-logo.png"
            alt={site.org}
            width={595}
            height={200}
            unoptimized
          />
          <p>
            Delivering independent, international accreditation programs that build
            trust and confidence in healthcare quality and safety.
          </p>
          <div className="hc-footer-socials">
            {site.social.map((channel) => {
              const Icon = socialIcons[channel.name as keyof typeof socialIcons];
              return (
                <a
                  key={channel.name}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={channel.name}
                >
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <h2>On this page</h2>
          <nav className="hc-footer-links" aria-label="Footer navigation">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href="#enquire">Check eligibility</a>
          </nav>
        </div>

        <div>
          <h2>Contact</h2>
          <ul className="hc-footer-contact">
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
              <IconMail />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="hc-shell hc-footer-bottom">
        <p>
          © {new Date().getFullYear()} {site.org}. All rights reserved.
        </p>
        <a href={site.website} target="_blank" rel="noopener noreferrer">
          aaa-accreditation.org
        </a>
      </div>
    </footer>
  );
}

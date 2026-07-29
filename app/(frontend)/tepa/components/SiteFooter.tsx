import Image from "next/image";
import { nav, site } from "../content";
import {
  IconFacebook,
  IconLinkedIn,
  IconMail,
  IconPhone,
  IconPin,
  IconTwitter,
} from "./Icons";

const socialIcons = {
  Facebook: IconFacebook,
  Twitter: IconTwitter,
  LinkedIn: IconLinkedIn,
};

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-grid">
        <div className="footer-brand">
          <Image
            src="/tepa/identity-v4.png"
            alt={site.org}
            width={349}
            height={141}
            unoptimized
            className="footer-logo"
          />
          <p>
            Independent accreditation that helps training and education providers
            demonstrate quality with confidence.
          </p>
          <div className="footer-socials">
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
          <nav className="footer-links" aria-label="Footer navigation">
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
          <ul className="footer-contact">
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

      <div className="site-shell footer-bottom">
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

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

type FooterLink = { readonly label: string; readonly href: string };

/* The links default to /tepa's sections; another page built on this footer
   passes its own so no link points at a section that is not there. */
export function SiteFooter({
  links = nav,
  cta = { label: "Check eligibility", href: "#enquire" },
}: {
  links?: readonly FooterLink[];
  cta?: FooterLink;
} = {}) {
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
            {links.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href={cta.href}>{cta.label}</a>
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

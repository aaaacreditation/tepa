import Image from "next/image";
import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconMail,
  IconPhone,
  IconPin,
  IconTwitter,
} from "../icons";
import { nav, site } from "../content";

const socialIcons = {
  LinkedIn: IconLinkedIn,
  Twitter: IconTwitter,
  Facebook: IconFacebook,
  Instagram: IconInstagram,
};

export function SiteFooter() {
  return (
    <footer className="cl-foot">
      <div className="cl-wrap cl-foot-grid">
        <div className="cl-foot-brand">
          <Image
            src="/healthcare/aaa-logo.png"
            alt={site.org}
            width={595}
            height={200}
            unoptimized
          />
          <p>
            Independent, international accreditation that builds trust and confidence
            in clinical quality, patient safety, and professional practice.
          </p>
          <div className="cl-foot-socials">
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
          <nav className="cl-foot-links" aria-label="Footer navigation">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href="#consultation">Book a consultation</a>
          </nav>
        </div>

        <div>
          <h2>Contact</h2>
          <ul className="cl-foot-contact">
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

      <div className="cl-wrap cl-foot-bottom">
        <p>
          © {new Date().getFullYear()} {site.org}. All rights reserved.
        </p>
        <a href={site.clinicProgramme} target="_blank" rel="noopener noreferrer">
          aaa-accreditation.org
        </a>
      </div>
    </footer>
  );
}

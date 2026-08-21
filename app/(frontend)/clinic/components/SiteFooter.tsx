import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconTwitter,
} from "../../components/Icons";
import { site } from "../content";

const socialIcons = {
  LinkedIn: IconLinkedIn,
  Twitter: IconTwitter,
  Facebook: IconFacebook,
  Instagram: IconInstagram,
};

export function SiteFooter() {
  return (
    <footer className="cl-foot">
      <div className="cl-wrap cl-foot-row">
        <div>
          {site.org} · {site.address[0]}, {site.address[1]}
        </div>

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

        <div>
          <a href={site.clinicProgramme}>Clinic accreditation</a>
          {" · "}
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </div>
      </div>
    </footer>
  );
}

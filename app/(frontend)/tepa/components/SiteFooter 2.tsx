import Image from "next/image";
import { nav, site } from "../content";
import { IconFacebook, IconLinkedIn, IconMail, IconPhone, IconPin, IconTwitter } from "./Icons";

const socialIcons = {
  Facebook: IconFacebook,
  Twitter: IconTwitter,
  LinkedIn: IconLinkedIn,
};

export function SiteFooter() {
  return (
    <footer className="relative bg-navy-950 pt-20 text-navy-200/70">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-12 pb-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Image
              src="/tepa/aaa-logo-light.png"
              alt={site.org}
              width={595}
              height={200}
              className="h-11 w-auto"
            />
            <p className="display mt-8 max-w-sm text-[1.6rem] leading-tight text-white/90">
              Get the latest accreditation news as it happens.
            </p>
            <a
              href={site.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-light mt-7 !px-6 !py-3 !text-sm"
            >
              Book a Free Consultation
            </a>
          </div>

          <div className="lg:col-span-4">
            <h2 className="eyebrow text-gold-300">Contact</h2>
            <ul className="mt-6 space-y-4 text-[0.9375rem]">
              <li className="flex items-start gap-3">
                <IconPin className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0 text-gold-400/80" />
                <span className="leading-relaxed">
                  {site.address[0]}
                  <br />
                  {site.address[1]}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <IconPhone className="h-[1.15rem] w-[1.15rem] shrink-0 text-gold-400/80" />
                <a href={site.phoneHref} className="transition-colors hover:text-white">
                  {site.phoneLabel}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <IconMail className="h-[1.15rem] w-[1.15rem] shrink-0 text-gold-400/80" />
                <a href={`mailto:${site.email}`} className="transition-colors hover:text-white">
                  {site.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="eyebrow text-gold-300">On This Page</h2>
            <ul className="mt-6 space-y-3 text-[0.9375rem]">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <h2 className="eyebrow mt-9 text-gold-300">Follow Us</h2>
            <ul className="mt-5 flex items-center gap-3">
              {site.social.map((channel) => {
                const Icon = socialIcons[channel.name as keyof typeof socialIcons];
                return (
                  <li key={channel.name}>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={channel.name}
                      className="grid h-10 w-10 place-items-center rounded-full border border-white/12 text-navy-200/75 transition-all duration-300 hover:border-gold-400/60 hover:bg-white/5 hover:text-white"
                    >
                      <Icon className="h-[1.05rem] w-[1.05rem]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="hairline-gold" />

        {/* Extra room on phones so the sticky booking bar never covers this row. */}
        <div className="flex flex-col gap-3 pb-24 pt-7 text-xs sm:flex-row sm:items-center sm:justify-between sm:pb-7">
          <p>
            © {new Date().getFullYear()} {site.org}. All rights reserved.
          </p>
          <a
            href={site.website}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            aaa-accreditation.org
          </a>
        </div>
      </div>
    </footer>
  );
}

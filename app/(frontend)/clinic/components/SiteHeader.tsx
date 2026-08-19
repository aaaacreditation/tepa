import Image from "next/image";
import { nav, site } from "../content";

/* Every call to action on this page lands on a consultation form, so the
   masthead carries section anchors and one gold button rather than a booking
   link out to a third party. */
export function SiteHeader() {
  return (
    <header className="cl-head">
      <div className="cl-wrap cl-head-row">
        <a className="cl-brand" href="#top" aria-label={`${site.org} — ${site.programme}`}>
          <Image
            src="/healthcare/aaa-logo.png"
            alt={site.org}
            width={595}
            height={200}
            preload
            unoptimized
          />
        </a>

        <nav className="cl-nav" aria-label="Page sections">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="cl-head-cta" href="#consultation">
          Book a Free Consultation
        </a>
      </div>
    </header>
  );
}

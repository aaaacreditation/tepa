import Image from "next/image";
import { nav, site } from "../content";

/* Every call to action on this page lands on the enquiry form, so the
   masthead carries anchors and one button rather than a booking link. */
export function SiteHeader() {
  return (
    <header className="hc-masthead">
      <div className="hc-shell hc-masthead-inner">
        <a href="#top" className="hc-brand" aria-label={`${site.org} — ${site.programme}`}>
          <Image
            src="/healthcare/aaa-logo.png"
            alt={site.org}
            width={595}
            height={200}
            priority
            unoptimized
          />
        </a>

        <nav className="hc-nav" aria-label="Page sections">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a href="#enquire" className="hc-masthead-cta">
          Apply for Accreditation
        </a>
      </div>
    </header>
  );
}

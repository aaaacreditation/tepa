import Image from "next/image";
import { nav, site } from "../content";

/* Sits over the navy hero, so the white-lettered logo. Every "apply" on the
   page lands on the application form, so the masthead carries section
   anchors and one button. */
export function SiteHeader() {
  return (
    <header className="sme-masthead">
      <div className="container sme-masthead-inner">
        <a href="#top" className="sme-brand" aria-label={`${site.org} — ${site.programme}`}>
          <Image src="/sme/aaa-logo-white.png" alt={site.org} width={349} height={141} preload unoptimized />
        </a>

        <nav className="sme-nav" aria-label="Page sections">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a href="#enquire" className="smex-btn smex-btn-gold sm sme-masthead-cta">
          Apply for Accreditation
        </a>
      </div>
    </header>
  );
}

import Image from "next/image";
import { site } from "../content";

/* Just the logo, centred, over the navy hero (client, Oct 23 2026). The page
   has one thing to do and the form sits right under it, so the masthead
   carries no section links or button; on phones the sticky bar is the way
   back to the form. */
export function SiteHeader() {
  return (
    <header className="sme-masthead">
      <div className="container sme-masthead-inner">
        <a href="#top" className="sme-brand" aria-label={`${site.org} — ${site.programme}`}>
          <Image src="/sme/aaa-logo-white.png" alt={site.org} width={349} height={141} preload unoptimized />
        </a>
      </div>
    </header>
  );
}

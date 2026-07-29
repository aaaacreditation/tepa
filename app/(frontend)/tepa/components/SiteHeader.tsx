import Image from "next/image";
import { site } from "../content";

export function SiteHeader() {
  return (
    <header className="masthead">
      <div className="site-shell masthead-inner">
        <a href="#top" className="brand-link" aria-label={site.org}>
          <Image
            src="/tepa/identity-v4.png"
            alt={site.org}
            width={349}
            height={141}
            priority
            unoptimized
            className="brand-logo brand-logo--light"
          />
        </a>
      </div>
    </header>
  );
}

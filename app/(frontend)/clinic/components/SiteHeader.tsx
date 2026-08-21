import Image from "next/image";
import { site } from "../content";

export function SiteHeader() {
  return (
    <header className="cl-head">
      <div className="cl-wrap cl-head-row">
        <a
          className="cl-brand"
          href="#top"
          aria-label={`${site.org} — ${site.programme}`}
        >
          <Image
            src="/healthcare/aaa-logo.png"
            alt={site.org}
            width={595}
            height={200}
            priority
            unoptimized
          />
        </a>

        <div className="cl-head-actions">
          <a className="cl-btn cl-btn--outline" href={site.clinicProgramme}>
            See the programme
          </a>
          <a className="cl-btn cl-btn--navy" href="#quiz">
            Start assessment
          </a>
        </div>
      </div>
    </header>
  );
}

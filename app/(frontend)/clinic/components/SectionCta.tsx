import { IconArrow } from "../icons";

type SectionCtaProps = {
  label: string;
  href: string;
};

export function SectionCta({ label, href }: SectionCtaProps) {
  return (
    <div className="cl-cta-row reveal">
      <a className="cl-btn cl-btn--red" href={href}>
        {label}
        <IconArrow className="cl-ico" />
      </a>
    </div>
  );
}

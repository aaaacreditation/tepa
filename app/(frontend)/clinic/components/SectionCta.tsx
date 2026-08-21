import { IconArrow } from "../icons";

type SectionCtaProps = {
  /* The line that earns the button. It is written per section rather than
     shared, so the band reads as the next step out of what was just read. */
  note: string;
  label: string;
  href: string;
  /* `navy` is the story section, where a tinted panel would read as a stain
     on the ground rather than a band sitting on it. */
  tone?: "light" | "navy";
};

export function SectionCta({ note, label, href, tone = "light" }: SectionCtaProps) {
  return (
    <div className={`cl-cta-row reveal${tone === "navy" ? " cl-cta-row--navy" : ""}`}>
      <p>{note}</p>
      <a className="cl-btn cl-btn--red" href={href}>
        {label}
        <IconArrow className="cl-ico" />
      </a>
    </div>
  );
}

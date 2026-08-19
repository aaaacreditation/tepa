import Image from "next/image";
import { gallery } from "../content";

type GalleryImage = (typeof gallery.images)[number];

/* Two rows drifting in opposite directions. Each track holds the set twice so
   translating it by exactly half its width lands back on the opening frame,
   which is what makes the loop seamless. The second copy is decorative and is
   hidden from assistive technology. */
function Row({
  images,
  direction,
}: {
  images: readonly GalleryImage[];
  direction: "left" | "right";
}) {
  return (
    <div className="hc-marquee-row">
      <ul className={`hc-marquee-track hc-marquee-track--${direction}`}>
        {[0, 1].map((copy) =>
          images.map((image) => (
            <li
              className="hc-marquee-item"
              key={`${copy}-${image.src}`}
              aria-hidden={copy === 1 ? "true" : undefined}
            >
              <Image
                src={image.src}
                alt={copy === 1 ? "" : image.alt}
                width={316}
                height={208}
                sizes="316px"
                loading="lazy"
              />
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

export function GalleryMarquee() {
  const half = Math.ceil(gallery.images.length / 2);

  return (
    <div className="hc-marquee">
      <Row images={gallery.images.slice(0, half)} direction="left" />
      <Row images={gallery.images.slice(half)} direction="right" />
    </div>
  );
}

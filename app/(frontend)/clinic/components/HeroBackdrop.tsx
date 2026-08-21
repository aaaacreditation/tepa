/* The animated hero backdrop, kept out of page.tsx so the page reads as
   structure rather than as a pile of decorative divs.

   Four layers, all of them inert to assistive technology and to the pointer:
     1. mesh   — three soft blobs drifting on long, unequal loops
     2. sheen  — a conic highlight turning once every 70s
     3. grid   — a measurement grid panning by exactly one cell
     4. pulse  — an ECG trace drawing itself across the hero

   Every animation is a transform, an opacity, or a stroke-dashoffset, so none
   of them cost a layout pass. */
const TRACE =
  "M0 95 H240 l22 0 8 -34 12 68 10 -52 9 34 7 -16 h30 H620 l24 0 9 -40 13 78 11 -60 10 40 8 -18 h34 H1080 l20 0 8 -28 11 56 9 -44 8 28 6 -12 h28 H1440";

export function HeroBackdrop() {
  return (
    <>
      <div className="cl-mesh" aria-hidden="true">
        <span className="cl-blob cl-blob--1" />
        <span className="cl-blob cl-blob--2" />
        <span className="cl-blob cl-blob--3" />
      </div>

      <div className="cl-sheen" aria-hidden="true" />
      <div className="cl-grid" aria-hidden="true" />

      <svg
        className="cl-pulse"
        viewBox="0 0 1440 190"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Only the outermost few percent fade. A gradient that peaks in the
              middle would leave the travelling dash invisible for most of its
              journey, because the stroke is painted in the SVG's coordinate
              space, not the segment's. */}
          <linearGradient id="clPulseStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(143,205,234,0)" />
            <stop offset="0.07" stopColor="rgba(143,205,234,0.95)" />
            <stop offset="0.93" stopColor="rgba(214,240,252,0.95)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* A flat baseline with three beats. The dim copy is always there so
            the hero never shows an empty gap; the bright copy is the pulse
            travelling along it. */}
        <path className="cl-pulse-base" d={TRACE} vectorEffect="non-scaling-stroke" />
        <path className="cl-pulse-run" d={TRACE} vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="cl-hero-fade" aria-hidden="true" />
    </>
  );
}

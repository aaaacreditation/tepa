/* The wave field under the hero.

   One path, drawn three times. It holds two identical periods across its
   2880-unit viewBox, so sliding a layer exactly half its own width lands the
   second period where the first one was and the loop has no seam in it — no
   JavaScript, no canvas, and nothing to measure at runtime.

   The three layers differ only in height, tone, speed and direction. That is
   what reads as depth: near-still white at the back, gold crossing the other
   way in the middle, a faster blue in front. Each one is a single composited
   transform, so the whole field costs about as much as one moving div.

   The curve is continuous at every joint — each control point mirrors the one
   before it across the anchor — which is why it reads as water rather than as
   a row of humps. Editing the numbers without preserving that will show. */
const WAVE =
  "M0,160 C240,90 480,90 720,160 C960,230 1200,230 1440,160 " +
  "C1680,90 1920,90 2160,160 C2400,230 2640,230 2880,160 " +
  "L2880,320 L0,320 Z";

const LAYERS = ["a", "b", "c"] as const;

export function HeroWaves() {
  return (
    <div className="cl-waves" aria-hidden="true">
      {LAYERS.map((layer) => (
        <svg
          className={`cl-wave cl-wave--${layer}`}
          key={layer}
          viewBox="0 0 2880 320"
          preserveAspectRatio="none"
          focusable="false"
        >
          <path d={WAVE} />
        </svg>
      ))}
    </div>
  );
}

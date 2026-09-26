import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* This version ships `qualities: [75]` and coerces any other `quality`
       prop to the nearest allowed value — silently, with no build warning. The
       clinic hero is the one photograph on any of these pages shown at full
       viewport width, and at 75 the flat wall behind the team bands rather
       than graduates, so 92 has to be declared here to survive. Everything
       else on the site is unaffected: an image that sets no `quality` still
       gets 75. 50 is for the decorative hero background on the TEPA pages,
       drawn at 36% opacity. */
    qualities: [50, 75, 92],
    /* AVIF first, WebP for browsers without it. AVIF is typically a fifth to
       a third smaller at the same look, which is most of what a phone on a
       slow connection waits for on these pages. Encoding it costs the server
       more the first time; the result is cached, so every later visitor gets
       the saved copy. */
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

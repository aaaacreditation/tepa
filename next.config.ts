import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* This version ships `qualities: [75]` and coerces any other `quality`
       prop to the nearest allowed value — silently, with no build warning. The
       clinic hero is the one photograph on any of these pages shown at full
       viewport width, and at 75 the flat wall behind the team bands rather
       than graduates, so 92 has to be declared here to survive. Everything
       else on the site is unaffected: an image that sets no `quality` still
       gets 75. */
    qualities: [75, 92],
  },
};

export default nextConfig;

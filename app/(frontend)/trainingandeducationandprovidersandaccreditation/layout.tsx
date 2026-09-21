import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { AttributionCapture } from "../components/AttributionCapture";
import { GoogleTag } from "../components/GoogleTag";
import { MetaPixel } from "../components/MetaPixel";
import { MetaViewContent } from "../components/MetaViewContent";
import "../tepa/tepa.css";
import "./fast-track.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

/* Same shell as /tepa: same fonts, same stylesheet, same tracking, so the
   only difference a visitor or a report can see between the two pages is the
   copy and the form. */
export default function FastTrackLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`tepa flex-1 ${fraunces.variable} ${jakarta.variable}`}>
      <AttributionCapture />
      <GoogleTag />
      <MetaPixel />
      <MetaViewContent contentCategory="tepa" />
      {children}
    </div>
  );
}

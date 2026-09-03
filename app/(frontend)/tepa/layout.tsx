import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { AttributionCapture } from "../components/AttributionCapture";
import { CalendlyTracking } from "./components/CalendlyTracking";
import { GoogleTag } from "../components/GoogleTag";
import { MetaPixel } from "../components/MetaPixel";
import { MetaViewContent } from "../components/MetaViewContent";
import "./tepa.css";

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

export default function TepaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`tepa flex-1 ${fraunces.variable} ${jakarta.variable}`}>
      {/* None of these render anything. Attribution capture has to run on
          every visit so the click id is stored before the visitor navigates
          away. */}
      <AttributionCapture />
      <GoogleTag />
      <MetaPixel />
      <MetaViewContent contentCategory="tepa" />
      <CalendlyTracking />
      {children}
    </div>
  );
}

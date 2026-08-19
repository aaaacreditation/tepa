import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { AttributionCapture } from "../components/AttributionCapture";
import { GoogleTag } from "../components/GoogleTag";
import { RevealController } from "../components/RevealController";
import "./healthcare.css";

/* The body face is shared with /tepa so the two campaigns read as one
   organization; the display face is not, so they do not read as one page. */
const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export default function HealthcareLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`hc flex-1 ${newsreader.variable} ${jakarta.variable}`}>
      {/* Both render nothing. Attribution capture has to run on every visit so
          the click id is stored before the visitor navigates away. */}
      <AttributionCapture />
      <GoogleTag />
      <RevealController scope=".hc" />
      {children}
    </div>
  );
}

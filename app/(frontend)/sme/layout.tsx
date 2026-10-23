import { Poppins } from "next/font/google";
import { AttributionCapture } from "../components/AttributionCapture";
import { GoogleTag } from "../components/GoogleTag";
import { MetaPixel } from "../components/MetaPixel";
import { MetaViewContent } from "../components/MetaViewContent";
import { OpenAIPixel } from "../components/OpenAIPixel";
import { RevealController } from "../components/RevealController";
import "./sme.css";

/* Poppins, as on the AAA website the SMEs page was ported from (and as on
   /healthcare and /clinic here). Four weights: 400 body, 500 labels, 600
   headings, 700 buttons and numerals. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export default function SmeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`smex flex-1 ${poppins.variable}`}>
      {/* None of these render anything. Attribution capture has to run on
          every visit so the click id is stored before the visitor navigates
          away. */}
      <AttributionCapture />
      <GoogleTag />
      <MetaPixel />
      <OpenAIPixel />
      <MetaViewContent contentCategory="sme" />
      <RevealController scope=".smex" />
      {children}
    </div>
  );
}

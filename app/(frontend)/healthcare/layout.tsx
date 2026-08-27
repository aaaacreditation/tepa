import { Poppins } from "next/font/google";
import { AttributionCapture } from "../components/AttributionCapture";
import { GoogleTag } from "../components/GoogleTag";
import { RevealController } from "../components/RevealController";
import "./healthcare.css";

/* Poppins carries the whole page, the same way it does on /clinic — the two
   healthcare pages now share one design system and should read as one
   organisation. A geometric sans with a tall x-height holds a 3rem hero and
   a 0.9rem card body from one family, so hierarchy is carried by weight and
   size rather than by a second typeface.

   Poppins has no variable cut on Google Fonts, so the weights are listed
   explicitly. Four is the ceiling worth paying for: 400 body, 500 for the
   labels and eyebrows, 600 headings, 700 buttons and numerals. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export default function HealthcareLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`hc flex-1 ${poppins.variable}`}>
      {/* Both render nothing. Attribution capture has to run on every visit so
          the click id is stored before the visitor navigates away. */}
      <AttributionCapture />
      <GoogleTag />
      <RevealController scope=".hc" />
      {children}
    </div>
  );
}

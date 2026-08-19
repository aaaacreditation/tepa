import { Poppins } from "next/font/google";
import { AttributionCapture } from "../components/AttributionCapture";
import { GoogleTag } from "../components/GoogleTag";
import { RevealController } from "../components/RevealController";
import "./clinic.css";

/* Poppins carries the whole page — headlines and body both. It is a geometric
   sans with a tall x-height, so it stays legible at the 15px card body sizes
   while the 600 weight is still authoritative enough at 3rem to hold a hero.

   Poppins has no variable cut on Google Fonts, so the weights are listed
   explicitly. Four is the ceiling worth paying for: 400 body, 500 for the
   labels and eyebrows, 600 headings, 700 buttons and numerals. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export default function ClinicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`cl flex-1 ${poppins.variable}`}>
      {/* The first two render nothing. Attribution capture has to run on every
          visit so the click id is stored before the visitor navigates away. */}
      <AttributionCapture />
      <GoogleTag />
      <RevealController scope=".cl" />
      {children}
    </div>
  );
}

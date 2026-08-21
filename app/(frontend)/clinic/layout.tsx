import { Inter, Poppins } from "next/font/google";
import { AttributionCapture } from "../components/AttributionCapture";
import { GoogleTag } from "../components/GoogleTag";
import "./clinic.css";

/* Poppins and Inter are the pair the readiness-assessment brief was designed
   in. Keeping them means /clinic reads as its own campaign rather than as a
   recolour of /healthcare. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function ClinicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`cl flex-1 ${poppins.variable} ${inter.variable}`}>
      {/* Both render nothing. Attribution capture has to run on every visit so
          the click id is stored before the visitor navigates away. */}
      <AttributionCapture />
      <GoogleTag />
      {children}
    </div>
  );
}

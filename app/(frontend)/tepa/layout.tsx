import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
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
      {children}
    </div>
  );
}

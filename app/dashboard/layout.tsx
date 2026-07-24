import type { Metadata } from "next";
import { fraunces, jakarta } from "./fonts";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Lead Desk",
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`dash flex-1 ${fraunces.variable} ${jakarta.variable}`}>
      {children}
    </div>
  );
}

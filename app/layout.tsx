import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://campaign.aaa-accreditation.org",
  ),
  title: {
    default: "American Accreditation Association",
    template: "%s | American Accreditation Association",
  },
  description:
    "Accreditation campaigns and landing pages for the American Accreditation Association.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

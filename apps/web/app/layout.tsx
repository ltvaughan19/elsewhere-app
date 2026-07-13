import type { Metadata } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
import { LayoutChrome } from "@/components/layout-chrome";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Elsewhere — One calm path abroad",
  description:
    "Elsewhere turns pressure to move abroad into a clear path: structure, verified research avenues, and a next step. General planning only — not legal advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">
        <LayoutChrome>{children}</LayoutChrome>
      </body>
    </html>
  );
}

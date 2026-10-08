import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Enhancements } from "@/components/Enhancements";
import { siteOrigin, siteDescription } from "@/lib/site";
import "./globals.css";
import "./brand.css";
import "./home.css";
import "./personality.css";
import "./crossroads.css";
const sans = localFont({
  src: "../public/fonts/manrope.woff2",
  variable: "--font-sans",
  weight: "400 800",
  display: "swap",
});
const mono = localFont({
  src: "../public/fonts/mono.woff2",
  variable: "--font-mono",
  weight: "400",
  display: "swap",
  preload: false,
});
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "Playground | Find Out Before You Launch",
    template: "%s | Playground",
  },
  description: siteDescription,
  openGraph: {
    title: "Playground | Find Out Before You Launch",
    description: siteDescription,
    type: "website",
    siteName: "Playground",
    locale: "en_US",
    images: [{ url: "/brand/playground-landscape.png", width: 1672, height: 941, alt: "Playground — find out before you launch" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Playground | Find Out Before You Launch",
    description: siteDescription,
    images: ["/brand/playground-landscape.png"],
  },
  icons: {
    icon: [
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/brand/icon-180.png",
  },
};
export const viewport: Viewport = { themeColor: "#FBF7EB" };
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Enhancements />
      </body>
    </html>
  );
}

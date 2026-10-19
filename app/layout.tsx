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
import "./waitlist.css";
import "./process.css";
import "./why.css";
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
    default: "Playground | Find Your Pilot Customers",
    template: "%s | Playground",
  },
  description: siteDescription,
  openGraph: {
    title: "Playground | Find Your Pilot Customers",
    description: siteDescription,
    type: "website",
    siteName: "Playground",
    locale: "en_US",
    images: [{ url: "/brand/playground-landscape.png", width: 1672, height: 941, alt: "Playground — find your pilot customers and test before you launch" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Playground | Find Your Pilot Customers",
    description: siteDescription,
    images: ["/brand/playground-landscape.png"],
  },
  icons: {
    icon: [
      { url: "/brand/icon-16.png?v=mono-rounded", sizes: "16x16", type: "image/png" },
      { url: "/brand/icon-32.png?v=mono-rounded", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-48.png?v=mono-rounded", sizes: "48x48", type: "image/png" },
    ],
    apple: "/brand/icon-180.png?v=mono-rounded",
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

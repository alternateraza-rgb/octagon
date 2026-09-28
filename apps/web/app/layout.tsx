import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

// Canonicals are set per page: a canonical here would be inherited by every page and point them all at "/".
// The share image comes from app/opengraph-image.png.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Octacore — Build it. Ship it. Sell it.", template: "%s · Octacore" },
  description:
    "Build beautiful websites by describing them, host them instantly, and sell them to businesses — all in one place.",
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

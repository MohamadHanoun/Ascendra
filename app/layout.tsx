import type { Metadata } from "next";
import { getLocale, getTextDirection } from "@/lib/i18n";
import "./globals.css";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.ascendrahub.com"
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ascendra",
    template: "%s | Ascendra",
  },
  description:
    "Ascendra is a competitive gaming platform for teams, tournaments, rankings, and organized community events.",
  icons: {
    icon: "/images/brand/favicon.ico",
    shortcut: "/images/brand/favicon.ico",
    apple: "/images/brand/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Ascendra",
    title: "Ascendra",
    description:
      "A competitive gaming platform for teams, tournaments, rankings, and organized community events.",
    images: [
      {
        url: "/images/brand/og-cover.png",
        width: 1200,
        height: 630,
        alt: "Ascendra",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ascendra",
    description:
      "A competitive gaming platform for teams, tournaments, rankings, and organized community events.",
    images: ["/images/brand/og-cover.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={getTextDirection(locale)} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

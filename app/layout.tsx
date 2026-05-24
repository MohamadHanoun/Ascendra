import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";

import { getTextDirection, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.ascendrahub.com"
).replace(/\/$/, "");

type LayoutMetadataMessages = {
  description: string;
  openGraphDescription: string;
  twitterDescription: string;
};

const metadataMessages: Record<Locale, LayoutMetadataMessages> = {
  en: {
    description:
      "Ascendra is a competitive gaming platform for teams, tournaments, rankings, and organized community events.",
    openGraphDescription:
      "A competitive gaming platform for teams, tournaments, rankings, and organized community events.",
    twitterDescription:
      "A competitive gaming platform for teams, tournaments, rankings, and organized community events.",
  },

  ar: {
    description:
      "Ascendra منصة ألعاب تنافسية للفرق والبطولات ولوحة المتصدرين والفعاليات المجتمعية المنظمة.",
    openGraphDescription:
      "منصة ألعاب تنافسية للفرق والبطولات ولوحة المتصدرين والفعاليات المجتمعية المنظمة.",
    twitterDescription:
      "منصة ألعاب تنافسية للفرق والبطولات ولوحة المتصدرين والفعاليات المجتمعية المنظمة.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = metadataMessages[locale];

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Ascendra",
      template: "%s | Ascendra",
    },
    description: messages.description,
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
      description: messages.openGraphDescription,
      images: [
        {
          url: "/images/brand/og-cover.png",
          width: 1200,
          height: 630,
          alt: "Ascendra",
        },
      ],
      locale: locale === "ar" ? "ar" : "en",
    },
    twitter: {
      card: "summary_large_image",
      title: "Ascendra",
      description: messages.twitterDescription,
      images: ["/images/brand/og-cover.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={getTextDirection(locale)}
      suppressHydrationWarning
      className={`${barlowCondensed.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

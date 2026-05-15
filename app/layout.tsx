import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RTN | The Noobs of Temple & Rift",
    template: "%s | RTN",
  },
  description:
    "The Noobs of Temple & Rift is a gaming community for players, tournaments, teamwork, and shared moments.",
    icons: {
  icon: "/favicon.svg",
  shortcut: "/favicon.svg",
},
openGraph: {
  title: "RTN | The Noobs of Temple & Rift",
  description:
    "A gaming community for players, tournaments, teamwork, and shared moments.",
  images: ["/logo-full.svg"],
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RTN | The Noobs of Temple & Rift",
    template: "%s | RTN",
  },
  description:
    "The Noobs of Temple & Rift is a gaming community for players, tournaments, teamwork, and shared moments.",
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
import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ascendra-ebon.vercel.app"
).replace(/\/$/, "");

const staticRoutes = [
  "",
  "/tournaments",
  "/leaderboard",
  "/announcements",
  "/community",
  "/about",
  "/rules",
  "/roles",
  "/staff",
  "/stats",
  "/login",
  "/terms",
  "/privacy",
  "/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  const tournamentPages: MetadataRoute.Sitemap = tournaments.map(
    (tournament) => ({
      url: `${siteUrl}/tournaments/${tournament.id}`,
      lastModified: tournament.updatedAt || tournament.createdAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  return [...staticPages, ...tournamentPages];
}

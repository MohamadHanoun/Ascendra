import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServerStats from "@/components/ServerStats";
import Features from "@/components/Features";
import RulesPreview from "@/components/RulesPreview";
import HomeCTA from "@/components/HomeCTA";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getHomeData() {
  const [usersCount, tournamentsCount, rolesCount, rules] = await Promise.all([
    prisma.user.count(),
    prisma.tournament.count(),
    prisma.role.count({
      where: {
        isActive: true,
      },
    }),
    prisma.rule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
      take: 4,
    }),
  ]);

  return {
    stats: [
      { label: "XP Users", value: String(usersCount) },
      { label: "Tournaments", value: String(tournamentsCount) },
      { label: "Roles", value: String(rolesCount) },
      { label: "Rules", value: String(rules.length) },
    ],
    rules: rules.map((rule) => rule.text),
  };
}

export default async function Home() {
  const homeData = await getHomeData();

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />
      <Hero />
      <ServerStats stats={homeData.stats} />
      <Features />
      <RulesPreview rules={homeData.rules} />
      <HomeCTA />
      <Footer />
    </main>
  );
}
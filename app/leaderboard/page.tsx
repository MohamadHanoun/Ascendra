import Footer from "@/components/Footer";
import LeaderboardTable from "@/components/LeaderboardTable";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import XpSystemPreview from "@/components/XpSystemPreview";
import type { LeaderboardUser } from "@/data/leaderboard";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "View RTN community rankings, XP progress, and leaderboard standings.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getLeaderboard(): Promise<LeaderboardUser[]> {
  const users = await prisma.user.findMany({
    orderBy: [
      {
        xp: "desc",
      },
      {
        level: "desc",
      },
    ],
  });

  return users.map((user, index) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    level: user.level,
    xp: user.xp,
    rank: index + 1,
  }));
}

export default async function LeaderboardPage() {
  const leaderboardUsers = await getLeaderboard();

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Leaderboard"
        title="Levels, XP, and the most active players."
        description="This page is now connected to the database and prepared for the future RTN XP system, Discord bot, and live community ranking."
      />

      <section className="mx-auto max-w-7xl px-6 pb-12">

        {leaderboardUsers.length > 0 ? (
          <LeaderboardTable users={leaderboardUsers} />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">No XP data yet</h2>
            <p className="text-gray-300">
              Users will appear here later when Discord login and the RTN bot XP
              system are connected.
            </p>
          </div>
        )}
      </section>

      <XpSystemPreview />

      <Footer />
    </main>
  );
}
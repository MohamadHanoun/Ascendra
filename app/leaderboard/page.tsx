import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import LeaderboardTable from "@/components/LeaderboardTable";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import type { LeaderboardUser } from "@/data/leaderboard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "View RTN tournament points and player standings.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getLeaderboard(): Promise<LeaderboardUser[]> {
  const users = await prisma.user.findMany({
    include: {
      teamMemberships: {
        include: {
          team: {
            include: {
              registrations: {
                where: {
                  status: "approved",
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const leaderboardUsers = users
    .map((user) => {
      const approvedRegistrations = user.teamMemberships.reduce(
        (total, membership) => total + membership.team.registrations.length,
        0,
      );

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        approvedRegistrations,
        tournamentPoints: approvedRegistrations * 10,
      };
    })
    .sort((a, b) => {
      if (b.tournamentPoints !== a.tournamentPoints) {
        return b.tournamentPoints - a.tournamentPoints;
      }

      return b.approvedRegistrations - a.approvedRegistrations;
    });

  return leaderboardUsers.map((user, index) => ({
    ...user,
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
        title="Tournament points standings."
        description="View RTN players ranked by tournament points earned from approved tournament participation."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        {leaderboardUsers.length > 0 ? (
          <LeaderboardTable users={leaderboardUsers} />
        ) : (
          <EmptyState
            title="No tournament points yet"
            description="Player rankings will appear here when tournament activity is available."
            actionLabel="View tournaments"
            actionHref="/tournaments"
          />
        )}
      </section>

      <Footer />
    </main>
  );
}

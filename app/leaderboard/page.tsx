import type { Metadata } from "next";
import Link from "next/link";
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

type LeaderboardPageProps = {
  searchParams: Promise<{
    game?: string;
  }>;
};

const games = ["Overall", "Valorant", "League of Legends", "CS2", "Dota2"];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function GameFilter({ selectedGame }: { selectedGame: string }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      {games.map((game) => {
        const isActive = selectedGame === game;
        const href =
          game === "Overall"
            ? "/leaderboard"
            : `/leaderboard?game=${encodeURIComponent(game)}`;

        return (
          <Link
            key={game}
            href={href}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              isActive
                ? "bg-indigo-500 text-white"
                : "border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {game}
          </Link>
        );
      })}
    </div>
  );
}

async function getLeaderboard(
  selectedGame: string,
): Promise<LeaderboardUser[]> {
  const users = await prisma.user.findMany({
    include: {
      teamMemberships: {
        include: {
          team: {
            include: {
              results: {
                select: {
                  id: true,
                  points: true,
                  placement: true,
                  tournament: {
                    select: {
                      game: true,
                    },
                  },
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
      const userResults = user.teamMemberships.flatMap((membership) =>
        membership.team.results.filter((result) => {
          if (selectedGame === "Overall") {
            return true;
          }

          return result.tournament.game === selectedGame;
        }),
      );

      const tournamentResults = userResults.length;

      const tournamentPoints = userResults.reduce(
        (total, result) => total + result.points,
        0,
      );

      const bestPlacement =
        userResults.length > 0
          ? Math.min(...userResults.map((result) => result.placement))
          : null;

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        tournamentResults,
        tournamentPoints,
        bestPlacement,
      };
    })
    .filter((user) => user.tournamentPoints > 0)
    .sort((a, b) => {
      if (b.tournamentPoints !== a.tournamentPoints) {
        return b.tournamentPoints - a.tournamentPoints;
      }

      if (b.tournamentResults !== a.tournamentResults) {
        return b.tournamentResults - a.tournamentResults;
      }

      return (a.bestPlacement || 999) - (b.bestPlacement || 999);
    });

  return leaderboardUsers.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const params = await searchParams;
  const selectedGame = games.includes(params.game || "")
    ? params.game || "Overall"
    : "Overall";

  const leaderboardUsers = await getLeaderboard(selectedGame);

  const totalPoints = leaderboardUsers.reduce(
    (total, user) => total + user.tournamentPoints,
    0,
  );

  const totalResults = leaderboardUsers.reduce(
    (total, user) => total + user.tournamentResults,
    0,
  );

  const topPlayer = leaderboardUsers[0]?.username || "-";

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Leaderboard"
        title="Tournament points standings."
        description="View RTN players ranked by official tournament points from saved tournament results."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6">
          <GameFilter selectedGame={selectedGame} />

          {leaderboardUsers.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Ranked players"
                  value={leaderboardUsers.length}
                />
                <StatCard label="Total points" value={totalPoints} />
                <StatCard label="Total results" value={totalResults} />
                <StatCard label="Top player" value={topPlayer} />
              </div>

              <LeaderboardTable users={leaderboardUsers} />
            </>
          ) : (
            <EmptyState
              title="No tournament points yet"
              description={
                selectedGame === "Overall"
                  ? "Player rankings will appear here when tournament results are added."
                  : `No tournament points have been awarded for ${selectedGame} yet.`
              }
              actionLabel="View tournaments"
              actionHref="/tournaments"
            />
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

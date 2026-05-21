import type { Metadata } from "next";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Stats | Ascendra",
  description: "Ascendra platform and tournament statistics.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Pill({
  children,
  tone = "violet",
}: {
  children: React.ReactNode;
  tone?: "green" | "violet" | "gray";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    gray: "border-white/10 bg-white/5 text-gray-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

async function getStatsData() {
  const [
    usersCount,
    teamsCount,
    tournamentsCount,
    tournamentResults,
    tournamentPoints,
    tournamentsByGame,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.tournament.count(),
    prisma.tournamentResult.findMany({
      select: {
        points: true,
        tournament: {
          select: {
            game: true,
          },
        },
      },
    }),
    prisma.tournamentResult.aggregate({
      _sum: {
        points: true,
      },
    }),
    prisma.tournament.groupBy({
      by: ["game"],
      _count: {
        id: true,
      },
    }),
  ]);

  const totalPoints = tournamentPoints._sum.points || 0;

  const activeGamesCount = games.filter((game) =>
    tournamentsByGame.some((item) => item.game === game && item._count.id > 0),
  ).length;

  const overviewStats = [
    { label: "Players", value: usersCount },
    { label: "Teams", value: teamsCount },
    { label: "Tournaments", value: tournamentsCount },
    { label: "Points", value: totalPoints },
    { label: "Games", value: activeGamesCount },
  ];

  const gameStats = games.map((game) => {
    const gameResults = tournamentResults.filter(
      (result) => result.tournament.game === game,
    );

    const points = gameResults.reduce(
      (total, result) => total + result.points,
      0,
    );

    const tournaments =
      tournamentsByGame.find((item) => item.game === game)?._count.id || 0;

    return {
      game,
      tournaments,
      results: gameResults.length,
      points,
    };
  });

  return {
    overviewStats,
    gameStats,
  };
}

export default async function StatsPage() {
  const { overviewStats, gameStats } = await getStatsData();

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/stats-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_44%,rgba(7,8,17,0.80)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Platform
            </p>

            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
              Stats
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              A quick overview of Ascendra activity.
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 pb-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                Overview
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
                Main numbers
              </h2>
            </div>

            <div className="grid gap-5 pt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {overviewStats.map((item) => (
                <Stat key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                Games
              </p>

              <h2 className="mt-1 text-xl font-black text-white">
                Game activity
              </h2>
            </div>

            <div className="divide-y divide-white/10">
              {gameStats.map((item) => (
                <article
                  key={item.game}
                  className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] md:grid-cols-[minmax(0,1fr)_120px_120px_120px] md:items-center"
                >
                  <div>
                    <p className="font-black text-white">{item.game}</p>

                    <p className="mt-1 text-sm text-gray-400">
                      Tournament activity for this game.
                    </p>
                  </div>

                  <Pill>{item.tournaments} tournaments</Pill>
                  <Pill tone="gray">{item.results} results</Pill>
                  <Pill tone="green">{item.points} pts</Pill>
                </article>
              ))}
            </div>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}

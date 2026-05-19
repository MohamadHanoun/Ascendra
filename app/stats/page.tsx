import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import StatsDetailCard from "@/components/StatsDetailCard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

function GameStatRow({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "points";
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
        variant === "points"
          ? "border-emerald-400/25 bg-emerald-500/10"
          : "border-white/10 bg-black/25"
      }`}
    >
      <p
        className={`text-xs font-black uppercase tracking-[0.14em] ${
          variant === "points" ? "text-emerald-300" : "text-gray-500"
        }`}
      >
        {label}
      </p>

      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}

function GameStatsCard({
  game,
  tournaments,
  results,
  points,
}: {
  game: string;
  tournaments: number;
  results: number;
  points: number;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 transition hover:bg-white/[0.06]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
        Game
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">{game}</h2>

      <div className="mt-5 grid gap-2">
        <GameStatRow label="Tournaments" value={tournaments} />
        <GameStatRow label="Results" value={results} />
        <GameStatRow label="Points" value={points} variant="points" />
      </div>
    </article>
  );
}

async function getStatsData() {
  const [
    rulesCount,
    rolesCount,
    staffCount,
    tournamentsCount,
    announcementsCount,
    usersCount,
    teamsCount,
    approvedRegistrationsCount,
    tournamentResults,
    tournamentPoints,
    tournamentsByGame,
  ] = await Promise.all([
    prisma.rule.count({ where: { isActive: true } }),
    prisma.role.count({ where: { isActive: true } }),
    prisma.staffMember.count({ where: { isActive: true } }),
    prisma.tournament.count(),
    prisma.announcement.count({ where: { published: true } }),
    prisma.user.count(),
    prisma.team.count(),
    prisma.tournamentRegistration.count({
      where: {
        status: "approved",
      },
    }),
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

  const gameStats = games.map((game) => {
    const gameResults = tournamentResults.filter(
      (result) => result.tournament.game === game,
    );

    const gamePoints = gameResults.reduce(
      (total, result) => total + result.points,
      0,
    );

    const gameTournamentCount =
      tournamentsByGame.find((item) => item.game === game)?._count.id || 0;

    return {
      game,
      tournaments: gameTournamentCount,
      results: gameResults.length,
      points: gamePoints,
    };
  });

  const overviewStats = [
    { title: "Players", value: String(usersCount) },
    { title: "Teams", value: String(teamsCount) },
    { title: "Tournaments", value: String(tournamentsCount) },
    { title: "Results", value: String(tournamentResults.length) },
    { title: "Points", value: String(tournamentPoints._sum.points || 0) },
    {
      title: "Approved registrations",
      value: String(approvedRegistrationsCount),
    },
    { title: "News", value: String(announcementsCount) },
    { title: "Rules", value: String(rulesCount) },
    { title: "Roles", value: String(rolesCount) },
    { title: "Staff", value: String(staffCount) },
  ];

  return {
    overviewStats,
    gameStats,
  };
}

export default async function StatsPage() {
  const { overviewStats, gameStats } = await getStatsData();

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-[1680px] px-6 py-14 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Platform
            </p>

            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-6xl">
              Stats
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
              Current platform numbers and game activity.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1680px] gap-10 px-6 py-10 lg:px-10 2xl:px-14">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
            <div className="hidden border-b border-white/10 bg-black/25 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500 md:grid md:grid-cols-[minmax(0,1fr)_120px]">
              <span>Metric</span>
              <span>Value</span>
            </div>

            <div className="divide-y divide-white/10">
              {overviewStats.map((item) => (
                <StatsDetailCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
                Game breakdown
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                Stats by game
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {gameStats.map((item) => (
                <GameStatsCard
                  key={item.game}
                  game={item.game}
                  tournaments={item.tournaments}
                  results={item.results}
                  points={item.points}
                />
              ))}
            </div>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}

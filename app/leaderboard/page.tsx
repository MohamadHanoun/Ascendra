import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import LeaderboardTable from "@/components/LeaderboardTable";
import Navbar from "@/components/Navbar";
import TeamLeaderboardTable from "@/components/TeamLeaderboardTable";
import type { LeaderboardTeam, LeaderboardUser } from "@/data/leaderboard";
import { prisma } from "@/lib/prisma";
import LeaderboardRealtime from "@/components/LeaderboardRealtime";

export const metadata: Metadata = {
  title: "Leaderboard | Ascendra",
  description: "Ascendra tournament points and standings.",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeaderboardPageProps = {
  searchParams: Promise<{
    game?: string;
    type?: string;
  }>;
};

const games = ["Overall", "Valorant", "League of Legends", "CS2", "Dota2"];

function buildLeaderboardHref(game: string, type: "players" | "teams") {
  const params = new URLSearchParams();

  if (game !== "Overall") {
    params.set("game", game);
  }

  if (type === "teams") {
    params.set("type", "teams");
  }

  const query = params.toString();

  return query ? `/leaderboard?${query}` : "/leaderboard";
}

function FilterButton({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-violet-400/35 bg-violet-500/15 text-white shadow-lg shadow-violet-950/20"
          : "border-white/10 bg-black/20 text-gray-300 hover:border-violet-400/30 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 truncate text-3xl font-black text-white">{value}</p>

      <p className="mt-2 text-sm leading-6 text-gray-500">{hint}</p>
    </div>
  );
}

async function getPlayerLeaderboard(
  selectedGame: string,
): Promise<LeaderboardUser[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      teamMemberships: {
        select: {
          team: {
            select: {
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

async function getTeamLeaderboard(
  selectedGame: string,
): Promise<LeaderboardTeam[]> {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      game: true,
      leader: {
        select: {
          username: true,
        },
      },
      members: {
        select: {
          id: true,
        },
      },
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
  });

  const leaderboardTeams = teams
    .map((team) => {
      const teamResults = team.results.filter((result) => {
        if (selectedGame === "Overall") {
          return true;
        }

        return result.tournament.game === selectedGame;
      });

      const tournamentResults = teamResults.length;

      const tournamentPoints = teamResults.reduce(
        (total, result) => total + result.points,
        0,
      );

      const bestPlacement =
        teamResults.length > 0
          ? Math.min(...teamResults.map((result) => result.placement))
          : null;

      return {
        id: team.id,
        name: team.name,
        game: team.game,
        leaderName: team.leader.username,
        membersCount: team.members.length,
        tournamentResults,
        tournamentPoints,
        bestPlacement,
      };
    })
    .filter((team) => team.tournamentPoints > 0)
    .sort((a, b) => {
      if (b.tournamentPoints !== a.tournamentPoints) {
        return b.tournamentPoints - a.tournamentPoints;
      }

      if (b.tournamentResults !== a.tournamentResults) {
        return b.tournamentResults - a.tournamentResults;
      }

      return (a.bestPlacement || 999) - (b.bestPlacement || 999);
    });

  return leaderboardTeams.map((team, index) => ({
    ...team,
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

  const selectedType = params.type === "teams" ? "teams" : "players";

  const playerLeaderboard =
    selectedType === "players" ? await getPlayerLeaderboard(selectedGame) : [];

  const teamLeaderboard =
    selectedType === "teams" ? await getTeamLeaderboard(selectedGame) : [];

  const activeLeaderboard =
    selectedType === "players" ? playerLeaderboard : teamLeaderboard;

  const totalPoints = activeLeaderboard.reduce(
    (total, item) => total + item.tournamentPoints,
    0,
  );

  const totalResults = activeLeaderboard.reduce(
    (total, item) => total + item.tournamentResults,
    0,
  );

  const topItem =
    selectedType === "players"
      ? playerLeaderboard[0]?.username || "-"
      : teamLeaderboard[0]?.name || "-";

  const leaderboardLabel =
    selectedType === "players" ? "Player rankings" : "Team rankings";

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[520px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("/images/backgrounds/leaderboard-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.64)_44%,rgba(7,8,17,0.80)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#070811]/80 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <div className="max-w-4xl">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
                Competitive standings
              </p>

              <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
                Leaderboard
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
                Official rankings based on approved tournament results and
                awarded points.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <FilterButton
                  href={buildLeaderboardHref(selectedGame, "players")}
                  label="Players"
                  active={selectedType === "players"}
                />

                <FilterButton
                  href={buildLeaderboardHref(selectedGame, "teams")}
                  label="Teams"
                  active={selectedType === "teams"}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-24 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <LeaderboardRealtime />
          <section className="grid gap-5 rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  {leaderboardLabel}
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  {selectedGame === "Overall"
                    ? "Overall standings"
                    : `${selectedGame} standings`}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {games.map((game) => (
                  <FilterButton
                    key={game}
                    href={buildLeaderboardHref(game, selectedType)}
                    label={game}
                    active={selectedGame === game}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={selectedType === "players" ? "Players" : "Teams"}
              value={activeLeaderboard.length}
              hint="Ranked entries with tournament points."
            />

            <StatCard
              label="Total points"
              value={totalPoints}
              hint="Points awarded in the selected ranking."
            />

            <StatCard
              label="Results"
              value={totalResults}
              hint="Saved tournament results included here."
            />

            <StatCard
              label={selectedType === "players" ? "Top player" : "Top team"}
              value={topItem}
              hint="Current highest ranked entry."
            />
          </section>

          {activeLeaderboard.length > 0 ? (
            selectedType === "players" ? (
              <LeaderboardTable users={playerLeaderboard} />
            ) : (
              <TeamLeaderboardTable teams={teamLeaderboard} />
            )
          ) : (
            <EmptyState
              title="No tournament points yet"
              description={
                selectedGame === "Overall"
                  ? selectedType === "players"
                    ? "Player rankings will appear here when official results are added."
                    : "Team rankings will appear here when official results are added."
                  : `No points have been awarded for ${selectedGame} yet.`
              }
              actionLabel="View tournaments"
              actionHref="/tournaments"
            />
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import LeaderboardRealtime from "@/components/LeaderboardRealtime";
import LeaderboardTable from "@/components/LeaderboardTable";
import Navbar from "@/components/Navbar";
import TeamLeaderboardTable from "@/components/TeamLeaderboardTable";
import type { LeaderboardTeam, LeaderboardUser } from "@/data/leaderboard";
import {
  getDictionary,
  type LeaderboardMessages,
  type Locale,
} from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeaderboardPageProps = {
  searchParams: Promise<{
    game?: string;
    type?: string;
  }>;
};

type SnapshotMember = {
  userId?: string;
  username?: string;
};

const games = ["Overall", "Valorant", "League of Legends", "CS2", "Dota2"];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).leaderboard.metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function getGameLabel(game: string, messages: LeaderboardMessages) {
  return game === "Overall" ? messages.filters.overall : game;
}

function getGameHeading(
  game: string,
  messages: LeaderboardMessages,
  locale: Locale,
) {
  if (game === "Overall") {
    return messages.headings.overallStandings;
  }

  if (locale === "ar") {
    return `${messages.headings.gameStandings} ${game}`;
  }

  return `${game} ${messages.headings.gameStandings}`;
}

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
      scroll={false}
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

function TypeButton({
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
      scroll={false}
      className={`rounded-2xl border px-5 py-3 text-sm font-black transition ${
        active
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 shadow-lg shadow-emerald-950/20"
          : "border-white/10 bg-black/20 text-gray-300 hover:border-emerald-400/25 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 truncate text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function parseSnapshotMembers(snapshotMembers: unknown): SnapshotMember[] {
  if (!Array.isArray(snapshotMembers)) {
    return [];
  }

  return snapshotMembers
    .filter((member): member is Record<string, unknown> => {
      return Boolean(member) && typeof member === "object";
    })
    .map((member) => ({
      userId: typeof member.userId === "string" ? member.userId : undefined,
      username:
        typeof member.username === "string" ? member.username : undefined,
    }))
    .filter((member) => Boolean(member.userId));
}

async function getPlayerLeaderboard(
  selectedGame: string,
  unknownPlayerLabel: string,
): Promise<LeaderboardUser[]> {
  const results = await prisma.tournamentResult.findMany({
    select: {
      id: true,
      points: true,
      placement: true,
      snapshotMembers: true,
      tournament: {
        select: {
          game: { select: { name: true } },
        },
      },
      team: {
        select: {
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  username: true,
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const userIds = new Set<string>();

  for (const result of results) {
    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);

    for (const member of snapshotMembers) {
      if (member.userId) {
        userIds.add(member.userId);
      }
    }

    if (snapshotMembers.length === 0) {
      for (const member of result.team.members) {
        userIds.add(member.user.id);
      }
    }
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [...userIds],
      },
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  const usersById = new Map(users.map((user) => [user.id, user]));

  const leaderboard = new Map<
    string,
    {
      id: string;
      username: string;
      role: string;
      tournamentPoints: number;
      tournamentResults: number;
      bestPlacement: number | null;
    }
  >();

  for (const result of results) {
    if (selectedGame !== "Overall" && result.tournament.game?.name !== selectedGame) {
      continue;
    }

    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);

    const members =
      snapshotMembers.length > 0
        ? snapshotMembers
        : result.team.members.map((member) => ({
            userId: member.user.id,
            username: member.user.username,
          }));

    for (const member of members) {
      if (!member.userId) {
        continue;
      }

      const currentUser = usersById.get(member.userId);

      const existing = leaderboard.get(member.userId) || {
        id: member.userId,
        username:
          currentUser?.username || member.username || unknownPlayerLabel,
        role: currentUser?.role || "member",
        tournamentPoints: 0,
        tournamentResults: 0,
        bestPlacement: null,
      };

      existing.tournamentPoints += result.points;
      existing.tournamentResults += 1;
      existing.bestPlacement =
        existing.bestPlacement === null
          ? result.placement
          : Math.min(existing.bestPlacement, result.placement);

      leaderboard.set(member.userId, existing);
    }
  }

  return [...leaderboard.values()]
    .filter((user) => user.tournamentPoints > 0)
    .sort((a, b) => {
      if (b.tournamentPoints !== a.tournamentPoints) {
        return b.tournamentPoints - a.tournamentPoints;
      }

      if (b.tournamentResults !== a.tournamentResults) {
        return b.tournamentResults - a.tournamentResults;
      }

      return (a.bestPlacement || 999) - (b.bestPlacement || 999);
    })
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
}

async function getTeamLeaderboard(
  selectedGame: string,
): Promise<LeaderboardTeam[]> {
  const results = await prisma.tournamentResult.findMany({
    select: {
      id: true,
      teamId: true,
      points: true,
      placement: true,
      snapshotTeamName: true,
      snapshotTeamGame: true,
      snapshotMembers: true,
      tournament: {
        select: {
          game: { select: { name: true } },
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          game: { select: { name: true } },
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
        },
      },
    },
  });

  const leaderboard = new Map<
    string,
    {
      id: string;
      name: string;
      game: string | null;
      leaderName: string;
      membersCount: number;
      tournamentPoints: number;
      tournamentResults: number;
      bestPlacement: number | null;
    }
  >();

  for (const result of results) {
    if (selectedGame !== "Overall" && result.tournament.game?.name !== selectedGame) {
      continue;
    }

    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);
    const existing = leaderboard.get(result.teamId) || {
      id: result.teamId,
      name: result.snapshotTeamName || result.team.name,
      game: (result.snapshotTeamGame || result.team.game?.name) ?? null,
      leaderName: result.team.leader.username,
      membersCount:
        snapshotMembers.length > 0
          ? snapshotMembers.length
          : result.team.members.length,
      tournamentPoints: 0,
      tournamentResults: 0,
      bestPlacement: null,
    };

    existing.tournamentPoints += result.points;
    existing.tournamentResults += 1;
    existing.bestPlacement =
      existing.bestPlacement === null
        ? result.placement
        : Math.min(existing.bestPlacement, result.placement);

    leaderboard.set(result.teamId, existing);
  }

  return [...leaderboard.values()]
    .filter((team) => team.tournamentPoints > 0)
    .sort((a, b) => {
      if (b.tournamentPoints !== a.tournamentPoints) {
        return b.tournamentPoints - a.tournamentPoints;
      }

      if (b.tournamentResults !== a.tournamentResults) {
        return b.tournamentResults - a.tournamentResults;
      }

      return (a.bestPlacement || 999) - (b.bestPlacement || 999);
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const messages = getDictionary(locale).leaderboard;

  const selectedGame = games.includes(params.game || "")
    ? params.game || "Overall"
    : "Overall";

  const selectedType = params.type === "teams" ? "teams" : "players";

  const playerLeaderboard =
    selectedType === "players"
      ? await getPlayerLeaderboard(
          selectedGame,
          messages.fallback.unknownPlayer,
        )
      : [];

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
      ? playerLeaderboard[0]?.username || messages.fallback.none
      : teamLeaderboard[0]?.name || messages.fallback.none;

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.16)_0%,transparent_32%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[500px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("/images/backgrounds/leaderboard-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.94)_0%,rgba(7,8,17,0.66)_44%,rgba(7,8,17,0.84)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#070811]/80 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-32 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              {messages.hero.label}
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
              {messages.hero.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              {messages.hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <TypeButton
                href={buildLeaderboardHref(selectedGame, "players")}
                label={messages.types.playerRanking}
                active={selectedType === "players"}
              />

              <TypeButton
                href={buildLeaderboardHref(selectedGame, "teams")}
                label={messages.types.teamRanking}
                active={selectedType === "teams"}
              />
            </div>
          </div>
        </section>

        <section className="relative -mt-24 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <LeaderboardRealtime />

          <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                  {selectedType === "players"
                    ? messages.headings.players
                    : messages.headings.teams}
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  {getGameHeading(selectedGame, messages, locale)}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {messages.headings.rankedBy}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {games.map((game) => (
                  <FilterButton
                    key={game}
                    href={buildLeaderboardHref(game, selectedType)}
                    label={getGameLabel(game, messages)}
                    active={selectedGame === game}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 md:grid-cols-2 xl:grid-cols-4">
            <Stat
              label={
                selectedType === "players"
                  ? messages.stats.players
                  : messages.stats.teams
              }
              value={activeLeaderboard.length}
            />
            <Stat label={messages.stats.totalPoints} value={totalPoints} />
            <Stat label={messages.stats.results} value={totalResults} />
            <Stat
              label={
                selectedType === "players"
                  ? messages.stats.topPlayer
                  : messages.stats.topTeam
              }
              value={topItem}
            />
          </section>

          {activeLeaderboard.length > 0 ? (
            selectedType === "players" ? (
              <LeaderboardTable
                users={playerLeaderboard}
                messages={messages.table}
              />
            ) : (
              <TeamLeaderboardTable
                teams={teamLeaderboard}
                messages={messages.table}
              />
            )
          ) : (
            <EmptyState
              title={messages.empty.title}
              description={
                selectedGame === "Overall"
                  ? messages.empty.overallDescription
                  : messages.empty.gameDescription
              }
              actionLabel={messages.empty.action}
              actionHref="/tournaments"
            />
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}

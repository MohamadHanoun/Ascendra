import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
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
    region?: string;
  }>;
};

type SnapshotMember = {
  userId?: string;
  username?: string;
};

const games = ["Overall", "Valorant", "League of Legends", "CS2", "Dota2"];
const regions = ["Global", "NA", "EU", "APAC", "BR"];

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

function buildLeaderboardHref(
  game: string,
  type: "players" | "teams",
  region = "Global",
) {
  const params = new URLSearchParams();

  if (game !== "Overall") params.set("game", game);
  if (type === "teams") params.set("type", "teams");
  if (region !== "Global") params.set("region", region);

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
      className="border px-4 py-2 text-sm font-black transition"
      style={
        active
          ? { borderColor: "var(--asc-accent)", background: "var(--asc-accent-dim)", color: "var(--asc-fg-0)" }
          : { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }
      }
    >
      {label}
    </Link>
  );
}

function RegionButton({
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
      className="border px-3 py-1.5 text-xs font-black transition"
      style={
        active
          ? { borderColor: "var(--asc-accent)", background: "var(--asc-accent-dim)", color: "var(--asc-fg-0)" }
          : { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }
      }
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
      className="border px-5 py-3 text-sm font-black transition"
      style={
        active
          ? { borderColor: "var(--asc-accent)", background: "var(--asc-accent-dim)", color: "var(--asc-fg-0)", boxShadow: "0 0 16px var(--asc-accent-glow)" }
          : { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }
      }
    >
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p className="mt-1 truncate text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
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
  const [params, locale, session] = await Promise.all([
    searchParams,
    getLocale(),
    auth(),
  ]);
  const messages = getDictionary(locale).leaderboard;
  const currentUserId = session?.user?.databaseId ?? undefined;

  const selectedGame = games.includes(params.game || "")
    ? params.game || "Overall"
    : "Overall";

  const selectedType = params.type === "teams" ? "teams" : "players";
  const selectedRegion = regions.includes(params.region || "")
    ? params.region || "Global"
    : "Global";

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
    <main className="asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="relative min-h-[400px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/images/backgrounds/leaderboard-hero.webp")' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.60) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.40) 35%, transparent 70%)",
              ].join(", "),
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>
              ▲ SEASON 7 · APEX TIER
            </p>
            <h1 className="max-w-5xl text-5xl md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
              {messages.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>
              {messages.hero.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <TypeButton
                href={buildLeaderboardHref(selectedGame, "players", selectedRegion)}
                label={messages.types.playerRanking}
                active={selectedType === "players"}
              />
              <TypeButton
                href={buildLeaderboardHref(selectedGame, "teams", selectedRegion)}
                label={messages.types.teamRanking}
                active={selectedType === "teams"}
              />
            </div>

            {/* Region filter */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>
                Region
              </span>
              <div style={{ width: 1, height: 16, background: "var(--asc-line-soft)" }} />
              {regions.map((region) => (
                <RegionButton
                  key={region}
                  href={buildLeaderboardHref(selectedGame, selectedType, region)}
                  label={region}
                  active={selectedRegion === region}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="relative -mt-24 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <LeaderboardRealtime />

          {/* Filter panel */}
          <section
            className="border p-5 shadow-2xl"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
                  {selectedType === "players" ? messages.headings.players : messages.headings.teams}
                </p>
                <h2 className="mt-2 text-3xl" style={{ color: "var(--asc-fg-0)" }}>
                  {getGameHeading(selectedGame, messages, locale)}
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                  {messages.headings.rankedBy}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {games.map((game) => (
                  <FilterButton
                    key={game}
                    href={buildLeaderboardHref(game, selectedType, selectedRegion)}
                    label={getGameLabel(game, messages)}
                    active={selectedGame === game}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Stats bar */}
          <section
            className="grid gap-5 border p-5 shadow-2xl md:grid-cols-2 xl:grid-cols-4"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <Stat
              label={selectedType === "players" ? messages.stats.players : messages.stats.teams}
              value={activeLeaderboard.length}
            />
            <Stat label={messages.stats.totalPoints} value={totalPoints} />
            <Stat label={messages.stats.results} value={totalResults} />
            <Stat
              label={selectedType === "players" ? messages.stats.topPlayer : messages.stats.topTeam}
              value={topItem}
            />
          </section>

          {activeLeaderboard.length > 0 ? (
            selectedType === "players" ? (
              <LeaderboardTable
                users={playerLeaderboard}
                messages={messages.table}
                currentUserId={currentUserId}
              />
            ) : (
              <TeamLeaderboardTable teams={teamLeaderboard} messages={messages.table} />
            )
          ) : (
            <EmptyState
              title={messages.empty.title}
              description={selectedGame === "Overall" ? messages.empty.overallDescription : messages.empty.gameDescription}
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

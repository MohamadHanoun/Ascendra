import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TeamLeaderboardTable from "@/components/TeamLeaderboardTable";
import Sparkline from "@/components/ui/Sparkline";
import type { LeaderboardTeam, LeaderboardUser } from "@/data/leaderboard";
import { getDictionary, type LeaderboardMessages } from "@/lib/i18n";
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

const fallbackPodiumPlayers: LeaderboardUser[] = [
  {
    id: "fallback-ravenous",
    username: "Ravenous",
    role: "player",
    tournamentPoints: 4218,
    tournamentResults: 18,
    bestPlacement: 1,
    rank: 1,
  },
  {
    id: "fallback-kairoshi",
    username: "Kairoshi",
    role: "player",
    tournamentPoints: 4192,
    tournamentResults: 16,
    bestPlacement: 2,
    rank: 2,
  },
  {
    id: "fallback-nyxvoid",
    username: "NyxVoid",
    role: "player",
    tournamentPoints: 4087,
    tournamentResults: 15,
    bestPlacement: 3,
    rank: 3,
  },
];

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

function generateTrend(points: number, rank: number): number[] {
  const safePoints = Math.max(points, 100);
  const length = 12;

  return Array.from({ length }, (_, index) => {
    const base = safePoints * 0.76;
    const wave = Math.sin(index + rank * 0.8) * safePoints * 0.08;
    const rise = (index / (length - 1)) * safePoints * 0.24;

    return Math.round(Math.max(0, base + wave + rise));
  });
}

function generateDelta(points: number, rank: number): number {
  return Math.round(((points * 7 + rank * 13) % 160) - 80);
}

function generateTierLabel(rank: number): string {
  if (rank <= 3) return "APEX I";
  if (rank <= 10) return "APEX II";
  if (rank <= 25) return "APEX III";
  if (rank <= 50) return "DIAMOND I";

  return "PLATINUM I";
}

function getAvatarHue(username: string): number {
  let hue = 0;

  for (const character of username) {
    hue = (hue << 5) - hue + character.charCodeAt(0);
  }

  return Math.abs(hue) % 360;
}

function formatBestPlacement(bestPlacement: number | null) {
  return bestPlacement ? `#${bestPlacement}` : "—";
}

function formatRole(role: string) {
  return role.replaceAll("_", " ").toUpperCase();
}

function getPodiumPlayers(players: LeaderboardUser[]) {
  const merged = [...players];

  for (const fallback of fallbackPodiumPlayers) {
    if (merged.length >= 3) {
      break;
    }

    merged.push({
      ...fallback,
      rank: merged.length + 1,
    });
  }

  return merged.slice(0, 3);
}

function AvatarSquare({
  username,
  size = 36,
}: {
  username: string;
  size?: number;
}) {
  const hue = getAvatarHue(username);
  const cut = Math.round(size * 0.18);

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.30 0.16 ${
          hue + 40
        }))`,
        color: "oklch(0.97 0.01 290)",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: Math.round(size * 0.36),
        letterSpacing: "0.04em",
        clipPath: `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`,
        boxShadow: `inset 0 0 0 1px oklch(0.65 0.22 ${hue} / 0.4)`,
      }}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const [name, sub = ""] = tier.split(" ");

  return (
    <span
      className="inline-flex items-center gap-1 border px-3 py-1"
      style={{
        background: "oklch(0.20 0.10 285 / 0.3)",
        borderColor: "var(--asc-accent-dim)",
        clipPath:
          "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
      }}
    >
      <span style={{ color: "var(--asc-accent)", fontSize: 10 }}>▲</span>
      <span
        className="text-[11px] font-black uppercase tracking-[0.14em]"
        style={{
          color: "var(--asc-accent)",
          fontFamily: "var(--font-display)",
        }}
      >
        {name}
      </span>
      {sub && (
        <span
          className="text-[10px] font-bold"
          style={{
            color: "var(--asc-accent)",
            opacity: 0.85,
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {sub}
        </span>
      )}
    </span>
  );
}

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span
        className="text-[11px]"
        style={{
          color: "var(--asc-fg-3)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        —
      </span>
    );
  }

  const up = value > 0;

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px]"
      style={{
        color: up ? "var(--asc-green)" : "var(--asc-live)",
        fontFamily: "var(--font-mono, monospace)",
      }}
    >
      {up ? "↑" : "↓"}
      {Math.abs(value)}
    </span>
  );
}

const PODIUM_COLORS: Record<number, string> = {
  1: "oklch(0.84 0.14 85)",
  2: "oklch(0.78 0.04 290)",
  3: "oklch(0.62 0.10 50)",
};

function PodiumCard({
  player,
  place,
}: {
  player: LeaderboardUser;
  place: number;
}) {
  const accentColor = PODIUM_COLORS[place] ?? "var(--asc-fg-0)";
  const avatarSize = place === 1 ? 64 : 52;
  const tier = generateTierLabel(player.rank);

  return (
    <div
      className="relative overflow-hidden border"
      style={{
        background:
          place === 1
            ? "linear-gradient(180deg, oklch(0.18 0.10 285 / 0.72) 0%, oklch(0.10 0.04 285) 100%)"
            : "var(--asc-bg-1)",
        borderColor: "var(--asc-line-soft)",
        padding: place === 1 ? "34px 22px" : "22px 22px",
        marginBottom: place !== 1 ? 24 : 0,
        minHeight: place === 1 ? 250 : 220,
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />

      {place === 1 && <div aria-hidden="true" className="asc-corner-mark" />}

      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="relative flex items-center gap-2">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 34,
            color: accentColor,
            textShadow: place === 1 ? `0 0 24px ${accentColor}` : "none",
            lineHeight: 1,
          }}
        >
          #{place}
        </span>

        {place === 1 && (
          <span style={{ color: "oklch(0.84 0.14 85)", fontSize: 18 }}>♛</span>
        )}
      </div>

      <div className="relative mt-6 flex items-center gap-4">
        <AvatarSquare username={player.username} size={avatarSize} />

        <div>
          <p
            className="uppercase"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: place === 1 ? 23 : 19,
              color: "var(--asc-fg-0)",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
            }}
          >
            {player.username}
          </p>

          <p
            className="mt-1 text-[10px] uppercase tracking-[0.12em]"
            style={{
              color: "var(--asc-fg-3)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {formatRole(player.role)}
          </p>
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: "var(--asc-line-soft)",
          margin: "18px 0",
        }}
      />

      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "PTS",
            value: player.tournamentPoints.toLocaleString(),
            accent: true,
          },
          {
            label: "RESULTS",
            value: player.tournamentResults,
            accent: false,
          },
          {
            label: "BEST",
            value: formatBestPlacement(player.bestPlacement),
            accent: false,
          },
        ].map((item) => (
          <div key={item.label}>
            <p
              className="text-[9px] uppercase tracking-[0.14em]"
              style={{
                color: "var(--asc-fg-3)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {item.label}
            </p>

            <p
              className="mt-1 font-black"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: place === 1 ? 24 : 20,
                color: item.accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
              }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <TierBadge tier={tier} />
      </div>
    </div>
  );
}

function FilterPill({
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
      className="text-[11px] uppercase tracking-[0.12em]"
      style={{
        fontFamily: "var(--font-mono, monospace)",
        padding: "6px 12px",
        border: `1px solid ${
          active ? "var(--asc-accent)" : "var(--asc-line-soft)"
        }`,
        background: active ? "var(--asc-accent-dim)" : "transparent",
        color: active ? "var(--asc-fg-0)" : "var(--asc-fg-3)",
        clipPath:
          "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
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
          game: {
            select: {
              name: true,
            },
          },
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
    const snapshot = parseSnapshotMembers(result.snapshotMembers);

    for (const member of snapshot) {
      if (member.userId) {
        userIds.add(member.userId);
      }
    }

    if (snapshot.length === 0) {
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
    if (
      selectedGame !== "Overall" &&
      result.tournament.game?.name !== selectedGame
    ) {
      continue;
    }

    const snapshot = parseSnapshotMembers(result.snapshotMembers);

    const members =
      snapshot.length > 0
        ? snapshot
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
          game: {
            select: {
              name: true,
            },
          },
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          game: {
            select: {
              name: true,
            },
          },
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
    if (
      selectedGame !== "Overall" &&
      result.tournament.game?.name !== selectedGame
    ) {
      continue;
    }

    const snapshot = parseSnapshotMembers(result.snapshotMembers);

    const existing = leaderboard.get(result.teamId) || {
      id: result.teamId,
      name: result.snapshotTeamName || result.team.name,
      game: (result.snapshotTeamGame || result.team.game?.name) ?? null,
      leaderName: result.team.leader.username,
      membersCount:
        snapshot.length > 0 ? snapshot.length : result.team.members.length,
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

function LeaderboardTable({
  players,
  currentUserId,
  showPodium,
}: {
  players: LeaderboardUser[];
  currentUserId?: string;
  showPodium: boolean;
}) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--asc-accent)" }}
          >
            ▲ Ranks {showPodium ? "4" : "1"}–100
          </p>
          <h2 className="mt-2 text-3xl" style={{ color: "var(--asc-fg-0)" }}>
            Apex 100 Ladder
          </h2>
        </div>

        <span
          className="text-[11px]"
          style={{
            color: "var(--asc-fg-3)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          Updated just now
        </span>
      </div>

      <div
        className="relative overflow-x-auto border"
        style={{
          background: "var(--asc-bg-1)",
          borderColor: "var(--asc-line-soft)",
        }}
      >
        <div aria-hidden="true" className="asc-corner-mark" />

        <div className="min-w-[980px]">
          <div
            className="grid grid-cols-[0.4fr_2fr_1.2fr_0.8fr_0.8fr_0.7fr_1fr_0.9fr_0.7fr] gap-3 px-5 py-3"
            style={{
              borderBottom: "1px solid var(--asc-line-soft)",
              background: "oklch(0.08 0.03 285)",
            }}
          >
            {[
              "#",
              "Player",
              "Tier",
              "PTS",
              "Results",
              "Best",
              "Role",
              "Trend",
              "Δ7D",
            ].map((heading) => (
              <span
                key={heading}
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                {heading}
              </span>
            ))}
          </div>

          {players.map((player) => {
            const trend = generateTrend(player.tournamentPoints, player.rank);
            const delta = generateDelta(player.tournamentPoints, player.rank);
            const tier = generateTierLabel(player.rank);
            const isCurrentUser = String(player.id) === currentUserId;

            return (
              <div
                key={player.id}
                className="grid grid-cols-[0.4fr_2fr_1.2fr_0.8fr_0.8fr_0.7fr_1fr_0.9fr_0.7fr] items-center gap-3 px-5 py-4"
                style={{
                  borderTop: "1px solid var(--asc-line-soft)",
                  background: isCurrentUser
                    ? "oklch(0.20 0.12 285 / 0.15)"
                    : "transparent",
                }}
              >
                <span
                  className="text-sm font-black tabular-nums"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {String(player.rank).padStart(2, "0")}
                </span>

                <div className="flex min-w-0 items-center gap-3">
                  <AvatarSquare username={player.username} size={32} />

                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-black"
                      style={{ color: "var(--asc-fg-0)" }}
                    >
                      {player.username}
                      {isCurrentUser && (
                        <span
                          className="ml-2 text-[9px] uppercase tracking-[0.14em]"
                          style={{ color: "var(--asc-accent)" }}
                        >
                          YOU
                        </span>
                      )}
                    </p>

                    <p
                      className="mt-1 text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      Tournament player
                    </p>
                  </div>
                </div>

                <TierBadge tier={tier} />

                <span
                  className="text-sm font-black tabular-nums"
                  style={{
                    color: "var(--asc-fg-0)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {player.tournamentPoints.toLocaleString()}
                </span>

                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: "var(--asc-fg-1)" }}
                >
                  {player.tournamentResults}
                </span>

                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: "var(--asc-fg-1)" }}
                >
                  {formatBestPlacement(player.bestPlacement)}
                </span>

                <span
                  className="truncate text-xs font-bold"
                  style={{ color: "var(--asc-fg-2)" }}
                >
                  {formatRole(player.role)}
                </span>

                <Sparkline
                  values={trend}
                  id={String(player.id)}
                  width={60}
                  height={18}
                />

                <Delta value={delta} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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

  const playerLeaderboard =
    selectedType === "players"
      ? await getPlayerLeaderboard(
          selectedGame,
          messages.fallback.unknownPlayer,
        )
      : [];

  const teamLeaderboard =
    selectedType === "teams" ? await getTeamLeaderboard(selectedGame) : [];

  const shouldShowPodium = selectedType === "players";
  const podiumPlayers = getPodiumPlayers(playerLeaderboard);

  const tableRows =
    playerLeaderboard.length > 3
      ? playerLeaderboard.slice(3)
      : playerLeaderboard;

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="relative flex min-h-[430px] items-end overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("/images/backgrounds/leaderboard-hero.webp")',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.58) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.42) 35%, transparent 70%)",
              ].join(", "),
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-14 pt-28 lg:px-8">
            <p
              className="mb-4 text-xs font-black uppercase tracking-[0.18em]"
              style={{ color: "var(--asc-accent)" }}
            >
              ▲ Season 7 · Apex tier
            </p>

            <h1
              className="text-5xl md:text-6xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {messages.hero.title}
            </h1>

            <p
              className="mt-4 max-w-xl text-sm leading-6"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {messages.hero.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <FilterPill
                href={buildLeaderboardHref(selectedGame, "players")}
                label={messages.types.playerRanking}
                active={selectedType === "players"}
              />

              <FilterPill
                href={buildLeaderboardHref(selectedGame, "teams")}
                label={messages.types.teamRanking}
                active={selectedType === "teams"}
              />

              <div
                className="mx-1 h-6 w-px"
                style={{ background: "var(--asc-line-soft)" }}
              />

              <span
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{
                  color: "var(--asc-fg-3)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                Game
              </span>

              {games.map((game) => (
                <FilterPill
                  key={game}
                  href={buildLeaderboardHref(
                    game,
                    selectedType as "players" | "teams",
                  )}
                  label={getGameLabel(game, messages)}
                  active={selectedGame === game}
                />
              ))}
            </div>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-10 max-w-[1440px] px-6 pb-24 lg:px-8">
          {selectedType === "players" ? (
            playerLeaderboard.length === 0 ? (
              <>
                {shouldShowPodium && (
                  <div className="mb-10 grid gap-4 lg:grid-cols-[1fr_1.15fr_1fr] lg:items-end">
                    <PodiumCard player={podiumPlayers[1]} place={2} />
                    <PodiumCard player={podiumPlayers[0]} place={1} />
                    <PodiumCard player={podiumPlayers[2]} place={3} />
                  </div>
                )}

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
              </>
            ) : (
              <>
                {shouldShowPodium && (
                  <div className="mb-10 grid gap-4 lg:grid-cols-[1fr_1.15fr_1fr] lg:items-end">
                    <PodiumCard player={podiumPlayers[1]} place={2} />
                    <PodiumCard player={podiumPlayers[0]} place={1} />
                    <PodiumCard player={podiumPlayers[2]} place={3} />
                  </div>
                )}

                {tableRows.length > 0 && (
                  <LeaderboardTable
                    players={tableRows}
                    currentUserId={currentUserId}
                    showPodium={shouldShowPodium}
                  />
                )}
              </>
            )
          ) : teamLeaderboard.length > 0 ? (
            <TeamLeaderboardTable
              teams={teamLeaderboard}
              messages={messages.table}
            />
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
        </div>

        <Footer />
      </div>
    </main>
  );
}

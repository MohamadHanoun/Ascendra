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
  return { title: messages.title, description: messages.description };
}

function getGameLabel(game: string, messages: LeaderboardMessages) {
  return game === "Overall" ? messages.filters.overall : game;
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

function parseSnapshotMembers(snapshotMembers: unknown): SnapshotMember[] {
  if (!Array.isArray(snapshotMembers)) return [];
  return snapshotMembers
    .filter((m): m is Record<string, unknown> => Boolean(m) && typeof m === "object")
    .map((m) => ({
      userId: typeof m.userId === "string" ? m.userId : undefined,
      username: typeof m.username === "string" ? m.username : undefined,
    }))
    .filter((m) => Boolean(m.userId));
}

// ── Deterministic stat generators ─────────────────────────────────────────────

function generateTrend(points: number, rank: number): number[] {
  const len = 12;
  return Array.from({ length: len }, (_, k) => {
    const base = points * 0.72;
    const wave = Math.sin(k + rank * 0.8) * points * 0.12;
    const rise = (k / (len - 1)) * points * 0.28;
    return Math.round(Math.max(0, base + wave + rise));
  });
}

function generateDelta(points: number, rank: number): number {
  return Math.round(((points * 7 + rank * 13) % 200) - 100);
}

function generateKD(rank: number): string {
  return (Math.max(0.8, 2.5 - rank * 0.06) + (rank % 3) * 0.05).toFixed(2);
}

function generateWR(rank: number): number {
  return Math.round(Math.max(40, Math.min(85, 75 - rank * 1.2 + (rank % 4) * 2)));
}

function generateTierLabel(rank: number): string {
  if (rank <= 3) return "APEX I";
  if (rank <= 10) return "APEX II";
  if (rank <= 25) return "APEX III";
  if (rank <= 50) return "DIAMOND I";
  return "PLATINUM I";
}

const REGION_CYCLE = ["NA", "EU", "APAC", "BR", "MENA", "KR", "NA", "EU"];
const FLAG_CYCLE = ["🇺🇸", "🇬🇧", "🇰🇷", "🇧🇷", "🇩🇪", "🇦🇺", "🇸🇦", "🇫🇷"];

function getPlayerRegion(rank: number) {
  return REGION_CYCLE[(rank - 1) % REGION_CYCLE.length];
}
function getPlayerFlag(rank: number) {
  return FLAG_CYCLE[(rank - 1) % FLAG_CYCLE.length];
}
function getAvatarHue(username: string): number {
  let h = 0;
  for (const c of username) h = (h << 5) - h + c.charCodeAt(0);
  return Math.abs(h) % 360;
}

// ── UI atoms ─────────────────────────────────────────────────────────────────

function AvatarSquare({ username, size = 36 }: { username: string; size?: number }) {
  const hue = getAvatarHue(username);
  const cut = Math.round(size * 0.18);
  return (
    <div
      style={{
        width: size, height: size, flexShrink: 0,
        background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.30 0.16 ${hue + 40}))`,
        color: "oklch(0.97 0.01 290)",
        display: "grid", placeItems: "center",
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
  const parts = tier.split(" ");
  const name = parts[0];
  const sub = parts[1] ?? "";
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "4px 10px",
        background: "oklch(0.20 0.10 285 / 0.3)",
        border: "1px solid var(--asc-accent-dim)",
        clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
      }}
    >
      <span style={{ color: "var(--asc-accent)", fontSize: 10, lineHeight: 1 }}>▲</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: "0.14em", color: "var(--asc-accent)" }}>
        {name}
      </span>
      {sub && (
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 10, color: "var(--asc-accent)", opacity: 0.85 }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--asc-fg-3)", fontSize: 11 }}>
        —
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      style={{
        fontFamily: "var(--font-mono, monospace)",
        color: up ? "var(--asc-green)" : "var(--asc-live)",
        fontSize: 11,
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {up ? "↑" : "↓"}{Math.abs(value)}
    </span>
  );
}

const PODIUM_COLORS: Record<number, string> = {
  1: "oklch(0.84 0.14 85)",
  2: "oklch(0.78 0.04 290)",
  3: "oklch(0.62 0.10 50)",
};

function PodiumCard({ player, place }: { player: LeaderboardUser; place: number }) {
  const accentColor = PODIUM_COLORS[place] ?? "var(--asc-fg-0)";
  const avatarSize = place === 1 ? 64 : 52;
  const kd = generateKD(player.rank);
  const wr = generateWR(player.rank);
  const tier = generateTierLabel(player.rank);
  const flag = getPlayerFlag(player.rank);
  const region = getPlayerRegion(player.rank);

  return (
    <div
      style={{
        position: "relative",
        background:
          place === 1
            ? "linear-gradient(180deg, oklch(0.18 0.10 285 / 0.6) 0%, oklch(0.10 0.04 285) 100%)"
            : "var(--asc-bg-1)",
        border: "1px solid var(--asc-line-soft)",
        padding: place === 1 ? "32px 20px" : "20px 20px",
        marginBottom: place !== 1 ? 24 : 0,
        overflow: "hidden",
      }}
    >
      {/* Corner mark */}
      <div aria-hidden="true" style={{ position: "absolute", top: 10, left: 10, width: 14, height: 14, opacity: 0.6 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: 1, background: "var(--asc-accent)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: 8, background: "var(--asc-accent)" }} />
      </div>

      {/* Place 1 glow */}
      {place === 1 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: -40, right: -40,
            width: 220, height: 220,
            background: "radial-gradient(circle, var(--asc-accent-glow) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Big background rank number */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: -10, right: -8,
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: place === 1 ? 200 : 140,
          color: "oklch(1 0 0)", opacity: 0.04,
          lineHeight: 0.9, letterSpacing: "-0.02em",
          userSelect: "none", pointerEvents: "none",
        }}
      >
        0{place}
      </div>

      {/* Rank badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
        <span
          style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32,
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

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, position: "relative" }}>
        <AvatarSquare username={player.username} size={avatarSize} />
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: place === 1 ? 22 : 18,
              color: "var(--asc-fg-0)", letterSpacing: "0.04em",
              lineHeight: 1.1, textTransform: "uppercase",
            }}
          >
            {player.username}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)", fontSize: 10,
              color: "var(--asc-fg-3)", marginTop: 2, letterSpacing: "0.10em",
            }}
          >
            {flag} {region}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--asc-line-soft)", margin: "16px 0" }} />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { l: "PTS", v: player.tournamentPoints.toLocaleString(), accent: true },
          { l: "K/D", v: kd, accent: false },
          { l: "WIN %", v: `${wr}%`, accent: false },
        ].map(({ l, v, accent }) => (
          <div key={l}>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 9, color: "var(--asc-fg-3)", letterSpacing: "0.14em" }}>
              {l}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: place === 1 ? 24 : 20,
                color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
                marginTop: 2,
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Tier */}
      <div style={{ marginTop: 14 }}>
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
      style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "6px 12px",
        border: `1px solid ${active ? "var(--asc-accent)" : "var(--asc-line-soft)"}`,
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

// ── Data fetching ─────────────────────────────────────────────────────────────

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
        select: { game: { select: { name: true } } },
      },
      team: {
        select: {
          members: {
            select: {
              user: { select: { id: true, username: true, role: true } },
            },
          },
        },
      },
    },
  });

  const userIds = new Set<string>();
  for (const result of results) {
    const snapshot = parseSnapshotMembers(result.snapshotMembers);
    for (const m of snapshot) {
      if (m.userId) userIds.add(m.userId);
    }
    if (snapshot.length === 0) {
      for (const m of result.team.members) userIds.add(m.user.id);
    }
  }

  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, username: true, role: true },
  });
  const usersById = new Map(users.map((u) => [u.id, u]));

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
        : result.team.members.map((m) => ({
            userId: m.user.id,
            username: m.user.username,
          }));

    for (const member of members) {
      if (!member.userId) continue;
      const currentUser = usersById.get(member.userId);
      const existing = leaderboard.get(member.userId) || {
        id: member.userId,
        username: currentUser?.username || member.username || unknownPlayerLabel,
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
    .filter((u) => u.tournamentPoints > 0)
    .sort((a, b) => {
      if (b.tournamentPoints !== a.tournamentPoints)
        return b.tournamentPoints - a.tournamentPoints;
      if (b.tournamentResults !== a.tournamentResults)
        return b.tournamentResults - a.tournamentResults;
      return (a.bestPlacement || 999) - (b.bestPlacement || 999);
    })
    .map((user, i) => ({ ...user, rank: i + 1 }));
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
        select: { game: { select: { name: true } } },
      },
      team: {
        select: {
          id: true,
          name: true,
          game: { select: { name: true } },
          leader: { select: { username: true } },
          members: { select: { id: true } },
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
    .filter((t) => t.tournamentPoints > 0)
    .sort((a, b) => {
      if (b.tournamentPoints !== a.tournamentPoints)
        return b.tournamentPoints - a.tournamentPoints;
      if (b.tournamentResults !== a.tournamentResults)
        return b.tournamentResults - a.tournamentResults;
      return (a.bestPlacement || 999) - (b.bestPlacement || 999);
    })
    .map((team, i) => ({ ...team, rank: i + 1 }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
      ? await getPlayerLeaderboard(selectedGame, messages.fallback.unknownPlayer)
      : [];
  const teamLeaderboard =
    selectedType === "teams" ? await getTeamLeaderboard(selectedGame) : [];

  const showPodium = selectedType === "players" && playerLeaderboard.length >= 3;
  const tableRows = showPodium ? playerLeaderboard.slice(3) : playerLeaderboard;

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section
          style={{
            position: "relative",
            minHeight: 360,
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              position: "absolute", inset: 0,
              backgroundImage: 'url("/images/backgrounds/leaderboard-hero.webp")',
              backgroundSize: "cover", backgroundPosition: "center", zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute", inset: 0,
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.55) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.4) 35%, transparent 70%)",
              ].join(", "),
              zIndex: 1,
            }}
          />

          <div
            style={{
              position: "relative", zIndex: 2,
              width: "100%", maxWidth: 1480,
              margin: "0 auto", padding: "28px 32px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--asc-fg-2)", marginBottom: 14,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ color: "var(--asc-accent)" }}>▲</span>
              {" SEASON 7 · APEX TIER"}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "clamp(36px, 4vw, 60px)",
                letterSpacing: "-0.005em", lineHeight: 0.92,
                textTransform: "uppercase", color: "var(--asc-fg-0)",
                margin: "0 0 12px",
              }}
            >
              {messages.hero.title}
            </h1>
            <p
              style={{
                color: "var(--asc-fg-2)", maxWidth: 540,
                fontSize: 15, lineHeight: 1.55, marginBottom: 22,
              }}
            >
              {messages.hero.description}
            </p>

            {/* Filter row */}
            <div
              style={{
                display: "flex", flexWrap: "wrap",
                alignItems: "center", gap: 8,
              }}
            >
              {/* Type */}
              <FilterPill
                href={buildLeaderboardHref(selectedGame, "players", selectedRegion)}
                label={messages.types.playerRanking}
                active={selectedType === "players"}
              />
              <FilterPill
                href={buildLeaderboardHref(selectedGame, "teams", selectedRegion)}
                label={messages.types.teamRanking}
                active={selectedType === "teams"}
              />

              {/* vdiv */}
              <div style={{ width: 1, height: 24, background: "var(--asc-line-soft)" }} />

              {/* Region */}
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)", fontSize: 10,
                  color: "var(--asc-fg-3)", letterSpacing: "0.16em", textTransform: "uppercase",
                }}
              >
                Region
              </span>
              {regions.map((r) => (
                <FilterPill
                  key={r}
                  href={buildLeaderboardHref(
                    selectedGame,
                    selectedType as "players" | "teams",
                    r,
                  )}
                  label={r}
                  active={selectedRegion === r}
                />
              ))}

              {/* vdiv */}
              <div style={{ width: 1, height: 24, background: "var(--asc-line-soft)" }} />

              {/* Game */}
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)", fontSize: 10,
                  color: "var(--asc-fg-3)", letterSpacing: "0.16em", textTransform: "uppercase",
                }}
              >
                Game
              </span>
              {games.map((g) => (
                <FilterPill
                  key={g}
                  href={buildLeaderboardHref(
                    g,
                    selectedType as "players" | "teams",
                    selectedRegion,
                  )}
                  label={getGameLabel(g, messages)}
                  active={selectedGame === g}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Main content */}
        <div
          style={{
            maxWidth: 1480,
            margin: "calc(-1 * var(--pad-3)) auto 0",
            padding: "0 32px var(--pad-5)",
            position: "relative",
            zIndex: 3,
          }}
        >
          {selectedType === "players" ? (
            playerLeaderboard.length === 0 ? (
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
            ) : (
              <>
                {/* Podium — top 3 */}
                {showPodium && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.15fr 1fr",
                      gap: 12,
                      alignItems: "end",
                      marginBottom: 32,
                    }}
                  >
                    <PodiumCard player={playerLeaderboard[1]} place={2} />
                    <PodiumCard player={playerLeaderboard[0]} place={1} />
                    <PodiumCard player={playerLeaderboard[2]} place={3} />
                  </div>
                )}

                {/* Full table */}
                {tableRows.length > 0 && (
                  <div>
                    {/* Section head */}
                    <div
                      style={{
                        display: "flex", alignItems: "flex-end",
                        justifyContent: "space-between", gap: 16, marginBottom: 20,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
                            color: "var(--asc-fg-2)", marginBottom: 6,
                            display: "flex", alignItems: "center", gap: 6,
                          }}
                        >
                          <span style={{ color: "var(--asc-accent)" }}>▲</span>
                          {` Ranks ${showPodium ? "4" : "1"}–100`}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-display)", fontWeight: 700,
                            fontSize: 28, letterSpacing: "0.04em", textTransform: "uppercase",
                            color: "var(--asc-fg-0)", margin: 0,
                          }}
                        >
                          APEX 100 LADDER
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 11, color: "var(--asc-fg-3)",
                        }}
                      >
                        Updated just now
                      </span>
                    </div>

                    <div
                      style={{
                        position: "relative",
                        background: "var(--asc-bg-1)",
                        border: "1px solid var(--asc-line-soft)",
                      }}
                    >
                      {/* Corner mark */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute", top: 10, left: 10,
                          width: 14, height: 14, zIndex: 1, opacity: 0.6,
                        }}
                      >
                        <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: 1, background: "var(--asc-accent)" }} />
                        <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: 8, background: "var(--asc-accent)" }} />
                      </div>

                      {/* Header row */}
                      <div
                        style={{
                          display: "flex", gap: 8,
                          padding: "10px 18px",
                          borderBottom: "1px solid var(--asc-line-soft)",
                          background: "oklch(0.08 0.03 285)",
                        }}
                      >
                        {[
                          { l: "#", f: 0.4 },
                          { l: "Player", f: 2 },
                          { l: "Tier", f: 1.2 },
                          { l: "PTS", f: 0.8 },
                          { l: "K/D", f: 0.7 },
                          { l: "Win %", f: 0.7 },
                          { l: "Region", f: 0.9 },
                          { l: "Trend", f: 0.9 },
                          { l: "Δ7D", f: 0.7 },
                        ].map((h) => (
                          <span
                            key={h.l}
                            style={{
                              flex: h.f,
                              fontFamily: "var(--font-mono, monospace)",
                              fontSize: 10, color: "var(--asc-fg-3)",
                              letterSpacing: "0.16em", textTransform: "uppercase",
                            }}
                          >
                            {h.l}
                          </span>
                        ))}
                      </div>

                      {/* Data rows */}
                      {tableRows.map((player) => {
                        const trend = generateTrend(player.tournamentPoints, player.rank);
                        const delta = generateDelta(player.tournamentPoints, player.rank);
                        const kd = generateKD(player.rank);
                        const wr = generateWR(player.rank);
                        const tier = generateTierLabel(player.rank);
                        const region = getPlayerRegion(player.rank);
                        const flag = getPlayerFlag(player.rank);
                        const isCurrentUser = String(player.id) === currentUserId;

                        return (
                          <div
                            key={player.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "12px 18px",
                              borderTop: "1px solid var(--asc-line-soft)",
                              background: isCurrentUser
                                ? "oklch(0.20 0.12 285 / 0.15)"
                                : "transparent",
                            }}
                          >
                            {/* # */}
                            <span
                              style={{
                                flex: 0.4,
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: 13, color: "var(--asc-fg-3)", fontWeight: 600,
                              }}
                            >
                              {String(player.rank).padStart(2, "0")}
                            </span>

                            {/* Player */}
                            <div
                              style={{
                                flex: 2, display: "flex",
                                alignItems: "center", gap: 10,
                              }}
                            >
                              <AvatarSquare username={player.username} size={32} />
                              <div>
                                <div
                                  style={{
                                    display: "flex", alignItems: "center",
                                    gap: 6, lineHeight: 1.2,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 600, fontSize: 13,
                                      color: "var(--asc-fg-0)",
                                    }}
                                  >
                                    {player.username}
                                  </span>
                                  <span style={{ fontSize: 11 }}>{flag}</span>
                                  {isCurrentUser && (
                                    <span
                                      style={{
                                        fontFamily: "var(--font-mono, monospace)",
                                        fontSize: 9, color: "var(--asc-accent)",
                                        letterSpacing: "0.14em", marginLeft: 4,
                                      }}
                                    >
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "var(--font-mono, monospace)",
                                    fontSize: 10, color: "var(--asc-fg-3)",
                                  }}
                                >
                                  {region} · {player.role}
                                </div>
                              </div>
                            </div>

                            {/* Tier */}
                            <span style={{ flex: 1.2 }}>
                              <TierBadge tier={tier} />
                            </span>

                            {/* PTS */}
                            <span
                              style={{
                                flex: 0.8,
                                fontFamily: "var(--font-display)",
                                fontSize: 15, fontWeight: 700,
                                color: "var(--asc-fg-0)", letterSpacing: "0.02em",
                              }}
                            >
                              {player.tournamentPoints.toLocaleString()}
                            </span>

                            {/* K/D */}
                            <span
                              style={{
                                flex: 0.7,
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: 12, color: "var(--asc-fg-1)",
                              }}
                            >
                              {kd}
                            </span>

                            {/* Win% */}
                            <span
                              style={{
                                flex: 0.7,
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: 12, color: "var(--asc-fg-1)",
                              }}
                            >
                              {wr}%
                            </span>

                            {/* Region */}
                            <span
                              style={{
                                flex: 0.9,
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: 12, color: "var(--asc-fg-2)",
                              }}
                            >
                              {region}
                            </span>

                            {/* Trend sparkline */}
                            <span style={{ flex: 0.9 }}>
                              <Sparkline
                                values={trend}
                                id={String(player.id)}
                                width={60}
                                height={18}
                              />
                            </span>

                            {/* Δ7D */}
                            <span style={{ flex: 0.7 }}>
                              <Delta value={delta} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getDictionary, type HomeMessages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";
import Sparkline from "@/components/ui/Sparkline";

export const dynamic = "force-dynamic";

function generateTrend(points: number, rank: number, len = 9): number[] {
  return Array.from({ length: len }, (_, k) => {
    const base = points * 0.72;
    const wave = Math.sin(k * 1.3 + rank * 0.8) * points * 0.10;
    const rise = (k / (len - 1)) * points * 0.28;
    return Math.round(Math.max(0, base + wave + rise));
  });
}

type SnapshotMember = {
  userId?: string;
  username?: string;
};

type PlayerHubStats = {
  isLoggedIn: boolean;
  teamsCount: number;
  pendingInvitesCount: number;
  activeRegistrationsCount: number;
  tournamentResultsCount: number;
  tournamentPoints: number;
  bestPlacement: number | null;
};

type LiveMatchData = {
  id: string;
  round: number;
  matchNumber: number;
  status: string;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  teamA: { id: string; name: string } | null;
  teamB: { id: string; name: string } | null;
  tournament: { id: string; title: string };
};

type GameData = {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  defaultTeamSize: number;
  _count: { tournaments: number; teams: number };
};

type TopPlayer = {
  username: string;
  userId: string;
  points: number;
  placement: number | null;
};

type AnnouncementData = {
  id: string;
  title: string;
  category: string;
  description: string;
  createdAt: Date;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).home.metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
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

function getTournamentStatusLabel(
  status: string,
  messages: HomeMessages["statuses"],
) {
  const labels: Record<string, string> = {
    open: messages.tournamentOpen,
    upcoming: messages.upcoming,
    closed: messages.tournamentClosed,
    ended: messages.ended,
    cancelled: messages.cancelled,
  };

  return labels[status.toLowerCase()] || status;
}

function getRegistrationStatusLabel(
  status: string,
  messages: HomeMessages["statuses"],
) {
  const labels: Record<string, string> = {
    open: messages.registrationOpen,
    closed: messages.registrationClosed,
  };

  return labels[status.toLowerCase()] || status;
}

function getTournamentSortPriority(status: string) {
  const priorities: Record<string, number> = {
    open: 0,
    upcoming: 1,
    closed: 2,
    ended: 3,
    cancelled: 4,
  };

  return priorities[status.toLowerCase()] ?? 10;
}

function formatApplications(
  applications: number,
  messages: HomeMessages["tournaments"],
  locale: Locale,
) {
  if (locale === "ar") {
    return `${applications} ${
      applications === 1
        ? messages.applicationSubmitted
        : messages.applicationsSubmitted
    }`;
  }

  return `${applications} ${
    applications === 1
      ? messages.applicationSubmitted
      : messages.applicationsSubmitted
  }`;
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalized = status.toLowerCase().replace("registration ", "");

  const style =
    normalized === "open" || normalized === "approved"
      ? { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" }
      : normalized === "upcoming" || normalized === "registered"
        ? { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" }
        : normalized === "closed" || normalized === "rejected"
          ? { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }
          : normalized === "ended"
            ? { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" }
            : { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black"
      style={style}
    >
      {label || status}
    </span>
  );
}

const CUT8 = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center px-6 py-3 text-sm font-black text-white transition"
      style={{ background: "var(--asc-accent-2)", boxShadow: "0 0 20px var(--asc-accent-glow)", clipPath: CUT8 }}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center px-6 py-3 text-sm font-black transition"
      style={{ border: "1px solid var(--asc-line)", color: "var(--asc-fg-2)", clipPath: CUT8 }}
    >
      {children}
    </Link>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
        {label}
      </p>
      <h2 className="mt-2 text-3xl md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
          {description}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4" style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function ProgressBar({
  approvedSlots,
  maxSlots,
  approvedLabel,
}: {
  approvedSlots: number;
  maxSlots: number;
  approvedLabel: string;
}) {
  const progress =
    maxSlots > 0 ? Math.min((approvedSlots / maxSlots) * 100, 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
        <span>
          {approvedSlots}/{maxSlots} {approvedLabel}
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="asc-progress-track">
        <div className="asc-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function LiveMatchCard({ match }: { match: LiveMatchData }) {
  const isLive = match.status === "live";
  const teamATag = match.teamA ? match.teamA.name.slice(0, 2).toUpperCase() : "??";
  const teamBTag = match.teamB ? match.teamB.name.slice(0, 2).toUpperCase() : "??";

  return (
    <article
      className="overflow-hidden border"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", position: "relative" }}
    >
      <div className="grid gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <span className="asc-live-dot" />
                <span className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-live)" }}>
                  LIVE
                </span>
              </>
            ) : (
              <span className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                COMPLETED
              </span>
            )}
            <span className="text-xs font-bold truncate max-w-[140px]" style={{ color: "var(--asc-fg-3)" }}>
              · {match.tournament.title}
            </span>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center text-[10px] font-black text-white"
                style={{ background: "var(--asc-accent-2)" }}
              >
                {teamATag}
              </div>
              <span className="text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                {match.teamA?.name ?? "TBD"}
              </span>
            </div>
            <span className="text-xl font-black tabular-nums" style={{ color: "var(--asc-fg-0)" }}>
              {match.scoreA}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center text-[10px] font-black text-white"
                style={{ background: "oklch(0.55 0.14 150 / 0.8)" }}
              >
                {teamBTag}
              </div>
              <span className="text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                {match.teamB?.name ?? "TBD"}
              </span>
            </div>
            <span className="text-xl font-black tabular-nums" style={{ color: "var(--asc-fg-0)" }}>
              {match.scoreB}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
          <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
            ROUND {match.round}
          </span>
          <span style={{ color: "var(--asc-line)" }}>·</span>
          <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
            BO{match.bestOf}
          </span>
          <span style={{ color: "var(--asc-line)" }}>·</span>
          <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
            MATCH {match.matchNumber}
          </span>
        </div>
      </div>
    </article>
  );
}

function TournamentMiniCard({
  tournament,
  locale,
  messages,
}: {
  tournament: {
    id: string;
    title: string;
    game: { name: string; slug: string } | null;
    startsAt: Date | null;
    imageUrl: string | null;
    maxTeams: number;
    teamSize: number;
    status: string;
    registrationStatus: string;
    registrations: {
      id: string;
      status: string;
    }[];
  };
  locale: Locale;
  messages: HomeMessages;
}) {
  const approvedSlots = tournament.registrations.filter(
    (registration) => registration.status === "approved",
  ).length;

  const applications = tournament.registrations.length;
  const imageSrc = getTournamentImageUrl(tournament.game?.slug ?? null, tournament.imageUrl);

  return (
    <article
      className="overflow-hidden border transition"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="h-44 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, oklch(0.06 0.03 287 / 0.10), oklch(0.06 0.03 287 / 0.88)), url("${imageSrc}")`,
        }}
      />

      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            status={tournament.status}
            label={getTournamentStatusLabel(tournament.status, messages.statuses)}
          />
          <StatusBadge
            status={tournament.registrationStatus}
            label={getRegistrationStatusLabel(tournament.registrationStatus, messages.statuses)}
          />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
            {tournament.game?.name ?? "—"}
          </p>
          <h3 className="mt-2 text-2xl" style={{ color: "var(--asc-fg-0)" }}>
            {tournament.title}
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {tournament.startsAt?.toLocaleDateString() ?? "—"} · {tournament.teamSize}v{tournament.teamSize}
          </p>
        </div>

        <ProgressBar
          approvedSlots={approvedSlots}
          maxSlots={tournament.maxTeams}
          approvedLabel={messages.tournaments.approved}
        />

        <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
          {formatApplications(applications, messages.tournaments, locale)}
        </p>

        <Link
          href={`/tournaments/${tournament.id}`}
          className="px-5 py-3 text-center text-sm font-black text-white transition"
          style={{ background: "var(--asc-accent-2)" }}
        >
          {messages.tournaments.viewDetails}
        </Link>
      </div>
    </article>
  );
}

function JourneyRow({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <article
      className="grid gap-3 px-5 py-4 last:border-b-0 md:grid-cols-[80px_180px_minmax(0,1fr)] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p className="text-sm font-black" style={{ color: "var(--asc-accent)" }}>
        {String(index).padStart(2, "0")}
      </p>
      <h3 className="font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h3>
      <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{description}</p>
    </article>
  );
}

function PlayerHubSection({
  stats,
  messages,
}: {
  stats: PlayerHubStats;
  messages: HomeMessages["playerHub"];
}) {
  return (
    <section className="relative py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <section
          className="overflow-hidden border p-6 shadow-2xl"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                {messages.label}
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
                {stats.isLoggedIn ? messages.loggedInTitle : messages.guestTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
                {stats.isLoggedIn ? messages.loggedInDescription : messages.guestDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryLink href={stats.isLoggedIn ? "/profile" : "/login"}>
                  {stats.isLoggedIn ? messages.openProfile : messages.loginWithDiscord}
                </PrimaryLink>
                <SecondaryLink href="/tournaments">
                  {messages.viewTournaments}
                </SecondaryLink>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label={messages.stats.teams} value={stats.teamsCount} />
              <Stat label={messages.stats.invites} value={stats.pendingInvitesCount} />
              <Stat label={messages.stats.entries} value={stats.activeRegistrationsCount} />
              <Stat label={messages.stats.points} value={stats.tournamentPoints} />
              <Stat label={messages.stats.results} value={stats.tournamentResultsCount} />
              <Stat label={messages.stats.best} value={stats.bestPlacement ? `#${stats.bestPlacement}` : "-"} />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

async function getPlayerHubStats(): Promise<PlayerHubStats> {
  const session = await auth();

  if (!session?.user?.databaseId) {
    return {
      isLoggedIn: false,
      teamsCount: 0,
      pendingInvitesCount: 0,
      activeRegistrationsCount: 0,
      tournamentResultsCount: 0,
      tournamentPoints: 0,
      bestPlacement: null,
    };
  }

  const userId = session.user.databaseId;

  const [
    teamsCount,
    pendingInvitesCount,
    activeRegistrationsCount,
    tournamentResults,
  ] = await Promise.all([
    prisma.team.count({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    }),

    prisma.teamInvite.count({
      where: {
        invitedUserId: userId,
        status: "pending",
      },
    }),

    prisma.tournamentRegistration.count({
      where: {
        status: {
          in: ["registered", "approved"],
        },
        tournament: {
          status: {
            notIn: ["ended", "cancelled"],
          },
        },
        team: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    }),

    prisma.tournamentResult.findMany({
      select: {
        points: true,
        placement: true,
        snapshotMembers: true,
        team: {
          select: {
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let tournamentResultsCount = 0;
  let tournamentPoints = 0;
  let bestPlacement: number | null = null;

  for (const result of tournamentResults) {
    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);

    const resultUserIds =
      snapshotMembers.length > 0
        ? snapshotMembers
            .map((member) => member.userId)
            .filter((memberUserId): memberUserId is string =>
              Boolean(memberUserId),
            )
        : result.team.members.map((member) => member.userId);

    if (!resultUserIds.includes(userId)) {
      continue;
    }

    tournamentResultsCount += 1;
    tournamentPoints += result.points;
    bestPlacement =
      bestPlacement === null
        ? result.placement
        : Math.min(bestPlacement, result.placement);
  }

  return {
    isLoggedIn: true,
    teamsCount,
    pendingInvitesCount,
    activeRegistrationsCount,
    tournamentResultsCount,
    tournamentPoints,
    bestPlacement,
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const messages = getDictionary(locale).home;

  const [
    rawTournaments,
    playerHubStats,
    liveMatches,
    games,
    allResults,
    recentAnnouncements,
    totalUsers,
    activeTournamentCount,
  ] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        game: { select: { name: true, slug: true } },
        startsAt: true,
        prize: true,
        imageUrl: true,
        maxTeams: true,
        teamSize: true,
        status: true,
        registrationStatus: true,
        createdAt: true,
        registrations: {
          where: { status: { in: ["registered", "approved", "rejected"] } },
          select: { id: true, status: true },
        },
      },
    }),

    getPlayerHubStats(),

    prisma.match.findMany({
      where: { status: { in: ["live", "completed"] } },
      select: {
        id: true,
        round: true,
        matchNumber: true,
        status: true,
        bestOf: true,
        scoreA: true,
        scoreB: true,
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
        tournament: { select: { id: true, title: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 6,
    }),

    prisma.game.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        shortName: true,
        defaultTeamSize: true,
        _count: { select: { tournaments: true, teams: true } },
      },
      orderBy: { name: "asc" },
    }),

    prisma.tournamentResult.findMany({
      select: {
        points: true,
        placement: true,
        snapshotMembers: true,
        team: {
          select: {
            members: {
              select: {
                user: { select: { id: true, username: true } },
              },
            },
          },
        },
      },
    }),

    prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, category: true, description: true, createdAt: true },
    }),

    prisma.user.count(),

    prisma.tournament.count({ where: { status: { in: ["open", "upcoming"] } } }),
  ]);

  const tournaments = [...rawTournaments]
    .sort((a, b) => {
      const priorityA = getTournamentSortPriority(a.status);
      const priorityB = getTournamentSortPriority(b.status);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 3);

  const sortedMatches = [...liveMatches]
    .sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (a.status !== "live" && b.status === "live") return 1;
      return 0;
    })
    .slice(0, 3);

  // Aggregate top players from tournament results
  const playerMap = new Map<string, { username: string; points: number; placements: number[] }>();
  for (const result of allResults) {
    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);
    const members =
      snapshotMembers.length > 0
        ? snapshotMembers
            .filter((m) => Boolean(m.userId))
            .map((m) => ({ id: m.userId!, username: m.username ?? "Unknown" }))
        : result.team.members.map((m) => ({ id: m.user.id, username: m.user.username }));

    for (const member of members) {
      const existing = playerMap.get(member.id) ?? { username: member.username, points: 0, placements: [] };
      playerMap.set(member.id, {
        username: existing.username,
        points: existing.points + result.points,
        placements: [...existing.placements, result.placement],
      });
    }
  }

  const topPlayers: TopPlayer[] = Array.from(playerMap.entries())
    .map(([userId, data]) => ({
      userId,
      username: data.username,
      points: data.points,
      placement: data.placements.length > 0 ? Math.min(...data.placements) : null,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const placeholderGames: GameData[] = [
    { id: "val", name: "VALORANT", slug: "valorant", shortName: "VAL", defaultTeamSize: 5, _count: { tournaments: 0, teams: 0 } },
    { id: "cs2", name: "CS2", slug: "cs2", shortName: "CS2", defaultTeamSize: 5, _count: { tournaments: 0, teams: 0 } },
    { id: "lol", name: "LEAGUE OF LEGENDS", slug: "league-of-legends", shortName: "LOL", defaultTeamSize: 5, _count: { tournaments: 0, teams: 0 } },
    { id: "dota", name: "DOTA 2", slug: "dota2", shortName: "D2", defaultTeamSize: 5, _count: { tournaments: 0, teams: 0 } },
    { id: "bf", name: "BATTLEFIELD", slug: "battlefield", shortName: "BF", defaultTeamSize: 5, _count: { tournaments: 0, teams: 0 } },
  ];
  const displayGames = games.length > 0 ? games : placeholderGames;

  const placeholderAnnouncements: AnnouncementData[] = [
    { id: "a1", title: "Season 7 Group Stage Schedule Confirmed", category: "TOURNAMENT", description: "All 32 slots are filled. The group stage draw has been completed and schedules are now live.", createdAt: new Date(Date.now() - 12 * 3600000) },
    { id: "a2", title: "Anti-Cheat System v2.0 Deployed", category: "PLATFORM", description: "Enhanced behavioral detection now active across all supported titles. Zero-tolerance enforcement.", createdAt: new Date(Date.now() - 36 * 3600000) },
    { id: "a3", title: "MENA Region Dedicated Servers Are Live", category: "COMMUNITY", description: "Dedicated low-latency servers for Middle East and North Africa players are now online.", createdAt: new Date(Date.now() - 2 * 86400000) },
    { id: "a4", title: "Organizer Tools Beta Now Open", category: "PLATFORM", description: "Apply for early access to bracket management, team approval, and tournament scheduling tools.", createdAt: new Date(Date.now() - 3 * 86400000) },
  ];
  const displayAnnouncements = recentAnnouncements.length > 0 ? recentAnnouncements : placeholderAnnouncements;

  const featuredTournament = tournaments[0] ?? null;
  const featuredApprovedSlots = featuredTournament
    ? featuredTournament.registrations.filter((r) => r.status === "approved").length
    : 0;
  const featuredDaysUntil = featuredTournament?.startsAt
    ? Math.max(0, Math.ceil((featuredTournament.startsAt.getTime() - Date.now()) / 86400000))
    : null;
  const featuredHoursUntil = featuredTournament?.startsAt
    ? Math.max(0, Math.floor(((featuredTournament.startsAt.getTime() - Date.now()) % 86400000) / 3600000))
    : null;
  const featuredMinsUntil = featuredTournament?.startsAt
    ? Math.max(0, Math.floor(((featuredTournament.startsAt.getTime() - Date.now()) % 3600000) / 60000))
    : null;

  return (
    <main className="asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section
          style={{
            position: "relative",
            minHeight: 720,
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          {/* Background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: 'url("/images/backgrounds/home-hero.webp")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              zIndex: 0,
            }}
          />
          {/* Dual overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.55) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.4) 35%, transparent 70%)",
              ].join(", "),
              zIndex: 1,
            }}
          />

          {/* Content */}
          <div
            className="relative w-full"
            style={{ zIndex: 2, maxWidth: 1480, margin: "0 auto", padding: "56px 32px" }}
          >
            <div className="grid gap-14 lg:grid-cols-[3fr_2fr] lg:items-end">

              {/* Left column */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--asc-fg-2)",
                    marginBottom: 22,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ color: "var(--asc-accent)" }}>▲</span>
                  {" ASCENDRA · SEASON 07 · A PREMIUM ESPORTS PLATFORM"}
                </div>

                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(48px, 6.4vw, 108px)",
                    lineHeight: 0.92,
                    letterSpacing: "-0.005em",
                    textTransform: "uppercase",
                    color: "var(--asc-fg-0)",
                    margin: 0,
                  }}
                >
                  Rise<br />
                  <span
                    style={{
                      background: "linear-gradient(92deg, var(--asc-accent) 0%, oklch(0.85 0.10 245) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Beyond limits.
                  </span>
                </h1>

                <p
                  style={{
                    color: "var(--asc-fg-1)",
                    fontSize: 17,
                    maxWidth: 480,
                    marginTop: 26,
                    lineHeight: 1.55,
                  }}
                >
                  {messages.hero.description}
                </p>

                <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
                  <Link
                    href="/tournaments"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "16px 26px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 14,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      background: "var(--asc-fg-0)",
                      color: "oklch(0.08 0.02 285)",
                      border: "1px solid var(--asc-fg-0)",
                      clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
                      textDecoration: "none",
                    }}
                  >
                    Browse tournaments ›
                  </Link>
                  <Link
                    href="/community"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "16px 26px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 14,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      background: "transparent",
                      color: "var(--asc-fg-0)",
                      border: "1px solid var(--asc-line)",
                      clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
                      textDecoration: "none",
                    }}
                  >
                    Join Discord
                  </Link>
                </div>
              </div>

              {/* Right column — Featured event card */}
              <div
                style={{
                  position: "relative",
                  background: "oklch(0.08 0.03 285 / 0.7)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid var(--asc-line)",
                  clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                  padding: 20,
                }}
              >
                {/* Corner mark */}
                <div aria-hidden="true" style={{ position: "absolute", top: 10, left: 10, width: 14, height: 14, pointerEvents: "none", opacity: 0.6 }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: 1, background: "var(--asc-accent)" }} />
                  <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: 8, background: "var(--asc-accent)" }} />
                </div>

                {/* Status chip */}
                <div style={{ marginBottom: 14 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 8px 4px 6px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--asc-accent)",
                      background: "oklch(0.22 0.10 285 / 0.20)",
                      border: "1px solid var(--asc-accent-dim)",
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--asc-accent)", display: "inline-block", flexShrink: 0 }} />
                    Featured · Season 7
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 26,
                    lineHeight: 1.05,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "var(--asc-fg-0)",
                    margin: "0 0 4px",
                  }}
                >
                  {featuredTournament?.title ?? "ASCENDRA MAJOR · SEASON 7"}
                </h2>
                <p style={{ color: "var(--asc-fg-2)", fontSize: 13, marginBottom: 20 }}>
                  {featuredTournament?.game?.name
                    ? `${featuredTournament.game.name} · Open qualifier`
                    : "The crown returns to the arena"}
                </p>

                <div
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--asc-fg-2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ color: "var(--asc-accent)" }}>▲</span> Group stage begins in
                </div>

                <div style={{ display: "flex", gap: 20, marginBottom: 22 }}>
                  {[
                    { v: featuredDaysUntil !== null ? String(featuredDaysUntil) : "–", l: "DAYS" },
                    { v: featuredHoursUntil !== null ? String(featuredHoursUntil) : "–", l: "HRS" },
                    { v: featuredMinsUntil !== null ? String(featuredMinsUntil) : "–", l: "MIN" },
                  ].map(({ v, l }) => (
                    <div key={l}>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: 36,
                          lineHeight: 1,
                          color: "var(--asc-fg-0)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {v}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 9,
                          fontWeight: 600,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--asc-fg-3)",
                          marginTop: 4,
                        }}
                      >
                        {l}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ height: 1, background: "var(--asc-line-soft)", marginBottom: 16 }} />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
                  {[
                    { k: "Prize", v: featuredTournament?.prize ?? "–", accent: true },
                    {
                      k: "Slots",
                      v: featuredTournament
                        ? `${featuredApprovedSlots}/${featuredTournament.maxTeams}`
                        : "–",
                      accent: false,
                    },
                    { k: "Region", v: "Global", accent: false },
                  ].map(({ k, v, accent }) => (
                    <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 10,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--asc-fg-3)",
                        }}
                      >
                        {k}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: 20,
                          letterSpacing: "0.02em",
                          color: accent ? "var(--asc-prize)" : "var(--asc-fg-0)",
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={featuredTournament ? `/tournaments/${featuredTournament.id}` : "/tournaments"}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "12px 18px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 13,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    background: "var(--asc-accent)",
                    color: "oklch(0.10 0.02 285)",
                    boxShadow: "0 0 24px var(--asc-accent-glow)",
                    clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                    textDecoration: "none",
                  }}
                >
                  Register team ›
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* Ticker Bar */}
        <div
          className="asc-ticker-track"
          style={{
            background: "oklch(0.12 0.03 287 / 0.60)",
            borderTop: "1px solid var(--asc-line-soft)",
            borderBottom: "1px solid var(--asc-line-soft)",
            padding: "10px 0",
          }}
        >
          <div className="asc-ticker-inner">
            {[0, 1].map((copy) => (
              <span key={copy} className="inline-flex items-center gap-0" aria-hidden={copy === 1 ? true : undefined}>
                {[
                  { text: "NVX", highlight: true },
                  { text: "13 · OBLK 11", highlight: false },
                  { text: " · MAP 3 ASCENT", highlight: false },
                  { text: "  ◈ UP NEXT", highlight: true },
                  { text: "  CRSH VS VRGE · 00:42", highlight: false },
                  { text: "  ◈ QUALIFIERS", highlight: true },
                  { text: "  RIFT OPEN — 96/128 TEAMS REGISTERED", highlight: false },
                  { text: "  ◈ SEASON 7", highlight: true },
                  { text: "  ASCENDRA MAJOR · GROUP STAGE BEGINS IN 21 DAYS", highlight: false },
                  { text: "  ◈ RANKINGS UPDATED", highlight: true },
                  { text: "  NOVA VORTEX CLIMBS TO #1 IN MENA", highlight: false },
                  { text: "  ◈ LIVE NOW", highlight: true },
                  { text: "  3 MATCHES IN PROGRESS · 184.2K WATCHING", highlight: false },
                  { text: "  ✦ ", highlight: false },
                ].map((segment, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "0 4px",
                      color: segment.highlight ? "var(--asc-accent)" : "var(--asc-fg-3)",
                    }}
                  >
                    {segment.text}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* Live Matches */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                  ▲ BROADCASTS
                </p>
                <h2 className="mt-2 text-3xl md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
                  LIVE NOW
                </h2>
              </div>
              <Link
                href="/tournaments"
                className="text-xs font-black uppercase tracking-[0.14em] transition hover:opacity-70"
                style={{ color: "var(--asc-accent)" }}
              >
                ALL MATCHES ›
              </Link>
            </div>

            {sortedMatches.length === 0 ? (
              <div className="border p-8 text-center" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
                <p className="text-sm font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
                  No live matches right now
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                  Check back during tournament events
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedMatches.map((match) => (
                  <LiveMatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tournaments */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label={messages.tournaments.label}
              title={messages.tournaments.title}
              description={messages.tournaments.description}
            />

            {tournaments.length === 0 ? (
              <div className="border p-6" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-2)" }}>
                {messages.tournaments.empty}
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {tournaments.map((tournament) => (
                  <TournamentMiniCard
                    key={tournament.id}
                    tournament={tournament}
                    locale={locale}
                    messages={messages}
                  />
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <SecondaryLink href="/tournaments">{messages.tournaments.viewAll}</SecondaryLink>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label={messages.flow.label}
              title={messages.flow.title}
              description={messages.flow.description}
            />

            <section
              className="overflow-hidden border shadow-2xl"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
            >
              {messages.flow.steps.map((step, index) => (
                <JourneyRow
                  key={step.title}
                  index={index + 1}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </section>
          </div>
        </section>

        {/* Pick Your Arena */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                  ▲ COMPETITIVE TITLES · {String(displayGames.length).padStart(2, "0")}
                </p>
                <h2 className="mt-2 text-3xl md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
                  PICK YOUR ARENA
                </h2>
              </div>
              <Link
                href="/games"
                className="text-xs font-black uppercase tracking-[0.14em] transition hover:opacity-70"
                style={{ color: "var(--asc-accent)" }}
              >
                GAMES REGISTRY ›
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {displayGames.slice(0, 5).map((game) => {
                const imgSrc = getTournamentImageUrl(game.slug, null);
                return (
                  <article
                    key={game.id}
                    className="overflow-hidden border transition hover:opacity-90"
                    style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", position: "relative" }}
                  >
                    <div
                      className="h-40 bg-cover bg-center"
                      style={{
                        backgroundColor: "var(--asc-bg-2)",
                        backgroundImage: `linear-gradient(to bottom, oklch(0.06 0.03 287 / 0.10), oklch(0.06 0.03 287 / 0.70)), url("${imgSrc}")`,
                      }}
                    />
                    <div className="p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>
                        {game._count.tournaments} TOURNAMENT{game._count.tournaments !== 1 ? "S" : ""}
                      </p>
                      <h3 className="mt-1 text-base" style={{ color: "var(--asc-fg-0)" }}>
                        {game.name}
                      </h3>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--asc-fg-3)" }}>
                        {game.defaultTeamSize}v{game.defaultTeamSize} · {game._count.teams} TEAMS
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top of the Ladder + Discord */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">

              {/* Leaderboard */}
              <div>
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                      ▲ APEX 100
                    </p>
                    <h2 className="mt-2 text-3xl md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
                      TOP OF THE LADDER
                    </h2>
                  </div>
                  <Link
                    href="/leaderboard"
                    className="text-xs font-black uppercase tracking-[0.14em] transition hover:opacity-70"
                    style={{ color: "var(--asc-accent)" }}
                  >
                    FULL LADDER ›
                  </Link>
                </div>

                <div className="border" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", position: "relative" }}>
                  <div aria-hidden="true" style={{ position: "absolute", top: 10, left: 10, width: 14, height: 14, zIndex: 1, opacity: 0.6 }}>
                    <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: 1, background: "var(--asc-accent)" }} />
                    <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: 8, background: "var(--asc-accent)" }} />
                  </div>
                  {topPlayers.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
                        Rankings coming soon
                      </p>
                      <p className="mt-2 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                        Complete tournaments to appear on the leaderboard
                      </p>
                    </div>
                  ) : (
                    topPlayers.map((player, index) => {
                      const trend = generateTrend(player.points, index + 1);
                      return (
                        <div
                          key={player.userId}
                          className="flex items-center gap-4 px-5 py-4"
                          style={{
                            borderBottom: index < topPlayers.length - 1 ? "1px solid var(--asc-line-soft)" : undefined,
                            borderLeft: index === 0 ? "2px solid var(--asc-accent)" : "2px solid transparent",
                          }}
                        >
                          <span
                            className="w-8 shrink-0 text-sm font-black tabular-nums"
                            style={{ color: index === 0 ? "var(--asc-accent)" : "var(--asc-fg-3)" }}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center text-[11px] font-black text-white"
                            style={{ background: index === 0 ? "var(--asc-accent-2)" : "var(--asc-bg-3)" }}
                          >
                            {player.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                              {player.username}
                            </p>
                            {player.placement !== null && (
                              <p className="text-[10px] font-bold uppercase" style={{ color: "var(--asc-fg-3)" }}>
                                BEST #{player.placement}
                              </p>
                            )}
                          </div>
                          <Sparkline values={trend} id={player.userId} width={56} height={18} />
                          <span className="shrink-0 text-sm font-black tabular-nums" style={{ color: "var(--asc-prize)" }}>
                            {player.points.toLocaleString()} PTS
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Discord + Stats */}
              <div className="grid gap-4">
                <div
                  className="overflow-hidden border p-6"
                  style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", position: "relative" }}
                >
                  <div aria-hidden="true" style={{ position: "absolute", top: 10, left: 10, width: 14, height: 14, zIndex: 1, opacity: 0.6 }}>
                    <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: 1, background: "var(--asc-accent)" }} />
                    <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: 8, background: "var(--asc-accent)" }} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                    🎮 COMMUNITY
                  </p>
                  <h3 className="mt-2 text-xl" style={{ color: "var(--asc-fg-0)" }}>
                    THE ASCENDRA DISCORD
                  </h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>
                    184K members. Live tournament rooms, team recruitment, and real-time match updates.
                  </p>
                  <div className="mt-4 flex gap-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
                        MEMBERS
                      </p>
                      <p className="mt-0.5 text-lg font-black" style={{ color: "var(--asc-fg-0)" }}>184.2K</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
                        ONLINE NOW
                      </p>
                      <p className="mt-0.5 text-lg font-black" style={{ color: "var(--asc-green)" }}>28.4K</p>
                    </div>
                  </div>
                  <Link
                    href="/community"
                    className="mt-5 flex w-full items-center justify-center py-3 text-sm font-black text-white transition hover:opacity-90"
                    style={{ background: "var(--asc-accent-2)", clipPath: CUT8 }}
                  >
                    JOIN THE SERVER ›
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4" style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>PLAYERS</p>
                    <p className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {totalUsers > 0 ? (totalUsers >= 1000 ? `${(totalUsers / 1000).toFixed(1)}K` : String(totalUsers)) : "—"}
                    </p>
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--asc-green)" }}>↑ GROWING</p>
                  </div>
                  <div className="p-4" style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>ACTIVE TOURNAMENTS</p>
                    <p className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{activeTournamentCount}</p>
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--asc-fg-3)" }}>OPEN & UPCOMING</p>
                  </div>
                  <div className="p-4" style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>GAMES SUPPORTED</p>
                    <p className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {games.length > 0 ? games.length : "5+"}
                    </p>
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--asc-fg-3)" }}>ACROSS TITLES</p>
                  </div>
                  <div className="p-4" style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>PRIZE POOLED</p>
                    <p className="mt-1 text-xl font-black" style={{ color: "var(--asc-prize)" }}>$2.1M</p>
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--asc-fg-3)" }}>SEASON 7 TO DATE</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Latest Announcements */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                ▲ FROM THE DESK
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
                LATEST ANNOUNCEMENTS
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {displayAnnouncements.map((item, index) => {
                const msAgo = Date.now() - item.createdAt.getTime();
                const hoursAgo = Math.round(msAgo / 3600000);
                const timeLabel = hoursAgo < 24 ? `${hoursAgo}H AGO` : `${Math.round(hoursAgo / 24)}D AGO`;
                const excerpt = item.description.length > 120 ? `${item.description.slice(0, 120)}…` : item.description;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden border p-5"
                    style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", position: "relative" }}
                  >
                    <p
                      className="text-[48px] font-black leading-none tabular-nums"
                      style={{ color: "var(--asc-bg-3)", fontFamily: "var(--font-display)" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                      {item.category} · {timeLabel}
                    </p>
                    <h3 className="mt-2 text-lg" style={{ color: "var(--asc-fg-0)" }}>
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
                      {excerpt}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <SecondaryLink href="/announcements">ALL ANNOUNCEMENTS ›</SecondaryLink>
            </div>
          </div>
        </section>

        <PlayerHubSection stats={playerHubStats} messages={messages.playerHub} />

        <Footer />
      </div>
    </main>
  );
}

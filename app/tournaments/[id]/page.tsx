import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import TournamentDetailsRealtime from "@/components/TournamentDetailsRealtime";
import TournamentLifecycleRefresh from "@/components/TournamentLifecycleRefresh";
import TournamentMatchesSection, {
  type TournamentMatchesSectionLabels,
} from "@/components/TournamentMatchesSection";
import { TournamentRegistrationPanel } from "@/components/TournamentRegistrationPanel";
import {
  getDictionary,
  type Locale,
  type TournamentDetailsMessages,
} from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { syncTournamentLifecycleForTournament } from "@/lib/jobs/tournamentLifecycleJobs";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";
import { isCs2Game } from "@/lib/isCs2Game";
import { computeCs2Readiness } from "@/lib/cs2AccountReadiness";
import type { Cs2Readiness } from "@/lib/cs2AccountReadiness";
import { isRiotGame } from "@/lib/isRiotGame";
import { computeRiotAccountReadiness } from "@/lib/riotAccountReadiness";
import type { RiotAccountReadiness } from "@/lib/riotAccountReadiness";

export const dynamic = "force-dynamic";

type TournamentDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type SnapshotMember = {
  userId?: string;
  username?: string;
};

const pageCopy: Record<
  Locale,
  {
    breadcrumb: string;
    overview: string;
    schedule: string;
    teamsTab: string;
    prizes: string;
    rules: string;
    summaryEyebrow: string;
    summaryTitle: string;
    registrationEyebrow: string;
    teamsEyebrow: string;
    matchesEyebrow: string;
    resultsEyebrow: string;
    registerTeam: string;
    viewBracket: string;
    slotsLocked: string;
    applications: string;
    approved: string;
    prizePool: string;
    teams: string;
    startsIn: string;
    days: string;
    date: string;
    format: string;
    game: string;
    teamSize: string;
    registrationStatus: string;
    noRulesTitle: string;
    noRulesBody: string;
    noScheduleTitle: string;
    noScheduleBody: string;
    round: string;
    vs: string;
    view: string;
    moreMatchesPrefix: string;
  }
> = {
  en: {
    breadcrumb: "Tournaments",
    overview: "Overview",
    schedule: "Schedule",
    teams: "Teams",
    prizes: "Prizes",
    rules: "Rules",
    summaryEyebrow: "The major · Summary",
    summaryTitle: "Tournament overview",
    registrationEyebrow: "Registration",
    teamsEyebrow: "Teams",
    matchesEyebrow: "Bracket",
    resultsEyebrow: "Prizes",
    registerTeam: "Register team",
    viewBracket: "View bracket",
    slotsLocked: "teams locked",
    applications: "applications",
    approved: "approved",
    prizePool: "Prize pool",
    teamsTab: "Teams",
    startsIn: "Starts in",
    days: "days",
    date: "Date",
    format: "Format",
    game: "Game",
    teamSize: "Team size",
    registrationStatus: "Registration",
    noRulesTitle: "Rules are managed by the tournament staff.",
    noRulesBody:
      "Official rules, check-in flow, match reporting, and dispute handling are confirmed by the organizers before the event starts.",
    noScheduleTitle: "Schedule will appear when matches are generated.",
    noScheduleBody:
      "Once the bracket or match schedule is created, all rounds will be listed in this section.",
    round: "Round",
    vs: "vs",
    view: "View →",
    moreMatchesPrefix: "more · see full bracket below",
  },
  ar: {
    breadcrumb: "البطولات",
    overview: "نظرة عامة",
    schedule: "الجدول",
    teamsTab: "الفرق",
    prizes: "الجوائز",
    rules: "القوانين",
    summaryEyebrow: "البطولة · ملخص",
    summaryTitle: "نظرة عامة على البطولة",
    registrationEyebrow: "التسجيل",
    teamsEyebrow: "الفرق",
    matchesEyebrow: "القوس",
    resultsEyebrow: "الجوائز",
    registerTeam: "تسجيل الفريق",
    viewBracket: "عرض القوس",
    slotsLocked: "فرق مقبولة",
    applications: "طلبات",
    approved: "مقبول",
    prizePool: "مجموع الجوائز",
    teams: "الفرق",
    startsIn: "تبدأ خلال",
    days: "يوم",
    date: "التاريخ",
    format: "النظام",
    game: "اللعبة",
    teamSize: "حجم الفريق",
    registrationStatus: "التسجيل",
    noRulesTitle: "تتم إدارة القوانين من قبل منظمي البطولة.",
    noRulesBody:
      "يتم تأكيد القوانين الرسمية، وآلية الحضور، وتسجيل النتائج، والتعامل مع الاعتراضات من قبل المنظمين قبل بداية البطولة.",
    noScheduleTitle: "سيظهر الجدول عند إنشاء المباريات.",
    noScheduleBody:
      "عند إنشاء القوس أو جدول المباريات، ستظهر كل الجولات في هذا القسم.",
    round: "الجولة",
    vs: "ضد",
    view: "← عرض",
    moreMatchesPrefix: "أكثر · انظر القوس الكامل أدناه",
  },
};

const matchSectionCopy: Record<Locale, TournamentMatchesSectionLabels> = {
  en: {
    scheduleEyebrow: "Schedule",
    matchesTitle: "Matches",
    roundPrefix: "Round",
    matchCenter: "Match Center →",
    live: "Live",
    statuses: {
      scheduled: "Scheduled",
      ready: "Ready",
      room_created: "Room Created",
      in_progress: "Live",
      result_pending: "Result Pending",
      disputed: "Disputed",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      forfeit: "Forfeit",
      bye: "Bye",
    },
  },
  ar: {
    scheduleEyebrow: "الجدول",
    matchesTitle: "المباريات",
    roundPrefix: "الجولة",
    matchCenter: "← مركز المباريات",
    live: "مباشر",
    statuses: {
      scheduled: "مجدولة",
      ready: "جاهزة",
      room_created: "الغرفة مُنشأة",
      in_progress: "مباشرة",
      result_pending: "في انتظار النتيجة",
      disputed: "متنازع عليها",
      confirmed: "مؤكدة",
      completed: "منتهية",
      cancelled: "ملغاة",
      forfeit: "خسارة بالتنازل",
      bye: "تأهل تلقائي",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).tournamentDetails.metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function Pill({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "green" | "red" | "blue" | "gray" | "violet";
}) {
  const styleMap: Record<string, CSSProperties> = {
    green: {
      color: "var(--asc-green)",
      borderColor: "oklch(0.55 0.14 150 / 0.5)",
      background: "oklch(0.25 0.12 150 / 0.18)",
    },
    red: {
      color: "var(--asc-live)",
      borderColor: "oklch(0.50 0.20 25 / 0.5)",
      background: "oklch(0.25 0.18 25 / 0.18)",
    },
    blue: {
      color: "var(--asc-blue)",
      borderColor: "oklch(0.55 0.12 220 / 0.5)",
      background: "oklch(0.25 0.10 220 / 0.18)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
    violet: {
      color: "var(--asc-accent)",
      borderColor: "oklch(0.50 0.20 285 / 0.4)",
      background: "var(--asc-accent-dim)",
    },
  };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
      style={styleMap[tone]}
    >
      {children}
    </span>
  );
}

function getTournamentStatusLabel(
  status: string,
  messages: TournamentDetailsMessages["statuses"],
) {
  const labels: Record<string, string> = {
    open: messages.open,
    upcoming: messages.upcoming,
    closed: messages.closed,
    ended: messages.ended,
    cancelled: messages.cancelled,
  };

  return labels[status.toLowerCase()] || status;
}

function getRegistrationStatusLabel(
  status: string,
  messages: TournamentDetailsMessages["statuses"],
) {
  const labels: Record<string, string> = {
    open: messages.registrationOpen,
    closed: messages.registrationClosed,
  };

  return labels[status.toLowerCase()] || status;
}

function getRegistrationReviewStatusLabel(
  status: string,
  messages: TournamentDetailsMessages["statuses"],
) {
  const labels: Record<string, string> = {
    registered: messages.registered,
    approved: messages.approved,
    rejected: messages.rejected,
    cancelled: messages.cancelled,
  };

  return labels[status.toLowerCase()] || status;
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalizedStatus = status.toLowerCase().replace("registration ", "");

  const tone =
    normalizedStatus === "open" || normalizedStatus === "approved"
      ? "green"
      : normalizedStatus === "upcoming" ||
          normalizedStatus === "pending" ||
          normalizedStatus === "registered"
        ? "blue"
        : normalizedStatus === "closed" || normalizedStatus === "rejected"
          ? "red"
          : normalizedStatus === "ended"
            ? "violet"
            : "gray";

  return <Pill tone={tone}>{label || status}</Pill>;
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-4xl font-black tabular-nums md:text-5xl"
        style={{
          color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function PanelHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div
      className="px-5 py-4"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p
        className="asc-section-label"
      >
        ▲ {eyebrow}
      </p>
      <h2 className="mt-1 text-xl" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h2>
    </div>
  );
}

function InfoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className="relative border p-5"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <p
        className="text-[10px] font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-black tabular-nums"
        style={{
          color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(date: Date, locale: Locale) {
  return date.toLocaleString(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateOnly(date: Date | null, locale: Locale) {
  if (!date) {
    return "—";
  }

  return date.toLocaleDateString(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  });
}

function getDaysUntil(date: Date | null) {
  if (!date) {
    return "21";
  }

  return String(
    Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000)),
  );
}

function getSnapshotMemberCount(
  snapshotMembers: unknown,
  fallbackCount: number,
) {
  return Array.isArray(snapshotMembers)
    ? snapshotMembers.length
    : fallbackCount;
}

function PlacementBadge({ placement }: { placement: number }) {
  const tone = placement === 1 ? "green" : placement <= 3 ? "blue" : "violet";

  return <Pill tone={tone}>#{placement}</Pill>;
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
      <div
        className="flex items-center justify-between gap-4 text-xs font-bold"
        style={{ color: "var(--asc-fg-3)" }}
      >
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

function formatTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function getUnavailableTeamReason({
  teamGame,
  tournamentGame,
  memberCount,
  teamSize,
  pendingInvites,
  messages,
}: {
  teamGame: string;
  tournamentGame: string;
  memberCount: number;
  teamSize: number;
  pendingInvites: number;
  messages: TournamentDetailsMessages["labels"]["unavailableReasons"];
}) {
  if (teamGame !== tournamentGame) {
    return messages.wrongGame;
  }

  if (memberCount < teamSize) {
    const missingPlayers = teamSize - memberCount;

    return missingPlayers === 1
      ? messages.needsMorePlayer
      : formatTemplate(messages.needsMorePlayers, {
          count: String(missingPlayers),
        });
  }

  if (pendingInvites > 0) {
    return messages.pendingInvites;
  }

  return messages.notEligible;
}

function getPlayerLabel(
  count: number,
  messages: TournamentDetailsMessages["labels"],
) {
  return count === 1 ? messages.player : messages.players;
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

export default async function TournamentDetailsPage({
  params,
  searchParams,
}: TournamentDetailsPageProps) {
  const [{ id }, noticeParams, session, locale] = await Promise.all([
    params,
    searchParams,
    auth(),
    getLocale(),
  ]);

  await syncTournamentLifecycleForTournament(id);

  const messages = getDictionary(locale).tournamentDetails;
  const copy = pageCopy[locale];

  const currentUser = session?.user?.databaseId
    ? await prisma.user.findUnique({
        where: {
          id: session.user.databaseId,
        },
        include: {
          ownedTeams: {
            include: {
              members: true,
              invites: {
                where: { status: "pending" },
                select: { id: true },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          playerGameAccounts: {
            where: { provider: { in: ["steam", "riot_lol"] } },
            select: { provider: true, externalId: true },
          },
        },
      })
    : null;

  const [tournament, rawTournamentMatches] = await Promise.all([
    prisma.tournament.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        game: { select: { name: true, slug: true } },
        gameId: true,
        description: true,
        startsAt: true,
        endsAt: true,
        registrationOpensAt: true,
        registrationClosesAt: true,
        prize: true,
        imageUrl: true,
        maxTeams: true,
        teamSize: true,
        status: true,
        registrationStatus: true,
        results: {
          select: {
            id: true,
            placement: true,
            points: true,
            note: true,
            snapshotTeamName: true,
            snapshotTeamGame: true,
            snapshotMembers: true,
            team: {
              select: {
                id: true,
                name: true,
                gameId: true,
                members: {
                  include: {
                    user: true,
                  },
                  orderBy: {
                    joinedAt: "asc",
                  },
                },
              },
            },
          },
          orderBy: [
            {
              placement: "asc",
            },
            {
              awardedAt: "desc",
            },
          ],
        },
        registrations: {
          where: {
            status: {
              in: ["registered", "approved", "rejected"],
            },
          },
          select: {
            id: true,
            status: true,
            teamId: true,
            createdAt: true,
            snapshotTeamName: true,
            snapshotTeamGame: true,
            snapshotMembers: true,
            team: {
              select: {
                id: true,
                name: true,
                gameId: true,
                members: {
                  include: {
                    user: true,
                  },
                  orderBy: {
                    joinedAt: "asc",
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      select: {
        id: true,
        roundNumber: true,
        matchNumber: true,
        status: true,
        bestOf: true,
        isBye: true,
        teamAId: true,
        teamBId: true,
        winnerTeamId: true,
        scheduledAt: true,
      },
      orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }],
    }),
  ]);

  if (!tournament) {
    notFound();
  }

  // Batch-load team names for all tournament matches (TournamentMatch has no teamA/teamB relation)
  const matchTeamIds = [
    ...new Set(
      rawTournamentMatches
        .flatMap((m) => [m.teamAId, m.teamBId, m.winnerTeamId])
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const matchTeamRows =
    matchTeamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: matchTeamIds } },
          select: { id: true, name: true },
        })
      : [];
  const matchTeamName = new Map(matchTeamRows.map((t) => [t.id, t.name]));

  const tournamentMatches = rawTournamentMatches.map((m) => ({
    id: m.id,
    roundNumber: m.roundNumber,
    matchNumber: m.matchNumber,
    status: m.status,
    bestOf: m.bestOf,
    isBye: m.isBye,
    teamAId: m.teamAId,
    teamBId: m.teamBId,
    winnerTeamId: m.winnerTeamId,
    scheduledAt: m.scheduledAt,
    teamAName: m.teamAId ? (matchTeamName.get(m.teamAId) ?? null) : null,
    teamBName: m.teamBId ? (matchTeamName.get(m.teamBId) ?? null) : null,
    winnerName: m.winnerTeamId ? (matchTeamName.get(m.winnerTeamId) ?? null) : null,
  }));

  const tournamentImage = getTournamentImageUrl(
    tournament.game?.slug ?? null,
    tournament.imageUrl,
  );

  const isCs2 = isCs2Game(tournament.game?.slug, tournament.game?.name);
  const isRiot = isRiotGame(tournament.game?.slug, tournament.game?.name);

  const steamAccount = currentUser?.playerGameAccounts?.find(
    (a) => a.provider === "steam",
  );
  const riotAccount = currentUser?.playerGameAccounts?.find(
    (a) => a.provider === "riot_lol",
  );

  const cs2Readiness: Cs2Readiness = computeCs2Readiness({
    steamId64: steamAccount?.externalId ?? null,
    faceitPlayerId: currentUser?.faceitPlayerId ?? null,
    faceitSteamId64: currentUser?.faceitSteamId64 ?? null,
  });

  const riotReadiness: RiotAccountReadiness = computeRiotAccountReadiness({
    gameSlug: tournament.game?.slug ?? null,
    gameName: tournament.game?.name ?? undefined,
    riotExternalId: riotAccount?.externalId ?? null,
  });

  const ownedTeamIds = currentUser?.ownedTeams.map((team) => team.id) || [];

  const userTournamentRegistrations =
    currentUser && ownedTeamIds.length > 0
      ? await prisma.tournamentRegistration.findMany({
          where: {
            tournamentId: tournament.id,
            teamId: {
              in: ownedTeamIds,
            },
          },
          include: {
            team: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : [];

  const approvedRegistrations = tournament.registrations.filter(
    (registration) => registration.status === "approved",
  );

  const submittedRegistrations = tournament.registrations.filter(
    (registration) =>
      ["registered", "approved", "rejected"].includes(registration.status),
  );

  const approvedSlots = approvedRegistrations.length;
  const totalApplications = submittedRegistrations.length;
  const remainingSlots = Math.max(tournament.maxTeams - approvedSlots, 0);
  const daysUntil = getDaysUntil(tournament.startsAt);

  const openRegistrationTeamIds = new Set(
    userTournamentRegistrations
      .filter((registration) =>
        ["registered", "approved"].includes(registration.status),
      )
      .map((registration) => registration.teamId),
  );

  const registerableOwnedTeams =
    currentUser?.ownedTeams.filter(
      (team) => !openRegistrationTeamIds.has(team.id),
    ) || [];

  const availableTeams = registerableOwnedTeams
    .filter((team) => {
      const gameMatches = team.gameId === tournament.gameId;
      const hasEnoughPlayers = team.members.length >= tournament.teamSize;
      const hasNoPendingInvites = team.invites.length === 0;

      return gameMatches && hasEnoughPlayers && hasNoPendingInvites;
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((team) => ({
      id: team.id,
      name: team.name,
      game: tournament.game?.name ?? null,
      memberCount: team.members.length,
    }));

  const unavailableTeams = registerableOwnedTeams
    .filter((team) => {
      const gameMatches = team.gameId === tournament.gameId;
      const hasEnoughPlayers = team.members.length >= tournament.teamSize;
      const hasNoPendingInvites = team.invites.length === 0;

      return !gameMatches || !hasEnoughPlayers || !hasNoPendingInvites;
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((team) => ({
      id: team.id,
      name: team.name,
      game: tournament.game?.name ?? null,
      memberCount: team.members.length,
      reason: getUnavailableTeamReason({
        teamGame: team.gameId ?? "",
        tournamentGame: tournament.gameId ?? "",
        memberCount: team.members.length,
        teamSize: tournament.teamSize,
        pendingInvites: team.invites.length,
        messages: messages.labels.unavailableReasons,
      }),
    }));

  const activeRegistrations = userTournamentRegistrations
    .filter((registration) => registration.status !== "cancelled")
    .map((registration) => ({
      id: registration.id,
      status: registration.status,
      teamName: registration.team.name,
      rejectionReason: registration.rejectionReason,
    }));

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="asc-image-card relative min-h-[620px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${tournamentImage}")` }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.06 0.03 287 / 0.96) 0%, oklch(0.06 0.03 287 / 0.76) 44%, oklch(0.06 0.03 287 / 0.28) 100%)",
            }}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-56"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <Link
              href="/tournaments"
              className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] transition hover:opacity-75"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {locale === "ar" ? "→" : "←"} {copy.breadcrumb}
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={tournament.status}
                label={getTournamentStatusLabel(
                  tournament.status,
                  messages.statuses,
                )}
              />
              <StatusBadge
                status={`Registration ${tournament.registrationStatus}`}
                label={getRegistrationStatusLabel(
                  tournament.registrationStatus,
                  messages.statuses,
                )}
              />
              {tournament.game && (
                <Pill tone="violet">{tournament.game.name}</Pill>
              )}
              <Pill>
                {tournament.teamSize}v{tournament.teamSize}
              </Pill>
            </div>

            <h1
              className="mt-8 max-w-5xl text-5xl md:text-7xl lg:text-8xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {tournament.title}
            </h1>

            {tournament.description && (
              <p
                className="mt-5 max-w-3xl text-base leading-7"
                style={{ color: "var(--asc-fg-2)" }}
              >
                {tournament.description}
              </p>
            )}

            <div className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
              <StatBlock
                label={copy.prizePool}
                value={tournament.prize ?? "—"}
                accent
              />
              <StatBlock
                label={copy.teams}
                value={
                  <>
                    {approvedSlots}
                    <span
                      className="text-2xl"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      /{tournament.maxTeams}
                    </span>
                  </>
                }
              />
              <StatBlock
                label={copy.startsIn}
                value={
                  <>
                    {daysUntil}
                    <span
                      className="ml-2 text-xl"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {copy.days}
                    </span>
                  </>
                }
              />
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#registration"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:opacity-90"
                style={{
                  background: "var(--asc-accent-2)",
                  clipPath:
                    "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                }}
              >
                {copy.registerTeam} ›
              </a>

              <a
                href="#bracket"
                className="inline-flex items-center justify-center border px-6 py-3 text-sm font-black uppercase tracking-[0.08em] transition hover:opacity-80"
                style={{
                  borderColor: "var(--asc-line)",
                  color: "var(--asc-fg-1)",
                  background: "var(--asc-card-muted)",
                  clipPath:
                    "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                }}
              >
                ▷ {copy.viewBracket}
              </a>
            </div>
          </div>
        </section>

        {/* Sticky tabs */}
        <div
          className="sticky top-0 z-30 border-y backdrop-blur"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-nav-bg)",
          }}
        >
          <div className="mx-auto flex max-w-[1680px] items-center gap-1 overflow-x-auto px-6 lg:px-10 2xl:px-14">
            {[
              { label: copy.overview, href: "#overview" },
              { label: copy.schedule, href: "#schedule" },
              { label: copy.teamsTab, href: "#teams" },
              { label: copy.prizes, href: "#prizes" },
              { label: copy.rules, href: "#rules" },
            ].map((tab) => (
              <a
                key={tab.href}
                href={tab.href}
                className="asc-tab-link shrink-0"
                data-active={tab.href === "#overview" ? "true" : "false"}
              >
                {tab.label}
              </a>
            ))}

            <span className="ml-auto hidden text-[10px] font-black uppercase tracking-[0.14em] md:block">
              <span style={{ color: "var(--asc-accent)" }}>●</span>{" "}
              <span style={{ color: "var(--asc-fg-3)" }}>
                {approvedSlots}/{tournament.maxTeams} {copy.slotsLocked}
              </span>
            </span>
          </div>
        </div>

        <section className="relative mx-auto grid max-w-[1680px] gap-10 px-6 py-10 lg:px-10 2xl:px-14">
          <ProfileNotice
            message={noticeParams.message}
            error={noticeParams.error}
          />
          <TournamentDetailsRealtime tournamentId={tournament.id} />
          <TournamentLifecycleRefresh
            registrationOpensAt={
              tournament.registrationOpensAt?.toISOString() ?? null
            }
            registrationClosesAt={
              tournament.registrationClosesAt?.toISOString() ?? null
            }
            startsAt={tournament.startsAt?.toISOString() ?? null}
            endsAt={tournament.endsAt?.toISOString() ?? null}
          />

          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <div
              className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]"
              style={{ alignItems: "start" }}
            >
              <div
                className="relative overflow-hidden border"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-1)",
                }}
              >
                <PanelHeader
                  eyebrow={copy.summaryEyebrow}
                  title={copy.summaryTitle}
                />

                <div className="grid gap-5 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard
                      label={copy.date}
                      value={formatDateOnly(tournament.startsAt, locale)}
                    />
                    <InfoCard
                      label={copy.game}
                      value={tournament.game?.name ?? "—"}
                      accent
                    />
                    <InfoCard
                      label={copy.teamSize}
                      value={`${tournament.teamSize}v${tournament.teamSize}`}
                    />
                    <InfoCard
                      label={copy.registrationStatus}
                      value={getRegistrationStatusLabel(
                        tournament.registrationStatus,
                        messages.statuses,
                      )}
                    />
                  </div>

                  <div
                    className="border p-5"
                    style={{
                      borderColor: "var(--asc-line-soft)",
                      background: "var(--asc-bg-2)",
                    }}
                  >
                    <ProgressBar
                      approvedSlots={approvedSlots}
                      maxSlots={tournament.maxTeams}
                      approvedLabel={messages.labels.approved}
                    />

                    <p
                      className="mt-3 text-sm"
                      style={{ color: "var(--asc-fg-3)" }}
                    >
                      {totalApplications}{" "}
                      {totalApplications === 1
                        ? messages.labels.applicationSubmitted
                        : messages.labels.applicationsSubmitted}
                      {" · "}
                      {remainingSlots}{" "}
                      {remainingSlots === 1
                        ? messages.labels.slotsLeft
                        : messages.labels.slotsLeft}
                    </p>
                  </div>
                </div>
              </div>

              <div
                id="registration"
                className="scroll-mt-28 overflow-hidden border shadow-2xl"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-1)",
                }}
              >
                <PanelHeader
                  eyebrow={copy.registrationEyebrow}
                  title={messages.labels.registerYourTeam}
                />

                <div className="p-5">
                  <TournamentRegistrationPanel
                    tournamentId={tournament.id}
                    tournamentStatus={tournament.status}
                    tournamentStatusLabel={getTournamentStatusLabel(
                      tournament.status,
                      messages.statuses,
                    )}
                    registrationStatus={tournament.registrationStatus}
                    slotsRemaining={remainingSlots}
                    teamSize={tournament.teamSize}
                    isLoggedIn={Boolean(currentUser)}
                    isGuildMember={Boolean(currentUser?.isGuildMember)}
                    availableTeams={availableTeams}
                    unavailableTeams={unavailableTeams}
                    activeRegistrations={activeRegistrations}
                    messages={messages.panel}
                    statusLabels={messages.statuses}
                    playerLabel={messages.labels.player}
                    playersLabel={messages.labels.players}
                    isCs2={isCs2}
                    cs2Readiness={cs2Readiness}
                    isRiot={isRiot}
                    riotReadiness={riotReadiness}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section id="schedule" className="scroll-mt-28">
            <div
              className="overflow-hidden border"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
              }}
            >
              <PanelHeader eyebrow={copy.schedule} title={copy.schedule} />

              {tournamentMatches.length === 0 ? (
                <div className="p-6">
                  <h3 className="text-xl" style={{ color: "var(--asc-fg-0)" }}>
                    {copy.noScheduleTitle}
                  </h3>
                  <p
                    className="mt-2 max-w-2xl text-sm leading-6"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    {copy.noScheduleBody}
                  </p>
                </div>
              ) : (
                <div>
                  {tournamentMatches.slice(0, 8).map((match) => {
                    const teamAName = match.teamAName ?? "TBD";
                    const teamBName = match.isBye ? "BYE" : (match.teamBName ?? "TBD");
                    const teamAWon =
                      Boolean(match.winnerTeamId) && match.winnerTeamId === match.teamAId;
                    const teamBWon =
                      Boolean(match.winnerTeamId) && match.winnerTeamId === match.teamBId;

                    return (
                      <Link
                        key={match.id}
                        href={`/tournaments/${id}/matches/${match.id}`}
                        className="grid gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025] md:grid-cols-[100px_minmax(0,1fr)_80px_90px] md:items-center"
                        style={{ borderTop: "1px solid var(--asc-line-soft)" }}
                      >
                        <p
                          className="text-xs font-black uppercase tracking-[0.14em]"
                          style={{ color: "var(--asc-accent)" }}
                        >
                          {copy.round} {match.roundNumber}
                        </p>
                        <p className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                          <span
                            style={{ color: teamAWon ? "var(--asc-green)" : undefined }}
                          >
                            {teamAName}
                          </span>
                          {" "}
                          <span style={{ color: "var(--asc-fg-3)" }}>{copy.vs}</span>
                          {" "}
                          <span
                            style={{ color: teamBWon ? "var(--asc-green)" : undefined }}
                          >
                            {teamBName}
                          </span>
                        </p>
                        <StatusBadge status={match.status} label={match.status} />
                        <span
                          className="text-xs font-black uppercase tracking-[0.08em]"
                          style={{ color: "var(--asc-accent)" }}
                        >
                          {copy.view}
                        </span>
                      </Link>
                    );
                  })}
                  {tournamentMatches.length > 8 && (
                    <p
                      className="px-5 py-3 text-xs"
                      style={{
                        borderTop: "1px solid var(--asc-line-soft)",
                        color: "var(--asc-fg-3)",
                      }}
                    >
                      +{tournamentMatches.length - 8} {copy.moreMatchesPrefix}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Teams */}
          <section id="teams" className="scroll-mt-28">
            <div
              className="overflow-hidden border shadow-2xl"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
              }}
            >
              <PanelHeader
                eyebrow={copy.teamsEyebrow}
                title={messages.labels.applications}
              />

              {tournament.registrations.length === 0 ? (
                <div className="p-5" style={{ color: "var(--asc-fg-2)" }}>
                  {messages.labels.noTeamsRegistered}
                </div>
              ) : (
                <div>
                  {tournament.registrations.map((registration) => {
                    const teamName =
                      registration.snapshotTeamName || registration.team.name;
                    const teamGame =
                      registration.snapshotTeamGame ??
                      tournament.game?.name ??
                      "—";
                    const memberCount = getSnapshotMemberCount(
                      registration.snapshotMembers,
                      registration.team.members.length,
                    );

                    return (
                      <div
                        key={registration.id}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_120px_150px] md:items-center"
                        style={{
                          borderBottom: "1px solid var(--asc-line-soft)",
                        }}
                      >
                        <div>
                          <p
                            className="font-black"
                            style={{ color: "var(--asc-fg-0)" }}
                          >
                            {teamName}
                          </p>
                          <p
                            className="mt-1 text-sm"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {teamGame} · {memberCount}/{tournament.teamSize}{" "}
                            {getPlayerLabel(memberCount, messages.labels)}
                          </p>
                        </div>

                        <StatusBadge
                          status={registration.status}
                          label={getRegistrationReviewStatusLabel(
                            registration.status,
                            messages.statuses,
                          )}
                        />

                        <p
                          className="text-sm"
                          style={{ color: "var(--asc-fg-3)" }}
                        >
                          {formatDate(registration.createdAt, locale)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Bracket / Matches */}
          <section id="bracket" className="scroll-mt-28">
            <div id="matches" className="scroll-mt-28">
              <div className="mb-4">
                <p
                  className="text-xs font-black uppercase tracking-[0.18em]"
                  style={{ color: "var(--asc-accent)" }}
                >
                  ▲ {copy.matchesEyebrow}
                </p>
                <h2
                  className="mt-2 text-3xl md:text-4xl"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  {copy.viewBracket}
                </h2>
              </div>

              <TournamentMatchesSection
                tournamentId={id}
                matches={tournamentMatches}
                locale={locale}
                labels={matchSectionCopy[locale]}
              />
            </div>
          </section>

          {/* Prizes / Results */}
          <section id="prizes" className="scroll-mt-28">
            <div
              className="overflow-hidden border shadow-2xl"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
              }}
            >
              <PanelHeader
                eyebrow={copy.resultsEyebrow}
                title={messages.labels.finalStandings}
              />

              {tournament.results.length === 0 ? (
                <div className="grid gap-4 p-5 md:grid-cols-3">
                  <InfoCard label="#1" value={tournament.prize ?? "—"} accent />
                  <InfoCard label="#2" value="—" />
                  <InfoCard label="#3" value="—" />
                </div>
              ) : (
                <div>
                  {tournament.results.map((result) => {
                    const teamName =
                      result.snapshotTeamName || result.team.name;
                    const teamGame =
                      result.snapshotTeamGame ?? tournament.game?.name ?? "—";
                    const memberCount = getSnapshotMemberCount(
                      result.snapshotMembers,
                      result.team.members.length,
                    );

                    return (
                      <article
                        key={result.id}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[100px_minmax(0,1fr)_120px] md:items-center"
                        style={{
                          borderBottom: "1px solid var(--asc-line-soft)",
                        }}
                      >
                        <PlacementBadge placement={result.placement} />

                        <div>
                          <p
                            className="font-black"
                            style={{ color: "var(--asc-fg-0)" }}
                          >
                            {teamName}
                          </p>

                          <p
                            className="mt-1 text-sm"
                            style={{ color: "var(--asc-fg-3)" }}
                          >
                            {teamGame} · {memberCount}{" "}
                            {getPlayerLabel(memberCount, messages.labels)}
                          </p>

                          {result.note && (
                            <p
                              className="mt-2 text-sm"
                              style={{ color: "var(--asc-fg-3)" }}
                            >
                              {result.note}
                            </p>
                          )}
                        </div>

                        <Pill tone="green">
                          {result.points} {messages.labels.points}
                        </Pill>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Rules */}
          <section id="rules" className="scroll-mt-28">
            <div
              className="overflow-hidden border"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-1)",
              }}
            >
              <PanelHeader eyebrow={copy.rules} title={copy.rules} />

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div
                  className="border p-5"
                  style={{
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-bg-2)",
                  }}
                >
                  <h3 className="text-xl" style={{ color: "var(--asc-fg-0)" }}>
                    {copy.noRulesTitle}
                  </h3>
                  <p
                    className="mt-3 text-sm leading-6"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    {copy.noRulesBody}
                  </p>
                </div>

                <div
                  className="border p-5"
                  style={{
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-bg-2)",
                  }}
                >
                  <div className="grid gap-3">
                    {[
                      `${copy.game}: ${tournament.game?.name ?? "—"}`,
                      `${copy.teamSize}: ${tournament.teamSize}v${tournament.teamSize}`,
                      `${copy.registrationStatus}: ${getRegistrationStatusLabel(
                        tournament.registrationStatus,
                        messages.statuses,
                      )}`,
                      `${copy.teams}: ${approvedSlots}/${tournament.maxTeams}`,
                    ].map((item) => (
                      <p
                        key={item}
                        className="text-sm font-bold"
                        style={{ color: "var(--asc-fg-2)" }}
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>

        <Footer />
      </div>
    </main>
  );
}

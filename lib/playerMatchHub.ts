import { MatchStatus, ReportStatus } from "@prisma/client";

import { isCs2Game } from "@/lib/isCs2Game";
import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlayerMatchSide = "A" | "B";

export type MatchHubCard = {
  matchId: string;
  tournamentId: string;
  tournamentTitle: string;
  gameName: string | null;
  gameSlug: string | null;
  isCs2: boolean;
  matchHref: string;
  roundNumber: number;
  matchNumber: number;
  status: string;
  scheduledAt: Date | null;
  playerTeamId: string | null;
  playerTeamName: string | null;
  opponentTeamId: string | null;
  opponentTeamName: string | null;
  faceitMatchUrl: string | null;
  hasRoomReady: boolean;
  userHasSubmittedReport: boolean;
  opponentHasSubmittedReport: boolean;
  userCheckedIn: boolean;
  nextActionKey: PlayerMatchNextActionKey;
};

export type PlayerMatchNextActionKey =
  | "openMatch"
  | "waitingOpponent"
  | "waitingSchedule"
  | "submitResult"
  | "waitingOpponentReport"
  | "adminReview"
  | "completed"
  | "cancelled";

// ─── Pure helpers (exported for tests) ────────────────────────────────────────

export function determineUserSide(
  match: { teamAId: string | null; teamBId: string | null },
  userTeamIds: ReadonlySet<string>,
): PlayerMatchSide | null {
  if (match.teamAId && userTeamIds.has(match.teamAId)) return "A";
  if (match.teamBId && userTeamIds.has(match.teamBId)) return "B";
  return null;
}

export function getOpponentTeamId(
  match: { teamAId: string | null; teamBId: string | null },
  userSide: PlayerMatchSide,
): string | null {
  return userSide === "A" ? match.teamBId : match.teamAId;
}

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    scheduled: "Scheduled",
    ready: "Scheduled",
    room_created: "Room ready",
    in_progress: "In progress",
    result_pending: "Result pending",
    disputed: "Admin review",
    confirmed: "Completed",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  ar: {
    scheduled: "مجدولة",
    ready: "مجدولة",
    room_created: "الغرفة جاهزة",
    in_progress: "جارية",
    result_pending: "بانتظار النتيجة",
    disputed: "مراجعة إدارية",
    confirmed: "مكتملة",
    completed: "مكتملة",
    cancelled: "ملغاة",
  },
};

export function getPlayerMatchStatusLabel(status: string, locale: Locale): string {
  return STATUS_LABELS[locale][status] ?? status;
}

type RawMatchRow = {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchNumber: number;
  status: string;
  teamAId: string | null;
  teamBId: string | null;
  isBye: boolean;
  scheduledAt: Date | null;
  faceitMatchUrl: string | null;
  tournament: {
    title: string;
    game: { slug: string; name: string } | null;
  };
  reports: { teamId: string; status: string }[];
  room: { joinUrl: string | null; roomCode: string | null } | null;
  checkIns: { id: string }[];
};

export function getPlayerMatchNextActionKey(match: {
  status: string;
  scheduledAt: Date | null;
  opponentTeamId: string | null;
  isBye: boolean;
  userHasSubmittedReport: boolean;
  opponentHasSubmittedReport: boolean;
}): PlayerMatchNextActionKey {
  if (match.status === "cancelled") return "cancelled";
  if (["confirmed", "completed", "forfeit", "bye"].includes(match.status)) {
    return "completed";
  }
  if (match.status === "disputed") return "adminReview";
  if (!match.opponentTeamId && !match.isBye) return "waitingOpponent";
  if (!match.scheduledAt) return "waitingSchedule";
  if (match.userHasSubmittedReport && !match.opponentHasSubmittedReport) {
    return "waitingOpponentReport";
  }
  if (
    !match.userHasSubmittedReport &&
    ["in_progress", "result_pending"].includes(match.status)
  ) {
    return "submitResult";
  }

  return "openMatch";
}

export function normalizeMatchHubCard(
  match: RawMatchRow,
  teamMap: ReadonlyMap<string, { id: string; name: string }>,
  userTeamIds: ReadonlySet<string>,
): MatchHubCard {
  const side = determineUserSide(match, userTeamIds);
  const playerTeamId =
    side === "A" ? match.teamAId : side === "B" ? match.teamBId : null;
  const opponentTeamId = side ? getOpponentTeamId(match, side) : null;
  const userHasSubmittedReport = playerTeamId
    ? match.reports.some(
        (report) =>
          report.teamId === playerTeamId && report.status === "submitted",
      )
    : false;
  const opponentHasSubmittedReport = opponentTeamId
    ? match.reports.some(
        (report) =>
          report.teamId === opponentTeamId && report.status === "submitted",
      )
    : false;
  const hasRoomReady = Boolean(
    match.room?.joinUrl || match.room?.roomCode || match.faceitMatchUrl,
  );
  const nextActionKey = getPlayerMatchNextActionKey({
    status: match.status,
    scheduledAt: match.scheduledAt,
    opponentTeamId,
    isBye: match.isBye,
    userHasSubmittedReport,
    opponentHasSubmittedReport,
  });

  return {
    matchId: match.id,
    tournamentId: match.tournamentId,
    tournamentTitle: match.tournament.title,
    gameName: match.tournament.game?.name ?? null,
    gameSlug: match.tournament.game?.slug ?? null,
    isCs2: isCs2Game(match.tournament.game?.slug, match.tournament.game?.name),
    matchHref: `/tournaments/${match.tournamentId}/matches/${match.id}`,
    roundNumber: match.roundNumber,
    matchNumber: match.matchNumber,
    status: match.status,
    scheduledAt: match.scheduledAt,
    playerTeamId,
    playerTeamName: playerTeamId ? (teamMap.get(playerTeamId)?.name ?? null) : null,
    opponentTeamId,
    opponentTeamName: opponentTeamId
      ? (teamMap.get(opponentTeamId)?.name ?? null)
      : null,
    faceitMatchUrl: match.faceitMatchUrl,
    hasRoomReady,
    userHasSubmittedReport,
    opponentHasSubmittedReport,
    userCheckedIn: match.checkIns.length > 0,
    nextActionKey,
  };
}

// ─── DB query ─────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES: MatchStatus[] = [
  MatchStatus.scheduled,
  MatchStatus.ready,
  MatchStatus.room_created,
  MatchStatus.in_progress,
  MatchStatus.result_pending,
  MatchStatus.disputed,
];

export async function getActiveMatchesForUser(userId: string): Promise<MatchHubCard[]> {
  const userTeamRows = await prisma.team.findMany({
    where: {
      OR: [
        { leaderId: userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  const userTeamIdList = userTeamRows.map((t) => t.id);
  if (userTeamIdList.length === 0) return [];

  const userTeamIds = new Set(userTeamIdList);

  const matchRows = await prisma.tournamentMatch.findMany({
    where: {
      isBye: false,
      status: { in: ACTIVE_STATUSES },
      OR: [
        { teamAId: { in: userTeamIdList } },
        { teamBId: { in: userTeamIdList } },
      ],
    },
    select: {
      id: true,
      tournamentId: true,
      roundNumber: true,
      matchNumber: true,
      status: true,
      teamAId: true,
      teamBId: true,
      isBye: true,
      scheduledAt: true,
      faceitMatchUrl: true,
      tournament: {
        select: {
          title: true,
          game: { select: { slug: true, name: true } },
        },
      },
      reports: {
        where: { status: ReportStatus.submitted },
        select: { teamId: true, status: true },
      },
      room: {
        select: {
          joinUrl: true,
          roomCode: true,
        },
      },
      checkIns: {
        where: { userId },
        select: { id: true },
      },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: 8,
  });

  if (matchRows.length === 0) return [];

  const teamIdSet = new Set<string>();
  for (const m of matchRows) {
    if (m.teamAId) teamIdSet.add(m.teamAId);
    if (m.teamBId) teamIdSet.add(m.teamBId);
  }

  const teamRows = await prisma.team.findMany({
    where: { id: { in: [...teamIdSet] } },
    select: { id: true, name: true },
  });

  const teamMap = new Map(teamRows.map((t) => [t.id, t]));

  return matchRows.map((match) =>
    normalizeMatchHubCard(match, teamMap, userTeamIds),
  );
}

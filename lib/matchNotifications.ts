import { Prisma } from "@prisma/client";

import {
  createNotificationsOnceForUsers,
  getAdminNotificationUserIds,
} from "@/lib/notifications";
import { sendDiscordNotificationsToUsers } from "@/lib/discordNotificationBridge";
import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";
import {
  getServerLogErrorMessage,
  logServerBotError,
  logServerTournamentAction,
} from "@/lib/serverDiscordLogs";

export type MatchNotificationMatch = {
  id: string;
  tournamentId: string;
  roundNumber?: number | null;
  matchNumber?: number | null;
  teamAId?: string | null;
  teamBId?: string | null;
  winnerTeamId?: string | null;
  scheduledAt?: Date | null;
};

export type MatchNotificationScore = {
  teamAScore?: number | null;
  teamBScore?: number | null;
};

type TeamRecipient = {
  id: string;
  name: string;
  leaderId: string;
  members: Array<{ userId: string }>;
};

type CreateMatchNotificationOptions = {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  match: MatchNotificationMatch;
  dedupeKey: string;
  metadata?: Record<string, Prisma.InputJsonValue | null>;
};

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
  );
}

function matchHref(match: MatchNotificationMatch) {
  return `/tournaments/${match.tournamentId}/matches/${match.id}`;
}

export function getMatchNotificationHref(match: MatchNotificationMatch) {
  return matchHref(match);
}

export function getAdminMatchNotificationHref(match: MatchNotificationMatch) {
  return `/admin/tournaments/${match.tournamentId}/matches#match-${match.id}`;
}

function matchLabel(match: {
  roundNumber?: number | null;
  matchNumber?: number | null;
}) {
  if (
    typeof match.roundNumber === "number" &&
    typeof match.matchNumber === "number"
  ) {
    return `Round ${match.roundNumber}, Match ${match.matchNumber}`;
  }

  return "Match";
}

async function loadTeams(
  teamIds: Array<string | null | undefined>,
): Promise<Map<string, TeamRecipient>> {
  const ids = uniqueStrings(teamIds);

  if (ids.length === 0) {
    return new Map();
  }

  const teams = await prisma.team.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      name: true,
      leaderId: true,
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  return new Map(teams.map((team) => [team.id, team]));
}

function teamName(
  teams: Map<string, TeamRecipient>,
  teamId: string | null | undefined,
) {
  if (!teamId) return "TBD";
  return teams.get(teamId)?.name ?? "TBD";
}

function leaderIdsForTeams(
  teams: Map<string, TeamRecipient>,
  teamIds: Array<string | null | undefined>,
) {
  return uniqueStrings(
    teamIds.map((teamId) => (teamId ? teams.get(teamId)?.leaderId : null)),
  );
}

function memberIdsForTeams(
  teams: Map<string, TeamRecipient>,
  teamIds: Array<string | null | undefined>,
) {
  const userIds: string[] = [];

  for (const teamId of uniqueStrings(teamIds)) {
    const team = teams.get(teamId);
    if (!team) continue;

    userIds.push(team.leaderId);
    for (const member of team.members) {
      userIds.push(member.userId);
    }
  }

  return uniqueStrings(userIds);
}

function excludeUserIds(userIds: string[], excludedUserIds: string[]) {
  const excluded = new Set(excludedUserIds);
  return userIds.filter((userId) => !excluded.has(userId));
}

function opponentTeamId(match: MatchNotificationMatch, teamId: string) {
  if (match.teamAId === teamId) return match.teamBId ?? null;
  if (match.teamBId === teamId) return match.teamAId ?? null;
  return null;
}

function scoreLabel(score?: MatchNotificationScore | null) {
  if (
    typeof score?.teamAScore === "number" &&
    typeof score.teamBScore === "number"
  ) {
    return `${score.teamAScore}-${score.teamBScore}`;
  }

  return null;
}

function formatMatchTime(value?: Date | null) {
  if (!value) {
    return "-";
  }

  return `<t:${Math.floor(value.getTime() / 1000)}:F>`;
}

function formatMatchTeams(
  teams: Map<string, TeamRecipient>,
  match: MatchNotificationMatch,
) {
  return `${teamName(teams, match.teamAId)} vs ${teamName(
    teams,
    match.teamBId,
  )}`;
}

async function loadMatchLogDetails(match: MatchNotificationMatch) {
  return prisma.tournamentMatch.findUnique({
    where: { id: match.id },
    select: {
      id: true,
      roundNumber: true,
      matchNumber: true,
      scheduledAt: true,
      tournament: { select: { title: true } },
      reports: {
        where: { status: "confirmed" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { teamAScore: true, teamBScore: true },
      },
    },
  });
}

async function logMatchNotificationFailure(input: {
  title: string;
  error: unknown;
  match: MatchNotificationMatch;
}) {
  await logServerBotError({
    title: input.title,
    description: getServerLogErrorMessage(input.error),
    fields: [
      { name: "Match ID", value: input.match.id, inline: false },
      { name: "Tournament ID", value: input.match.tournamentId, inline: false },
    ],
  });
}

async function logMatchScheduledToTournamentChannel(
  match: MatchNotificationMatch,
  teams: Map<string, TeamRecipient>,
) {
  try {
    const details = await loadMatchLogDetails(match);

    await logServerTournamentAction({
      title: "Match scheduled",
      fields: [
        {
          name: "Tournament",
          value: details?.tournament.title || match.tournamentId,
          inline: false,
        },
        { name: "Match", value: matchLabel(details ?? match) },
        { name: "Teams", value: formatMatchTeams(teams, match), inline: false },
        { name: "Time", value: formatMatchTime(details?.scheduledAt) },
      ],
    });
  } catch (error) {
    await logMatchNotificationFailure({
      title: "Match scheduled log failed",
      error,
      match,
    });
  }
}

async function logMatchConfirmedToTournamentChannel(
  match: MatchNotificationMatch,
  teams: Map<string, TeamRecipient>,
  winnerTeamId: string,
  score?: MatchNotificationScore | null,
) {
  try {
    const details = await loadMatchLogDetails(match);
    const resultScore =
      scoreLabel(score) ||
      scoreLabel(details?.reports[0] ?? null) ||
      "Confirmed";

    await logServerTournamentAction({
      title: "Match result confirmed",
      fields: [
        {
          name: "Tournament",
          value: details?.tournament.title || match.tournamentId,
          inline: false,
        },
        { name: "Match", value: matchLabel(details ?? match) },
        { name: "Result", value: resultScore },
        { name: "Winner", value: teamName(teams, winnerTeamId) },
      ],
    });
  } catch (error) {
    await logMatchNotificationFailure({
      title: "Match result log failed",
      error,
      match,
    });
  }
}

function logMatchDmFailure(
  title: string,
  match: MatchNotificationMatch,
  error: unknown,
) {
  void logMatchNotificationFailure({
    title,
    error,
    match,
  }).catch(() => {});
}

async function createMatchNotifications({
  userIds,
  type,
  title,
  message,
  match,
  dedupeKey,
  metadata,
}: CreateMatchNotificationOptions) {
  try {
    await createNotificationsOnceForUsers({
      userIds,
      type,
      title,
      message,
      href: matchHref(match),
      dedupeKey,
      metadata: {
        matchId: match.id,
        tournamentId: match.tournamentId,
        ...(metadata ?? {}),
      },
    });
  } catch (error) {
    console.error("[matchNotifications] Failed to create notification:", error);
  }
}

async function publishMatchRealtimeEvent(
  match: MatchNotificationMatch,
  type: string,
  audiences: Array<"public" | "admin"> = ["public"],
) {
  await Promise.all(
    audiences.map((audience) =>
      createRealtimeEvent({
        type,
        audience,
        entityType: "tournamentMatch",
        entityId: match.id,
        payload: {
          matchId: match.id,
          tournamentId: match.tournamentId,
        },
      }),
    ),
  ).catch((error) => {
    console.error("[matchNotifications] Failed to publish realtime event:", error);
  });
}

export async function notifyMatchScheduled(
  match: MatchNotificationMatch,
  updateKey = "initial",
) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
  await logMatchScheduledToTournamentChannel(match, teams);

  const userIds = memberIdsForTeams(teams, [match.teamAId, match.teamBId]);

  if (userIds.length === 0) return;

  const title = "Match scheduled";
  const message = `${teamName(teams, match.teamAId)} vs ${teamName(teams, match.teamBId)} is scheduled.`;

  await createMatchNotifications({
    userIds,
    type: "match.scheduled",
    title,
    message,
    match,
    dedupeKey: `match.scheduled:${match.id}:${updateKey}`,
  });

  void sendDiscordNotificationsToUsers({
    userIds,
    title,
    message,
    href: matchHref(match),
  }).catch((error) => logMatchDmFailure("Match scheduled DM failed", match, error));
}

export async function notifyMatchRoomReady(match: MatchNotificationMatch) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
  const userIds = memberIdsForTeams(teams, [match.teamAId, match.teamBId]);

  if (userIds.length === 0) return;

  await createMatchNotifications({
    userIds,
    type: "match.room_ready",
    title: "Room details are available",
    message: "Room details are available for your match.",
    match,
    dedupeKey: `match.room.ready:${match.id}`,
  });

  await publishMatchRealtimeEvent(match, "tournament.match.room_linked", [
    "public",
    "admin",
  ]);

  void sendDiscordNotificationsToUsers({
    userIds,
    title: "Room details are available",
    message: "Room details are available for your match.",
    href: matchHref(match),
  }).catch(() => {});
}

export async function notifyManualResultSubmitted(
  match: MatchNotificationMatch,
  submittingTeamId: string,
  reportId: string,
) {
  const teams = await loadTeams([match.teamAId, match.teamBId, submittingTeamId]);
  const opponentId = opponentTeamId(match, submittingTeamId);
  const adminUserIds = await getAdminNotificationUserIds();
  const opponentLeaderIds = excludeUserIds(
    leaderIdsForTeams(teams, [opponentId]),
    adminUserIds,
  );

  if (opponentLeaderIds.length > 0) {
    await createMatchNotifications({
      userIds: opponentLeaderIds,
      type: "match.result_submitted",
      title: "Waiting for opponent report",
      message: `${teamName(teams, submittingTeamId)} submitted a result. Review the match and submit your report.`,
      match,
      dedupeKey: `match.report.submitted:${reportId}:opponent`,
      metadata: {
        reportId,
        submittingTeamId,
      },
    });
  }

  if (adminUserIds.length > 0) {
    try {
      await createNotificationsOnceForUsers({
        userIds: adminUserIds,
        type: "match.result_submitted",
        title: "Result submitted",
        message: `${teamName(teams, submittingTeamId)} submitted a match result.`,
        href: getAdminMatchNotificationHref(match),
        dedupeKey: `match.report.submitted:${reportId}:admin`,
        metadata: {
          matchId: match.id,
          tournamentId: match.tournamentId,
          reportId,
          submittingTeamId,
        },
      });
    } catch (error) {
      console.error("[matchNotifications] Failed to create notification:", error);
    }
  }
}

export async function notifyMatchDisputed(match: MatchNotificationMatch) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
  const adminUserIds = await getAdminNotificationUserIds();
  const playerUserIds = excludeUserIds(
    memberIdsForTeams(teams, [match.teamAId, match.teamBId]),
    adminUserIds,
  );

  if (playerUserIds.length > 0) {
    await createMatchNotifications({
      userIds: playerUserIds,
      type: "match.disputed",
      title: "Admin review required",
      message: "Your match is under admin review.",
      match,
      dedupeKey: `match.disputed:${match.id}:players`,
    });
  }

  if (adminUserIds.length > 0) {
    try {
      await createNotificationsOnceForUsers({
        userIds: adminUserIds,
        type: "match.disputed",
        title: "Match disputed",
        message: "Admin review required for this match.",
        href: getAdminMatchNotificationHref(match),
        dedupeKey: `match.disputed:${match.id}:admin`,
        metadata: {
          matchId: match.id,
          tournamentId: match.tournamentId,
        },
      });
    } catch (error) {
      console.error("[matchNotifications] Failed to create notification:", error);
    }
  }
}

export async function notifyMatchResultReceived(
  match: MatchNotificationMatch,
  source: string,
  eventId: string,
) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
  const userIds = memberIdsForTeams(teams, [match.teamAId, match.teamBId]);

  if (userIds.length === 0) return;

  await createMatchNotifications({
    userIds,
    type: "match.result_received",
    title: "Result received",
    message: `${source} result received for your match.`,
    match,
    dedupeKey: `match.result.received:${match.id}:${eventId}`,
    metadata: {
      source,
      eventId,
    },
  });
}

export async function notifyMatchConfirmed(
  match: MatchNotificationMatch,
  winnerTeamId: string,
  score?: MatchNotificationScore | null,
) {
  const teams = await loadTeams([match.teamAId, match.teamBId, winnerTeamId]);
  await logMatchConfirmedToTournamentChannel(match, teams, winnerTeamId, score);

  const userIds = memberIdsForTeams(teams, [match.teamAId, match.teamBId]);

  if (userIds.length === 0) return;

  const resultScore = scoreLabel(score);
  const winnerName = teamName(teams, winnerTeamId);
  const confirmedMessage = resultScore
    ? `${winnerName} won ${resultScore}.`
    : `${winnerName} won the match.`;

  await createMatchNotifications({
    userIds,
    type: "match.confirmed",
    title: "Match completed",
    message: confirmedMessage,
    match,
    dedupeKey: `match.confirmed:${match.id}`,
    metadata: {
      winnerTeamId,
      ...(resultScore ? { score: resultScore } : {}),
    },
  });

  void sendDiscordNotificationsToUsers({
    userIds,
    title: "Match completed",
    message: confirmedMessage,
    href: matchHref(match),
  }).catch((error) =>
    logMatchDmFailure("Match result DM failed", match, error),
  );
}

export async function notifyMatchProcessingFailed(input: {
  match?: MatchNotificationMatch | null;
  provider: string;
  reason: string;
  dedupeKey: string;
}) {
  const userIds = await getAdminNotificationUserIds();

  if (userIds.length === 0) return;

  try {
    await createNotificationsOnceForUsers({
      userIds,
      type: "match.processing_failed",
      title: "Match automation failed",
      message: `${input.provider} result processing failed.`,
      href: input.match
        ? getAdminMatchNotificationHref(input.match)
        : "/admin/match-operations?review=needs",
      dedupeKey: `match.processing.failed:${input.dedupeKey}`,
      metadata: {
        provider: input.provider,
        reason: input.reason,
        ...(input.match
          ? {
              matchId: input.match.id,
              tournamentId: input.match.tournamentId,
            }
          : {}),
      },
    });
  } catch (error) {
    console.error(
      "[matchNotifications] Failed to create processing failure notification:",
      error,
    );
  }
}

export async function notifyMatchCommunicationUpdated(
  match: MatchNotificationMatch,
  updateKey: string,
) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
  const userIds = memberIdsForTeams(teams, [match.teamAId, match.teamBId]);

  if (userIds.length === 0) return;

  await createMatchNotifications({
    userIds,
    type: "match.communication_updated",
    title: "Match details updated",
    message: "Match schedule or instructions were updated.",
    match,
    dedupeKey: `match.communication.updated:${match.id}:${updateKey}`,
  });

  await publishMatchRealtimeEvent(match, "tournament.match.communication_updated", [
    "public",
  ]);

  void sendDiscordNotificationsToUsers({
    userIds,
    title: "Match details updated",
    message: "Match schedule or instructions were updated.",
    href: matchHref(match),
  }).catch(() => {});
}

export async function notifyFaceitRoomLinked(match: MatchNotificationMatch) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
  const userIds = memberIdsForTeams(teams, [match.teamAId, match.teamBId]);

  if (userIds.length === 0) return;

  await createMatchNotifications({
    userIds,
    type: "match.faceit_linked",
    title: "Room details are available",
    message: "Room details are available for your match.",
    match,
    dedupeKey: `match.faceit.linked:${match.id}`,
  });

  await publishMatchRealtimeEvent(match, "tournament.match.room_linked", [
    "public",
    "admin",
  ]);

  void sendDiscordNotificationsToUsers({
    userIds,
    title: "Room details are available",
    message: "Room details are available for your match.",
    href: matchHref(match),
  }).catch(() => {});
}

export async function notifyBracketAdvanced(
  match: MatchNotificationMatch,
  nextMatchId: string,
) {
  const teams = await loadTeams([match.winnerTeamId]);
  const userIds = memberIdsForTeams(teams, [match.winnerTeamId]);

  if (userIds.length === 0 || !match.winnerTeamId) return;

  await createMatchNotifications({
    userIds,
    type: "match.advanced",
    title: "Your match is ready",
    message: `${teamName(teams, match.winnerTeamId)} advanced to the next match.`,
    match: {
      ...match,
      id: nextMatchId,
    },
    dedupeKey: `match.advanced:${match.id}:${nextMatchId}`,
    metadata: {
      sourceMatchId: match.id,
      nextMatchId,
      label: matchLabel(match),
    },
  });
}

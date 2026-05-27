import { Prisma } from "@prisma/client";

import {
  createNotificationsOnceForUsers,
  getAdminNotificationUserIds,
} from "@/lib/notifications";
import { sendDiscordNotificationsToUsers } from "@/lib/discordNotificationBridge";
import { prisma } from "@/lib/prisma";

export type MatchNotificationMatch = {
  id: string;
  tournamentId: string;
  roundNumber?: number | null;
  matchNumber?: number | null;
  teamAId?: string | null;
  teamBId?: string | null;
  winnerTeamId?: string | null;
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

function matchLabel(match: MatchNotificationMatch) {
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

export async function notifyMatchScheduled(match: MatchNotificationMatch) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
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
    dedupeKey: `match.scheduled:${match.id}`,
  });

  void sendDiscordNotificationsToUsers({ userIds, title, message, href: matchHref(match) }).catch(() => {});
}

export async function notifyMatchRoomReady(match: MatchNotificationMatch) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
  const userIds = memberIdsForTeams(teams, [match.teamAId, match.teamBId]);

  if (userIds.length === 0) return;

  await createMatchNotifications({
    userIds,
    type: "match.room_ready",
    title: "Room ready",
    message: "Your match room/code is ready.",
    match,
    dedupeKey: `match.room.ready:${match.id}`,
  });

  void sendDiscordNotificationsToUsers({
    userIds,
    title: "Room ready",
    message: "Your match room/code is ready.",
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
  const userIds = uniqueStrings([
    ...leaderIdsForTeams(teams, [opponentId]),
    ...(await getAdminNotificationUserIds()),
  ]);

  if (userIds.length === 0) return;

  await createMatchNotifications({
    userIds,
    type: "match.result_submitted",
    title: "Result submitted",
    message: `${teamName(teams, submittingTeamId)} submitted a match result.`,
    match,
    dedupeKey: `match.report.submitted:${reportId}`,
    metadata: {
      reportId,
      submittingTeamId,
    },
  });
}

export async function notifyMatchDisputed(match: MatchNotificationMatch) {
  const teams = await loadTeams([match.teamAId, match.teamBId]);
  const userIds = uniqueStrings([
    ...memberIdsForTeams(teams, [match.teamAId, match.teamBId]),
    ...(await getAdminNotificationUserIds()),
  ]);

  if (userIds.length === 0) return;

  await createMatchNotifications({
    userIds,
    type: "match.disputed",
    title: "Result disputed",
    message: "A match result was disputed and needs review.",
    match,
    dedupeKey: `match.disputed:${match.id}`,
  });
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
    title: "Result confirmed",
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
    title: "Result confirmed",
    message: confirmedMessage,
    href: matchHref(match),
  }).catch(() => {});
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
      href: input.match ? matchHref(input.match) : "/admin?tab=matches",
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
    title: "Match updated",
    message: "Match schedule or instructions were updated.",
    match,
    dedupeKey: `match.communication.updated:${match.id}:${updateKey}`,
  });

  void sendDiscordNotificationsToUsers({
    userIds,
    title: "Match updated",
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
    title: "FACEIT room ready",
    message: "FACEIT room link is available for your match.",
    match,
    dedupeKey: `match.faceit.linked:${match.id}`,
  });

  void sendDiscordNotificationsToUsers({
    userIds,
    title: "FACEIT room ready",
    message: "FACEIT room link is available for your match.",
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
    title: "Bracket advanced",
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

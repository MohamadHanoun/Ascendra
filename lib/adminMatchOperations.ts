import { isCs2Game } from "@/lib/isCs2Game";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReadinessIssue =
  | "missing_schedule"
  | "missing_room"
  | "missing_proof"
  | "needs_checkin";

export type MatchOperationState = {
  hasSchedule: boolean;
  hasInstructions: boolean;
  hasFaceitRoom: boolean;
  hasFaceitProof: boolean;
  hasAutoApplied: boolean;
  teamACheckIns: number;
  teamBCheckIns: number;
};

export type AdminMatchOperationCard = {
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
  hasInstructions: boolean;
  hasFaceitRoom: boolean;
  faceitMatchUrl: string | null;
  hasFaceitProof: boolean;
  faceitSyncedAt: Date | null;
  hasAutoApplied: boolean;
  faceitAutoAppliedAt: Date | null;
  teamAId: string | null;
  teamAName: string | null;
  teamBId: string | null;
  teamBName: string | null;
  teamACheckIns: number;
  teamBCheckIns: number;
  readinessIssues: ReadinessIssue[];
};

// ─── Pure helpers (exported for tests) ────────────────────────────────────────

export function getMatchOperationState(match: {
  scheduledAt: Date | null;
  playerInstructions: string | null;
  faceitMatchId: string | null;
  faceitMatchUrl: string | null;
  faceitSyncedAt: Date | null;
  faceitAutoAppliedAt: Date | null;
  teamAId: string | null;
  teamBId: string | null;
  checkIns: Array<{ teamId: string | null }>;
}): MatchOperationState {
  return {
    hasSchedule: match.scheduledAt !== null,
    hasInstructions:
      match.playerInstructions !== null &&
      match.playerInstructions.trim().length > 0,
    hasFaceitRoom:
      match.faceitMatchId !== null || match.faceitMatchUrl !== null,
    hasFaceitProof: match.faceitSyncedAt !== null,
    hasAutoApplied: match.faceitAutoAppliedAt !== null,
    teamACheckIns: match.checkIns.filter(
      (c) => c.teamId != null && c.teamId === match.teamAId,
    ).length,
    teamBCheckIns: match.checkIns.filter(
      (c) => c.teamId != null && c.teamId === match.teamBId,
    ).length,
  };
}

export function getReadinessIssues(
  state: MatchOperationState,
  isCs2: boolean,
): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  if (!state.hasSchedule) issues.push("missing_schedule");
  if (isCs2 && !state.hasFaceitRoom) issues.push("missing_room");
  if (isCs2 && !state.hasFaceitProof) issues.push("missing_proof");
  if (isCs2 && (state.teamACheckIns === 0 || state.teamBCheckIns === 0)) {
    issues.push("needs_checkin");
  }
  return issues;
}

type RawAdminMatchRow = {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchNumber: number;
  status: string;
  teamAId: string | null;
  teamBId: string | null;
  scheduledAt: Date | null;
  playerInstructions: string | null;
  faceitMatchId: string | null;
  faceitMatchUrl: string | null;
  faceitSyncedAt: Date | null;
  faceitAutoAppliedAt: Date | null;
  tournament: {
    title: string;
    game: { slug: string; name: string } | null;
  };
  checkIns: Array<{ id: string; teamId: string | null }>;
};

export function normalizeAdminMatchOperationCard(
  match: RawAdminMatchRow,
  teamMap: ReadonlyMap<string, { id: string; name: string }>,
): AdminMatchOperationCard {
  const gameSlug = match.tournament.game?.slug ?? null;
  const gameName = match.tournament.game?.name ?? null;
  const cs2 = isCs2Game(gameSlug, gameName);
  const state = getMatchOperationState(match);
  const issues = getReadinessIssues(state, cs2);

  return {
    matchId: match.id,
    tournamentId: match.tournamentId,
    tournamentTitle: match.tournament.title,
    gameName,
    gameSlug,
    isCs2: cs2,
    matchHref: `/tournaments/${match.tournamentId}/matches/${match.id}`,
    roundNumber: match.roundNumber,
    matchNumber: match.matchNumber,
    status: match.status,
    scheduledAt: match.scheduledAt,
    hasInstructions: state.hasInstructions,
    hasFaceitRoom: state.hasFaceitRoom,
    faceitMatchUrl: match.faceitMatchUrl,
    hasFaceitProof: state.hasFaceitProof,
    faceitSyncedAt: match.faceitSyncedAt,
    hasAutoApplied: state.hasAutoApplied,
    faceitAutoAppliedAt: match.faceitAutoAppliedAt,
    teamAId: match.teamAId,
    teamAName: match.teamAId ? (teamMap.get(match.teamAId)?.name ?? null) : null,
    teamBId: match.teamBId,
    teamBName: match.teamBId ? (teamMap.get(match.teamBId)?.name ?? null) : null,
    teamACheckIns: state.teamACheckIns,
    teamBCheckIns: state.teamBCheckIns,
    readinessIssues: issues,
  };
}

import { isCs2Game } from "@/lib/isCs2Game";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReadinessIssue =
  | "missing_schedule"
  | "missing_room"
  | "missing_proof"
  | "needs_checkin";

export type MatchReviewState =
  | "admin_review_required"
  | "reports_ready"
  | "waiting_opponent_report"
  | "waiting_player_reports"
  | "resolved"
  | "active";

export type ReviewTone = "red" | "amber" | "green" | "neutral";

export type MatchReviewInfo = {
  reviewState: MatchReviewState;
  reviewLabel: string | null;
  reviewTone: ReviewTone;
  reviewPriority: number;
  submittedReportCount: number;
  submittedReportTeamCount: number;
};

// Setup state = manual readiness (schedule + GameRoom) for matches that are
// still in an active, pre-result state. Kept separate from review state.
export type MatchSetupState =
  | "missing_schedule"
  | "missing_room"
  | "setup_ready"
  | "review_blocked"
  | "resolved"
  | "none";

export type MatchSetupInfo = {
  setupState: MatchSetupState;
  setupLabel: string | null;
  setupTone: ReviewTone;
};

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
  // Read-only review-state derivation (no resolution actions live here).
  reviewState: MatchReviewState;
  reviewLabel: string | null;
  reviewTone: ReviewTone;
  reviewPriority: number;
  submittedReportCount: number;
  submittedReportTeamCount: number;
  // Read-only manual setup readiness (schedule + GameRoom).
  hasRoom: boolean;
  setupState: MatchSetupState;
  setupLabel: string | null;
  setupTone: ReviewTone;
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

// Derives a read-only admin review state from match status + the spread of
// *submitted* reports (≤1 per team — the engine supersedes prior submissions).
export function getMatchReviewInfo(
  status: string,
  submittedReports: ReadonlyArray<{ teamId: string }>,
): MatchReviewInfo {
  const submittedReportCount = submittedReports.length;
  const submittedReportTeamCount = new Set(
    submittedReports.map((r) => r.teamId),
  ).size;
  const base = { submittedReportCount, submittedReportTeamCount };

  if (status === "disputed") {
    return {
      reviewState: "admin_review_required",
      reviewLabel: "Admin review required",
      reviewTone: "red",
      reviewPriority: 1,
      ...base,
    };
  }
  if (status === "result_pending") {
    if (submittedReportTeamCount >= 2) {
      return {
        reviewState: "reports_ready",
        reviewLabel: "Reports ready",
        reviewTone: "amber",
        reviewPriority: 2,
        ...base,
      };
    }
    if (submittedReportTeamCount === 1) {
      return {
        reviewState: "waiting_opponent_report",
        reviewLabel: "Waiting for opponent report",
        reviewTone: "amber",
        reviewPriority: 3,
        ...base,
      };
    }
    return {
      reviewState: "waiting_player_reports",
      reviewLabel: "Waiting for player reports",
      reviewTone: "neutral",
      reviewPriority: 4,
      ...base,
    };
  }
  if (
    status === "confirmed" ||
    status === "completed" ||
    status === "forfeit" ||
    status === "bye"
  ) {
    return {
      reviewState: "resolved",
      reviewLabel: "Resolved",
      reviewTone: "green",
      reviewPriority: 9,
      ...base,
    };
  }
  // scheduled / ready / room_created / in_progress / cancelled
  return {
    reviewState: "active",
    reviewLabel: null,
    reviewTone: "neutral",
    reviewPriority: 5,
    ...base,
  };
}

const ACTIVE_SETUP_STATUSES = new Set([
  "scheduled",
  "ready",
  "room_created",
  "in_progress",
]);

// Derives manual setup readiness. Only active, two-team, pre-result matches can
// be "missing schedule/room"; matches in review or resolved are not setup work.
export function getMatchSetupInfo(input: {
  status: string;
  hasSchedule: boolean;
  hasRoom: boolean;
  bothTeamsAssigned: boolean;
  reviewState: MatchReviewState;
}): MatchSetupInfo {
  const { status, hasSchedule, hasRoom, bothTeamsAssigned, reviewState } = input;

  if (
    reviewState === "admin_review_required" ||
    reviewState === "reports_ready"
  ) {
    return {
      setupState: "review_blocked",
      setupLabel: null,
      setupTone: reviewState === "admin_review_required" ? "red" : "amber",
    };
  }

  if (status === "cancelled" || reviewState === "resolved") {
    return {
      setupState: "resolved",
      setupLabel: "Resolved",
      setupTone: reviewState === "resolved" ? "green" : "neutral",
    };
  }

  if (!bothTeamsAssigned || !ACTIVE_SETUP_STATUSES.has(status)) {
    return { setupState: "none", setupLabel: null, setupTone: "neutral" };
  }

  if (!hasSchedule) {
    return {
      setupState: "missing_schedule",
      setupLabel: "Missing schedule",
      setupTone: "amber",
    };
  }

  if (!hasRoom) {
    return {
      setupState: "missing_room",
      setupLabel: "Missing room",
      setupTone: "amber",
    };
  }

  return {
    setupState: "setup_ready",
    setupLabel: "Setup ready",
    setupTone: "green",
  };
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
  // Optional: pre-filtered to submitted reports. Absent in older callers/tests.
  reports?: Array<{ teamId: string }>;
  // Optional: presence of a manual GameRoom. Absent in older callers/tests.
  room?: { id: string } | null;
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
  const review = getMatchReviewInfo(match.status, match.reports ?? []);
  const hasRoom = Boolean(match.room);
  const setup = getMatchSetupInfo({
    status: match.status,
    hasSchedule: state.hasSchedule,
    hasRoom,
    bothTeamsAssigned: Boolean(match.teamAId && match.teamBId),
    reviewState: review.reviewState,
  });

  return {
    matchId: match.id,
    tournamentId: match.tournamentId,
    tournamentTitle: match.tournament.title,
    gameName,
    gameSlug,
    isCs2: cs2,
    matchHref: `/admin/tournaments/${match.tournamentId}/matches#match-${match.id}`,
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
    reviewState: review.reviewState,
    reviewLabel: review.reviewLabel,
    reviewTone: review.reviewTone,
    reviewPriority: review.reviewPriority,
    submittedReportCount: review.submittedReportCount,
    submittedReportTeamCount: review.submittedReportTeamCount,
    hasRoom,
    setupState: setup.setupState,
    setupLabel: setup.setupLabel,
    setupTone: setup.setupTone,
  };
}

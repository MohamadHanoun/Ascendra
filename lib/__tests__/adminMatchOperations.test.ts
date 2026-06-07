import { describe, expect, it } from "vitest";

import {
  getMatchOperationState,
  getMatchReviewInfo,
  getMatchSetupInfo,
  getReadinessIssues,
  normalizeAdminMatchOperationCard,
} from "@/lib/adminMatchOperations";

// ─── getMatchOperationState ───────────────────────────────────────────────────

function makeRawMatch(overrides: Partial<{
  scheduledAt: Date | null;
  playerInstructions: string | null;
  faceitMatchId: string | null;
  faceitMatchUrl: string | null;
  faceitSyncedAt: Date | null;
  faceitAutoAppliedAt: Date | null;
  teamAId: string | null;
  teamBId: string | null;
  checkIns: Array<{ teamId: string | null }>;
}> = {}) {
  return {
    scheduledAt: null,
    playerInstructions: null,
    faceitMatchId: null,
    faceitMatchUrl: null,
    faceitSyncedAt: null,
    faceitAutoAppliedAt: null,
    teamAId: "team-a",
    teamBId: "team-b",
    checkIns: [],
    ...overrides,
  };
}

describe("getMatchOperationState", () => {
  it("returns hasSchedule=true when scheduledAt is set", () => {
    const state = getMatchOperationState(
      makeRawMatch({ scheduledAt: new Date("2026-06-01T18:00:00Z") }),
    );
    expect(state.hasSchedule).toBe(true);
  });

  it("returns hasSchedule=false when scheduledAt is null", () => {
    const state = getMatchOperationState(makeRawMatch({ scheduledAt: null }));
    expect(state.hasSchedule).toBe(false);
  });

  it("returns hasInstructions=true for non-empty playerInstructions", () => {
    const state = getMatchOperationState(
      makeRawMatch({ playerInstructions: "Join server at 18:00" }),
    );
    expect(state.hasInstructions).toBe(true);
  });

  it("returns hasInstructions=false for whitespace-only playerInstructions", () => {
    const state = getMatchOperationState(
      makeRawMatch({ playerInstructions: "   " }),
    );
    expect(state.hasInstructions).toBe(false);
  });

  it("returns hasInstructions=false for null playerInstructions", () => {
    const state = getMatchOperationState(makeRawMatch({ playerInstructions: null }));
    expect(state.hasInstructions).toBe(false);
  });

  it("returns hasFaceitRoom=true when faceitMatchId is set", () => {
    const state = getMatchOperationState(
      makeRawMatch({ faceitMatchId: "abc-123" }),
    );
    expect(state.hasFaceitRoom).toBe(true);
  });

  it("returns hasFaceitRoom=true when faceitMatchUrl is set", () => {
    const state = getMatchOperationState(
      makeRawMatch({ faceitMatchUrl: "https://www.faceit.com/en/cs2/room/abc" }),
    );
    expect(state.hasFaceitRoom).toBe(true);
  });

  it("returns hasFaceitRoom=false when both faceitMatchId and faceitMatchUrl are null", () => {
    const state = getMatchOperationState(makeRawMatch());
    expect(state.hasFaceitRoom).toBe(false);
  });

  it("returns hasFaceitProof=true when faceitSyncedAt is set", () => {
    const state = getMatchOperationState(
      makeRawMatch({ faceitSyncedAt: new Date() }),
    );
    expect(state.hasFaceitProof).toBe(true);
  });

  it("returns hasFaceitProof=false when faceitSyncedAt is null", () => {
    const state = getMatchOperationState(makeRawMatch({ faceitSyncedAt: null }));
    expect(state.hasFaceitProof).toBe(false);
  });

  it("returns hasAutoApplied=true when faceitAutoAppliedAt is set", () => {
    const state = getMatchOperationState(
      makeRawMatch({ faceitAutoAppliedAt: new Date() }),
    );
    expect(state.hasAutoApplied).toBe(true);
  });

  it("returns hasAutoApplied=false when faceitAutoAppliedAt is null", () => {
    const state = getMatchOperationState(makeRawMatch());
    expect(state.hasAutoApplied).toBe(false);
  });

  it("counts teamA check-ins correctly", () => {
    const state = getMatchOperationState(
      makeRawMatch({
        teamAId: "team-a",
        teamBId: "team-b",
        checkIns: [
          { teamId: "team-a" },
          { teamId: "team-a" },
          { teamId: "team-b" },
        ],
      }),
    );
    expect(state.teamACheckIns).toBe(2);
    expect(state.teamBCheckIns).toBe(1);
  });

  it("ignores check-ins with null teamId", () => {
    const state = getMatchOperationState(
      makeRawMatch({
        teamAId: "team-a",
        checkIns: [{ teamId: null }, { teamId: "team-a" }],
      }),
    );
    expect(state.teamACheckIns).toBe(1);
  });

  it("returns zero check-in counts when checkIns is empty", () => {
    const state = getMatchOperationState(makeRawMatch({ checkIns: [] }));
    expect(state.teamACheckIns).toBe(0);
    expect(state.teamBCheckIns).toBe(0);
  });
});

// ─── getReadinessIssues ───────────────────────────────────────────────────────

describe("getReadinessIssues", () => {
  const fullCs2State = {
    hasSchedule: true,
    hasInstructions: true,
    hasFaceitRoom: true,
    hasFaceitProof: true,
    hasAutoApplied: false,
    teamACheckIns: 5,
    teamBCheckIns: 5,
  };

  it("returns no issues for a fully ready CS2 match", () => {
    expect(getReadinessIssues(fullCs2State, true)).toHaveLength(0);
  });

  it("flags missing_schedule regardless of game type", () => {
    const issues = getReadinessIssues({ ...fullCs2State, hasSchedule: false }, true);
    expect(issues).toContain("missing_schedule");
  });

  it("flags missing_room for CS2 when hasFaceitRoom=false", () => {
    const issues = getReadinessIssues({ ...fullCs2State, hasFaceitRoom: false }, true);
    expect(issues).toContain("missing_room");
  });

  it("does NOT flag missing_room for non-CS2 game", () => {
    const issues = getReadinessIssues({ ...fullCs2State, hasFaceitRoom: false }, false);
    expect(issues).not.toContain("missing_room");
  });

  it("flags missing_proof for CS2 when hasFaceitProof=false", () => {
    const issues = getReadinessIssues({ ...fullCs2State, hasFaceitProof: false }, true);
    expect(issues).toContain("missing_proof");
  });

  it("does NOT flag missing_proof for non-CS2 game", () => {
    const issues = getReadinessIssues({ ...fullCs2State, hasFaceitProof: false }, false);
    expect(issues).not.toContain("missing_proof");
  });

  it("flags needs_checkin for CS2 when teamA has zero check-ins", () => {
    const issues = getReadinessIssues({ ...fullCs2State, teamACheckIns: 0 }, true);
    expect(issues).toContain("needs_checkin");
  });

  it("flags needs_checkin for CS2 when teamB has zero check-ins", () => {
    const issues = getReadinessIssues({ ...fullCs2State, teamBCheckIns: 0 }, true);
    expect(issues).toContain("needs_checkin");
  });

  it("does NOT flag needs_checkin for non-CS2 game", () => {
    const issues = getReadinessIssues({ ...fullCs2State, teamACheckIns: 0 }, false);
    expect(issues).not.toContain("needs_checkin");
  });

  it("returns multiple issues when several conditions fail", () => {
    const issues = getReadinessIssues(
      {
        hasSchedule: false,
        hasInstructions: false,
        hasFaceitRoom: false,
        hasFaceitProof: false,
        hasAutoApplied: false,
        teamACheckIns: 0,
        teamBCheckIns: 0,
      },
      true,
    );
    expect(issues).toContain("missing_schedule");
    expect(issues).toContain("missing_room");
    expect(issues).toContain("missing_proof");
    expect(issues).toContain("needs_checkin");
  });

  it("non-CS2 match with no schedule only flags missing_schedule", () => {
    const issues = getReadinessIssues(
      {
        hasSchedule: false,
        hasInstructions: false,
        hasFaceitRoom: false,
        hasFaceitProof: false,
        hasAutoApplied: false,
        teamACheckIns: 0,
        teamBCheckIns: 0,
      },
      false,
    );
    expect(issues).toEqual(["missing_schedule"]);
  });
});

// ─── getMatchReviewInfo ───────────────────────────────────────────────────────

describe("getMatchReviewInfo", () => {
  it("marks disputed matches as admin review required", () => {
    const review = getMatchReviewInfo("disputed", []);

    expect(review.reviewState).toBe("admin_review_required");
    expect(review.reviewLabel).toBe("Admin review required");
    expect(review.reviewPriority).toBe(1);
  });

  it("marks two submitted result reports as reports ready", () => {
    const review = getMatchReviewInfo("result_pending", [
      { teamId: "team-a" },
      { teamId: "team-b" },
    ]);

    expect(review.reviewState).toBe("reports_ready");
    expect(review.reviewLabel).toBe("Reports ready");
    expect(review.reviewPriority).toBe(2);
  });

  it("keeps waiting opponent report ahead of waiting player reports", () => {
    const waitingOpponent = getMatchReviewInfo("result_pending", [
      { teamId: "team-a" },
    ]);
    const waitingPlayers = getMatchReviewInfo("result_pending", []);

    expect(waitingOpponent.reviewState).toBe("waiting_opponent_report");
    expect(waitingOpponent.reviewLabel).toBe("Waiting for opponent report");
    expect(waitingOpponent.reviewPriority).toBeLessThan(
      waitingPlayers.reviewPriority,
    );
    expect(waitingPlayers.reviewState).toBe("waiting_player_reports");
    expect(waitingPlayers.reviewLabel).toBe("Waiting for player reports");
  });
});

// ─── getMatchSetupInfo ────────────────────────────────────────────────────────

describe("getMatchSetupInfo", () => {
  const baseInput = {
    status: "scheduled",
    hasSchedule: true,
    hasRoom: true,
    bothTeamsAssigned: true,
    reviewState: "active" as const,
  };

  it("blocks setup behind disputed admin review", () => {
    const setup = getMatchSetupInfo({
      ...baseInput,
      reviewState: "admin_review_required",
    });

    expect(setup.setupState).toBe("review_blocked");
    expect(setup.setupLabel).toBeNull();
    expect(setup.setupTone).toBe("red");
  });

  it("blocks setup behind reports ready for review", () => {
    const setup = getMatchSetupInfo({
      ...baseInput,
      reviewState: "reports_ready",
    });

    expect(setup.setupState).toBe("review_blocked");
    expect(setup.setupLabel).toBeNull();
    expect(setup.setupTone).toBe("amber");
  });

  it("flags missing schedule before missing room", () => {
    const setup = getMatchSetupInfo({
      ...baseInput,
      hasSchedule: false,
      hasRoom: false,
    });

    expect(setup.setupState).toBe("missing_schedule");
    expect(setup.setupLabel).toBe("Missing schedule");
  });

  it("flags missing room after the schedule exists", () => {
    const setup = getMatchSetupInfo({
      ...baseInput,
      hasRoom: false,
    });

    expect(setup.setupState).toBe("missing_room");
    expect(setup.setupLabel).toBe("Missing room");
  });

  it("marks active scheduled matches with a room as setup ready", () => {
    const setup = getMatchSetupInfo(baseInput);

    expect(setup.setupState).toBe("setup_ready");
    expect(setup.setupLabel).toBe("Setup ready");
  });

  it("does not ask for setup on waiting player reports", () => {
    const setup = getMatchSetupInfo({
      ...baseInput,
      status: "result_pending",
      hasRoom: false,
      reviewState: "waiting_player_reports",
    });

    expect(setup.setupState).toBe("none");
    expect(setup.setupLabel).toBeNull();
  });

  it("marks resolved review states as resolved", () => {
    const setup = getMatchSetupInfo({
      ...baseInput,
      status: "completed",
      reviewState: "resolved",
    });

    expect(setup.setupState).toBe("resolved");
    expect(setup.setupLabel).toBe("Resolved");
  });
});

// ─── normalizeAdminMatchOperationCard ─────────────────────────────────────────

function makeAdminMatchRow(overrides: Partial<{
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
  tournament: { title: string; game: { slug: string; name: string } | null };
  checkIns: Array<{ id: string; teamId: string | null }>;
  reports: Array<{ teamId: string }>;
  room: { id: string } | null;
}> = {}) {
  return {
    id: "match-1",
    tournamentId: "tourn-1",
    roundNumber: 2,
    matchNumber: 3,
    status: "scheduled",
    teamAId: "team-a",
    teamBId: "team-b",
    scheduledAt: null,
    playerInstructions: null,
    faceitMatchId: null,
    faceitMatchUrl: null,
    faceitSyncedAt: null,
    faceitAutoAppliedAt: null,
    tournament: {
      title: "Spring Championship",
      game: { slug: "cs2", name: "Counter-Strike 2" },
    },
    checkIns: [],
    reports: [],
    room: null,
    ...overrides,
  };
}

const teamMap = new Map([
  ["team-a", { id: "team-a", name: "Alpha Squad" }],
  ["team-b", { id: "team-b", name: "Beta Force" }],
]);

describe("normalizeAdminMatchOperationCard", () => {
  it("correctly maps scalar fields", () => {
    const card = normalizeAdminMatchOperationCard(makeAdminMatchRow(), teamMap);
    expect(card.matchId).toBe("match-1");
    expect(card.tournamentId).toBe("tourn-1");
    expect(card.tournamentTitle).toBe("Spring Championship");
    expect(card.roundNumber).toBe(2);
    expect(card.matchNumber).toBe(3);
    expect(card.status).toBe("scheduled");
  });

  it("builds admin match anchor href", () => {
    const card = normalizeAdminMatchOperationCard(makeAdminMatchRow(), teamMap);
    expect(card.matchHref).toBe("/admin/tournaments/tourn-1/matches#match-match-1");
  });

  it("resolves team names from the map", () => {
    const card = normalizeAdminMatchOperationCard(makeAdminMatchRow(), teamMap);
    expect(card.teamAName).toBe("Alpha Squad");
    expect(card.teamBName).toBe("Beta Force");
  });

  it("returns null team name when teamId is missing from map", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({ teamBId: "team-unknown" }),
      teamMap,
    );
    expect(card.teamBName).toBeNull();
  });

  it("returns null team name when teamId itself is null", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({ teamBId: null }),
      teamMap,
    );
    expect(card.teamBId).toBeNull();
    expect(card.teamBName).toBeNull();
  });

  it("detects CS2 correctly", () => {
    const card = normalizeAdminMatchOperationCard(makeAdminMatchRow(), teamMap);
    expect(card.isCs2).toBe(true);
  });

  it("marks non-CS2 game correctly", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        tournament: { title: "Dota Cup", game: { slug: "dota2", name: "Dota 2" } },
      }),
      teamMap,
    );
    expect(card.isCs2).toBe(false);
  });

  it("surfaces readiness issues for a CS2 match missing everything", () => {
    const card = normalizeAdminMatchOperationCard(makeAdminMatchRow(), teamMap);
    expect(card.readinessIssues).toContain("missing_schedule");
    expect(card.readinessIssues).toContain("missing_room");
    expect(card.readinessIssues).toContain("missing_proof");
    expect(card.readinessIssues).toContain("needs_checkin");
  });

  it("has no readiness issues for a fully ready CS2 match", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        scheduledAt: new Date("2026-06-01T18:00:00Z"),
        faceitMatchId: "abc-123",
        faceitSyncedAt: new Date(),
        checkIns: [
          { id: "ci-1", teamId: "team-a" },
          { id: "ci-2", teamId: "team-b" },
        ],
      }),
      teamMap,
    );
    expect(card.readinessIssues).toHaveLength(0);
  });

  it("non-CS2 match with no schedule only has missing_schedule issue", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        tournament: { title: "Dota Cup", game: { slug: "dota2", name: "Dota 2" } },
      }),
      teamMap,
    );
    expect(card.readinessIssues).toEqual(["missing_schedule"]);
  });

  it("passes faceitMatchUrl and faceitSyncedAt through", () => {
    const syncedAt = new Date("2026-06-02T10:00:00Z");
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        faceitMatchUrl: "https://www.faceit.com/en/cs2/room/abc",
        faceitSyncedAt: syncedAt,
      }),
      teamMap,
    );
    expect(card.faceitMatchUrl).toBe("https://www.faceit.com/en/cs2/room/abc");
    expect(card.faceitSyncedAt).toBe(syncedAt);
    expect(card.hasFaceitProof).toBe(true);
  });

  it("reflects faceitAutoAppliedAt in hasAutoApplied", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({ faceitAutoAppliedAt: new Date() }),
      teamMap,
    );
    expect(card.hasAutoApplied).toBe(true);
  });

  it("reports correct per-team check-in counts", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        checkIns: [
          { id: "ci-1", teamId: "team-a" },
          { id: "ci-2", teamId: "team-a" },
          { id: "ci-3", teamId: "team-b" },
        ],
      }),
      teamMap,
    );
    expect(card.teamACheckIns).toBe(2);
    expect(card.teamBCheckIns).toBe(1);
  });

  it("surfaces generic manual room setup state", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        scheduledAt: new Date("2026-06-01T18:00:00Z"),
        room: { id: "room-1" },
        tournament: { title: "Dota Cup", game: { slug: "dota2", name: "Dota 2" } },
      }),
      teamMap,
    );

    expect(card.hasRoom).toBe(true);
    expect(card.setupState).toBe("setup_ready");
    expect(card.setupLabel).toBe("Setup ready");
  });

  it("lets disputed review state beat missing setup", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        status: "disputed",
        scheduledAt: null,
        room: null,
        tournament: { title: "Dota Cup", game: { slug: "dota2", name: "Dota 2" } },
      }),
      teamMap,
    );

    expect(card.reviewState).toBe("admin_review_required");
    expect(card.reviewLabel).toBe("Admin review required");
    expect(card.setupState).toBe("review_blocked");
    expect(card.setupLabel).toBeNull();
  });

  it("lets reports ready review state beat missing setup", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        status: "result_pending",
        scheduledAt: null,
        reports: [{ teamId: "team-a" }, { teamId: "team-b" }],
        room: null,
        tournament: { title: "Dota Cup", game: { slug: "dota2", name: "Dota 2" } },
      }),
      teamMap,
    );

    expect(card.reviewState).toBe("reports_ready");
    expect(card.reviewLabel).toBe("Reports ready");
    expect(card.setupState).toBe("review_blocked");
    expect(card.setupLabel).toBeNull();
  });

  it("marks missing manual room when schedule exists but no GameRoom exists", () => {
    const card = normalizeAdminMatchOperationCard(
      makeAdminMatchRow({
        scheduledAt: new Date("2026-06-01T18:00:00Z"),
        room: null,
        tournament: { title: "Dota Cup", game: { slug: "dota2", name: "Dota 2" } },
      }),
      teamMap,
    );

    expect(card.hasRoom).toBe(false);
    expect(card.setupState).toBe("missing_room");
    expect(card.setupLabel).toBe("Missing room");
  });
});

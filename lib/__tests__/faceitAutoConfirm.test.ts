import { describe, expect, it, vi, afterEach } from "vitest";

// Mock DB-touching dependencies so pure helpers can be imported in isolation.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/tournamentMatchEngine", () => ({ applyFaceitAutoResult: vi.fn() }));

import {
  isFaceitAutoConfirmEnabled,
  allowFaceitFactionOrderFallback,
  isFaceitMatchFinished,
  hasFaceitScore,
  resolveStrictMapping,
  resolveFactionOrderMapping,
} from "@/lib/faceitAutoConfirm";
import type { ParsedFaceitCs2MatchResult } from "@/lib/faceitCs2Parser";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TEAM_A_ID = "team-a";
const TEAM_B_ID = "team-b";

const FACEIT_TEAM_0_ID = "faceit-team-0";
const FACEIT_TEAM_1_ID = "faceit-team-1";

const PLAYER_A1 = "player-a1";
const PLAYER_A2 = "player-a2";
const PLAYER_B1 = "player-b1";
const PLAYER_B2 = "player-b2";

const teamA0 = [{ faceitPlayerId: PLAYER_A1 }, { faceitPlayerId: PLAYER_A2 }];
const teamB0 = [{ faceitPlayerId: PLAYER_B1 }, { faceitPlayerId: PLAYER_B2 }];

const SCORE = { faction1: 13, faction2: 10 };

const TEAMS_NATURAL = [
  { faceitTeamId: FACEIT_TEAM_0_ID, players: teamA0 }, // faction1 = teamA
  { faceitTeamId: FACEIT_TEAM_1_ID, players: teamB0 }, // faction2 = teamB
];

const TEAMS_REVERSED = [
  { faceitTeamId: FACEIT_TEAM_0_ID, players: teamB0 }, // faction1 = teamB
  { faceitTeamId: FACEIT_TEAM_1_ID, players: teamA0 }, // faction2 = teamA
];

function mockParsed(overrides: Partial<ParsedFaceitCs2MatchResult> = {}): ParsedFaceitCs2MatchResult {
  return {
    matchId: "faceit-match-1",
    status: "FINISHED",
    demoUrls: [],
    score: { raw: "13 / 10", faction1: 13, faction2: 10 },
    winnerFaceitTeamId: FACEIT_TEAM_0_ID,
    teams: TEAMS_NATURAL,
    ...overrides,
  };
}

// ─── Env flags ────────────────────────────────────────────────────────────────

describe("isFaceitAutoConfirmEnabled", () => {
  afterEach(() => {
    delete process.env.FACEIT_AUTO_CONFIRM_ENABLED;
  });

  it("returns false when env var is not set", () => {
    expect(isFaceitAutoConfirmEnabled()).toBe(false);
  });

  it("returns true when FACEIT_AUTO_CONFIRM_ENABLED=true", () => {
    process.env.FACEIT_AUTO_CONFIRM_ENABLED = "true";
    expect(isFaceitAutoConfirmEnabled()).toBe(true);
  });

  it("returns false when FACEIT_AUTO_CONFIRM_ENABLED=false", () => {
    process.env.FACEIT_AUTO_CONFIRM_ENABLED = "false";
    expect(isFaceitAutoConfirmEnabled()).toBe(false);
  });

  it("returns false for any truthy non-'true' value", () => {
    process.env.FACEIT_AUTO_CONFIRM_ENABLED = "1";
    expect(isFaceitAutoConfirmEnabled()).toBe(false);
  });
});

describe("allowFaceitFactionOrderFallback", () => {
  afterEach(() => {
    delete process.env.FACEIT_AUTO_CONFIRM_ALLOW_FACTION_ORDER;
  });

  it("returns false when env var is not set", () => {
    expect(allowFaceitFactionOrderFallback()).toBe(false);
  });

  it("returns true when FACEIT_AUTO_CONFIRM_ALLOW_FACTION_ORDER=true", () => {
    process.env.FACEIT_AUTO_CONFIRM_ALLOW_FACTION_ORDER = "true";
    expect(allowFaceitFactionOrderFallback()).toBe(true);
  });
});

// ─── Status / score validation ────────────────────────────────────────────────

describe("isFaceitMatchFinished", () => {
  it("returns true for FINISHED status", () => {
    expect(isFaceitMatchFinished(mockParsed({ status: "FINISHED" }))).toBe(true);
  });

  it("returns false for ONGOING status", () => {
    expect(isFaceitMatchFinished(mockParsed({ status: "ONGOING" }))).toBe(false);
  });

  it("returns false for CANCELLED status", () => {
    expect(isFaceitMatchFinished(mockParsed({ status: "CANCELLED" }))).toBe(false);
  });

  it("returns false for unknown status", () => {
    expect(isFaceitMatchFinished(mockParsed({ status: "unknown" }))).toBe(false);
  });
});

describe("hasFaceitScore", () => {
  it("returns true when both faction scores are present", () => {
    expect(hasFaceitScore(mockParsed())).toBe(true);
  });

  it("returns false when score is undefined", () => {
    expect(hasFaceitScore(mockParsed({ score: undefined }))).toBe(false);
  });

  it("returns false when faction1 is missing", () => {
    expect(hasFaceitScore(mockParsed({ score: { faction2: 10 } }))).toBe(false);
  });

  it("returns false when faction2 is missing", () => {
    expect(hasFaceitScore(mockParsed({ score: { faction1: 13 } }))).toBe(false);
  });

  it("returns false when scores are NaN", () => {
    expect(hasFaceitScore(mockParsed({ score: { faction1: NaN, faction2: NaN } }))).toBe(false);
  });
});

// ─── Strict mapping ───────────────────────────────────────────────────────────

describe("resolveStrictMapping", () => {
  const teamAIds = new Set([PLAYER_A1, PLAYER_A2]);
  const teamBIds = new Set([PLAYER_B1, PLAYER_B2]);

  it("resolves natural order: faction1 → teamA, faction2 → teamB", () => {
    const result = resolveStrictMapping(
      TEAMS_NATURAL,
      SCORE,
      FACEIT_TEAM_0_ID, // team0 wins
      teamAIds,
      teamBIds,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toEqual({
      winnerTeamId: TEAM_A_ID,
      teamAScore: 13,
      teamBScore: 10,
    });
  });

  it("resolves reversed order: faction1 → teamB, faction2 → teamA", () => {
    const result = resolveStrictMapping(
      TEAMS_REVERSED,
      SCORE,
      FACEIT_TEAM_0_ID, // team0 (mapped to teamB) wins
      teamAIds,
      teamBIds,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toEqual({
      winnerTeamId: TEAM_B_ID,
      teamAScore: 10,  // faction2 maps to teamA in reversed
      teamBScore: 13,  // faction1 maps to teamB in reversed
    });
  });

  it("returns null when team sets are empty (no FACEIT accounts linked)", () => {
    const result = resolveStrictMapping(
      TEAMS_NATURAL,
      SCORE,
      FACEIT_TEAM_0_ID,
      new Set(),
      new Set(),
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toBeNull();
  });

  it("returns null when overlap is equal (ambiguous)", () => {
    // Both teams have one player from each FACEIT faction
    const mixed = new Set([PLAYER_A1, PLAYER_B1]);
    const result = resolveStrictMapping(
      TEAMS_NATURAL,
      SCORE,
      FACEIT_TEAM_0_ID,
      mixed,
      new Set([PLAYER_A2, PLAYER_B2]),
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toBeNull();
  });

  it("returns null when fewer than 2 FACEIT teams", () => {
    const result = resolveStrictMapping(
      [TEAMS_NATURAL[0]],
      SCORE,
      FACEIT_TEAM_0_ID,
      teamAIds,
      teamBIds,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toBeNull();
  });

  it("returns null when FACEIT winner is missing", () => {
    const result = resolveStrictMapping(
      TEAMS_NATURAL,
      SCORE,
      undefined,
      teamAIds,
      teamBIds,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toBeNull();
  });

  it("returns null when FACEIT winner does not match a parsed FACEIT team", () => {
    const result = resolveStrictMapping(
      TEAMS_NATURAL,
      SCORE,
      "unknown-faceit-team",
      teamAIds,
      teamBIds,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toBeNull();
  });

  it("assigns correct winner when team1 wins in natural order", () => {
    const result = resolveStrictMapping(
      TEAMS_NATURAL,
      SCORE,
      FACEIT_TEAM_1_ID, // team1 wins
      teamAIds,
      teamBIds,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toEqual({
      winnerTeamId: TEAM_B_ID,
      teamAScore: 13,
      teamBScore: 10,
    });
  });
});

// ─── Faction-order fallback ───────────────────────────────────────────────────

describe("resolveFactionOrderMapping", () => {
  it("maps faction0 to teamA when faction0 wins", () => {
    const result = resolveFactionOrderMapping(
      TEAMS_NATURAL,
      SCORE,
      FACEIT_TEAM_0_ID,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toEqual({
      winnerTeamId: TEAM_A_ID,
      teamAScore: 13,
      teamBScore: 10,
    });
  });

  it("maps faction1 to teamB when faction1 wins", () => {
    const result = resolveFactionOrderMapping(
      TEAMS_NATURAL,
      SCORE,
      FACEIT_TEAM_1_ID,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toEqual({
      winnerTeamId: TEAM_B_ID,
      teamAScore: 13,
      teamBScore: 10,
    });
  });

  it("returns null when fewer than 2 teams", () => {
    const result = resolveFactionOrderMapping(
      [TEAMS_NATURAL[0]],
      SCORE,
      FACEIT_TEAM_0_ID,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toBeNull();
  });

  it("returns null when FACEIT winner is missing", () => {
    const result = resolveFactionOrderMapping(
      TEAMS_NATURAL,
      SCORE,
      undefined,
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toBeNull();
  });

  it("returns null when FACEIT winner does not match a parsed FACEIT team", () => {
    const result = resolveFactionOrderMapping(
      TEAMS_NATURAL,
      SCORE,
      "unknown-faceit-team",
      TEAM_A_ID,
      TEAM_B_ID,
    );
    expect(result).toBeNull();
  });
});

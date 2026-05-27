import { describe, expect, it, vi } from "vitest";

// Mock DB so pure helpers can be tested without a real database connection.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  determineUserSide,
  getOpponentTeamId,
  getPlayerMatchStatusLabel,
  normalizeMatchHubCard,
} from "@/lib/playerMatchHub";

// ─── determineUserSide ────────────────────────────────────────────────────────

describe("determineUserSide", () => {
  const match = { teamAId: "team-a", teamBId: "team-b" };

  it("returns A when user belongs to team A", () => {
    expect(determineUserSide(match, new Set(["team-a"]))).toBe("A");
  });

  it("returns B when user belongs to team B", () => {
    expect(determineUserSide(match, new Set(["team-b"]))).toBe("B");
  });

  it("returns null when user is in neither team", () => {
    expect(determineUserSide(match, new Set(["team-c"]))).toBeNull();
  });

  it("returns null for an empty set", () => {
    expect(determineUserSide(match, new Set())).toBeNull();
  });

  it("returns A when both teams are user teams (first match wins)", () => {
    expect(determineUserSide(match, new Set(["team-a", "team-b"]))).toBe("A");
  });

  it("returns null when teamAId is null", () => {
    expect(
      determineUserSide({ teamAId: null, teamBId: "team-b" }, new Set(["team-a"])),
    ).toBeNull();
  });

  it("returns B when teamAId is null but teamBId matches", () => {
    expect(
      determineUserSide({ teamAId: null, teamBId: "team-b" }, new Set(["team-b"])),
    ).toBe("B");
  });
});

// ─── getOpponentTeamId ────────────────────────────────────────────────────────

describe("getOpponentTeamId", () => {
  const match = { teamAId: "team-a", teamBId: "team-b" };

  it("returns teamB when user is side A", () => {
    expect(getOpponentTeamId(match, "A")).toBe("team-b");
  });

  it("returns teamA when user is side B", () => {
    expect(getOpponentTeamId(match, "B")).toBe("team-a");
  });

  it("returns null when opponent slot is empty (A side, no teamB)", () => {
    expect(getOpponentTeamId({ teamAId: "team-a", teamBId: null }, "A")).toBeNull();
  });

  it("returns null when opponent slot is empty (B side, no teamA)", () => {
    expect(getOpponentTeamId({ teamAId: null, teamBId: "team-b" }, "B")).toBeNull();
  });
});

// ─── getPlayerMatchStatusLabel ────────────────────────────────────────────────

describe("getPlayerMatchStatusLabel", () => {
  it("returns correct EN label for known statuses", () => {
    expect(getPlayerMatchStatusLabel("scheduled", "en")).toBe("Scheduled");
    expect(getPlayerMatchStatusLabel("in_progress", "en")).toBe("In progress");
    expect(getPlayerMatchStatusLabel("disputed", "en")).toBe("Disputed");
  });

  it("returns correct AR label for known statuses", () => {
    expect(getPlayerMatchStatusLabel("scheduled", "ar")).toBe("مجدولة");
    expect(getPlayerMatchStatusLabel("in_progress", "ar")).toBe("جارية");
    expect(getPlayerMatchStatusLabel("room_created", "ar")).toBe("الغرفة جاهزة");
  });

  it("falls back to the raw status string for unknown values", () => {
    expect(getPlayerMatchStatusLabel("unknown_status", "en")).toBe("unknown_status");
    expect(getPlayerMatchStatusLabel("unknown_status", "ar")).toBe("unknown_status");
  });
});

// ─── normalizeMatchHubCard ────────────────────────────────────────────────────

function makeMatch(overrides: Partial<{
  teamAId: string | null;
  teamBId: string | null;
  status: string;
  scheduledAt: Date | null;
  faceitMatchUrl: string | null;
  checkIns: { id: string }[];
}> = {}) {
  return {
    id: "match-1",
    tournamentId: "tourn-1",
    roundNumber: 1,
    matchNumber: 1,
    status: "scheduled",
    teamAId: "team-a",
    teamBId: "team-b",
    scheduledAt: null,
    faceitMatchUrl: null,
    tournament: {
      title: "Summer Cup",
      game: { slug: "cs2", name: "Counter-Strike 2" },
    },
    checkIns: [],
    ...overrides,
  };
}

const teamMap = new Map([
  ["team-a", { id: "team-a", name: "Alpha Squad" }],
  ["team-b", { id: "team-b", name: "Beta Force" }],
]);

describe("normalizeMatchHubCard", () => {
  it("sets correct player/opponent when user is side A", () => {
    const card = normalizeMatchHubCard(
      makeMatch(),
      teamMap,
      new Set(["team-a"]),
    );
    expect(card.playerTeamId).toBe("team-a");
    expect(card.playerTeamName).toBe("Alpha Squad");
    expect(card.opponentTeamId).toBe("team-b");
    expect(card.opponentTeamName).toBe("Beta Force");
  });

  it("sets correct player/opponent when user is side B", () => {
    const card = normalizeMatchHubCard(
      makeMatch(),
      teamMap,
      new Set(["team-b"]),
    );
    expect(card.playerTeamId).toBe("team-b");
    expect(card.playerTeamName).toBe("Beta Force");
    expect(card.opponentTeamId).toBe("team-a");
    expect(card.opponentTeamName).toBe("Alpha Squad");
  });

  it("sets null player/opponent when user is not in the match", () => {
    const card = normalizeMatchHubCard(
      makeMatch(),
      teamMap,
      new Set(["team-c"]),
    );
    expect(card.playerTeamId).toBeNull();
    expect(card.playerTeamName).toBeNull();
    expect(card.opponentTeamId).toBeNull();
    expect(card.opponentTeamName).toBeNull();
  });

  it("handles missing opponent (TBD slot)", () => {
    const card = normalizeMatchHubCard(
      makeMatch({ teamBId: null }),
      teamMap,
      new Set(["team-a"]),
    );
    expect(card.playerTeamId).toBe("team-a");
    expect(card.opponentTeamId).toBeNull();
    expect(card.opponentTeamName).toBeNull();
  });

  it("detects user as checked in when checkIns is non-empty", () => {
    const card = normalizeMatchHubCard(
      makeMatch({ checkIns: [{ id: "ci-1" }] }),
      teamMap,
      new Set(["team-a"]),
    );
    expect(card.userCheckedIn).toBe(true);
  });

  it("detects user as not checked in when checkIns is empty", () => {
    const card = normalizeMatchHubCard(
      makeMatch({ checkIns: [] }),
      teamMap,
      new Set(["team-a"]),
    );
    expect(card.userCheckedIn).toBe(false);
  });

  it("detects CS2 game correctly", () => {
    const card = normalizeMatchHubCard(makeMatch(), teamMap, new Set(["team-a"]));
    expect(card.isCs2).toBe(true);
  });

  it("marks non-CS2 game correctly", () => {
    const card = normalizeMatchHubCard(
      makeMatch({
        ...makeMatch(),
        tournament: { title: "Dota Cup", game: { slug: "dota2", name: "Dota 2" } },
      } as Parameters<typeof normalizeMatchHubCard>[0]),
      teamMap,
      new Set(["team-a"]),
    );
    expect(card.isCs2).toBe(false);
  });

  it("builds the correct matchHref", () => {
    const card = normalizeMatchHubCard(makeMatch(), teamMap, new Set(["team-a"]));
    expect(card.matchHref).toBe("/tournaments/tourn-1/matches/match-1");
  });

  it("passes scheduledAt and faceitMatchUrl through", () => {
    const date = new Date("2026-06-01T18:00:00Z");
    const card = normalizeMatchHubCard(
      makeMatch({ scheduledAt: date, faceitMatchUrl: "https://www.faceit.com/en/cs2/room/abc" }),
      teamMap,
      new Set(["team-a"]),
    );
    expect(card.scheduledAt).toBe(date);
    expect(card.faceitMatchUrl).toBe("https://www.faceit.com/en/cs2/room/abc");
  });
});

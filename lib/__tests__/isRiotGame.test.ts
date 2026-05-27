import { describe, expect, it } from "vitest";

import { isLeagueOfLegendsGame, isRiotGame, isValorantGame } from "@/lib/isRiotGame";

// ─── isLeagueOfLegendsGame ────────────────────────────────────────────────────

describe("isLeagueOfLegendsGame", () => {
  it("detects slug 'lol'", () => {
    expect(isLeagueOfLegendsGame("lol")).toBe(true);
  });

  it("detects slug 'LOL' (case-insensitive)", () => {
    expect(isLeagueOfLegendsGame("LOL")).toBe(true);
  });

  it("detects slug 'league-of-legends'", () => {
    expect(isLeagueOfLegendsGame("league-of-legends")).toBe(true);
  });

  it("detects slug 'league_of_legends'", () => {
    expect(isLeagueOfLegendsGame("league_of_legends")).toBe(true);
  });

  it("detects slug containing 'league'", () => {
    expect(isLeagueOfLegendsGame("league")).toBe(true);
  });

  it("detects name 'League of Legends'", () => {
    expect(isLeagueOfLegendsGame(null, "League of Legends")).toBe(true);
  });

  it("detects name 'league of legends' (case-insensitive)", () => {
    expect(isLeagueOfLegendsGame(null, "league of legends")).toBe(true);
  });

  it("detects name 'LoL'", () => {
    expect(isLeagueOfLegendsGame(null, "LoL")).toBe(true);
  });

  it("detects name 'LoL Season 2025' (name with suffix)", () => {
    expect(isLeagueOfLegendsGame(null, "LoL Season 2025")).toBe(true);
  });

  it("returns false for CS2 slug", () => {
    expect(isLeagueOfLegendsGame("cs2")).toBe(false);
  });

  it("returns false for VALORANT slug", () => {
    expect(isLeagueOfLegendsGame("valorant")).toBe(false);
  });

  it("returns false for null slug and null name", () => {
    expect(isLeagueOfLegendsGame(null, null)).toBe(false);
  });

  it("returns false for undefined slug and undefined name", () => {
    expect(isLeagueOfLegendsGame(undefined, undefined)).toBe(false);
  });

  it("returns false for empty slug", () => {
    expect(isLeagueOfLegendsGame("", "")).toBe(false);
  });

  it("does not match 'poll' slug (lol not word-bounded at start)", () => {
    // 'poll' does not have \blol\b — 'l' is not a word boundary position here
    expect(isLeagueOfLegendsGame("poll")).toBe(false);
  });
});

// ─── isValorantGame ───────────────────────────────────────────────────────────

describe("isValorantGame", () => {
  it("detects slug 'valorant'", () => {
    expect(isValorantGame("valorant")).toBe(true);
  });

  it("detects slug 'VALORANT' (case-insensitive)", () => {
    expect(isValorantGame("VALORANT")).toBe(true);
  });

  it("detects slug 'valorant-2025'", () => {
    expect(isValorantGame("valorant-2025")).toBe(true);
  });

  it("detects name 'VALORANT'", () => {
    expect(isValorantGame(null, "VALORANT")).toBe(true);
  });

  it("detects name 'Valorant Open'", () => {
    expect(isValorantGame(null, "Valorant Open")).toBe(true);
  });

  it("returns false for CS2 slug", () => {
    expect(isValorantGame("cs2")).toBe(false);
  });

  it("returns false for LoL slug", () => {
    expect(isValorantGame("lol")).toBe(false);
  });

  it("returns false for null slug and null name", () => {
    expect(isValorantGame(null, null)).toBe(false);
  });

  it("returns false for undefined slug and undefined name", () => {
    expect(isValorantGame(undefined, undefined)).toBe(false);
  });
});

// ─── isRiotGame ───────────────────────────────────────────────────────────────

describe("isRiotGame", () => {
  it("returns true for LoL slug", () => {
    expect(isRiotGame("lol")).toBe(true);
  });

  it("returns true for VALORANT slug", () => {
    expect(isRiotGame("valorant")).toBe(true);
  });

  it("returns true for LoL name", () => {
    expect(isRiotGame(null, "League of Legends")).toBe(true);
  });

  it("returns true for VALORANT name", () => {
    expect(isRiotGame(null, "VALORANT")).toBe(true);
  });

  it("returns false for CS2 slug", () => {
    expect(isRiotGame("cs2")).toBe(false);
  });

  it("returns false for Steam slug", () => {
    expect(isRiotGame("steam")).toBe(false);
  });

  it("returns false for null slug and null name", () => {
    expect(isRiotGame(null, null)).toBe(false);
  });

  it("returns false for undefined inputs", () => {
    expect(isRiotGame(undefined)).toBe(false);
  });
});

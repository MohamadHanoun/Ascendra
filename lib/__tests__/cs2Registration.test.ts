import { describe, expect, it } from "vitest";

import { isCs2Game } from "@/lib/isCs2Game";
import { computeCs2Readiness } from "@/lib/cs2AccountReadiness";

// ─── isCs2Game ────────────────────────────────────────────────────────────────

describe("isCs2Game", () => {
  it("matches slug 'cs2'", () => {
    expect(isCs2Game("cs2")).toBe(true);
  });

  it("matches slug with word boundary (e.g. 'cs2-open')", () => {
    expect(isCs2Game("cs2-open")).toBe(true);
  });

  it("does not match slug 'csgo'", () => {
    expect(isCs2Game("csgo")).toBe(false);
  });

  it("does not match slug 'cs21' (no word boundary)", () => {
    expect(isCs2Game("cs21")).toBe(false);
  });

  it("matches name 'Counter-Strike 2'", () => {
    expect(isCs2Game(null, "Counter-Strike 2")).toBe(true);
  });

  it("matches name 'counter strike 2' (space variant)", () => {
    expect(isCs2Game(null, "counter strike 2")).toBe(true);
  });

  it("matches name 'CounterStrike2' (no separator)", () => {
    expect(isCs2Game(null, "CounterStrike2")).toBe(true);
  });

  it("does not match name 'Counter-Strike: Global Offensive'", () => {
    expect(isCs2Game(null, "Counter-Strike: Global Offensive")).toBe(false);
  });

  it("returns false when both slug and name are null", () => {
    expect(isCs2Game(null, null)).toBe(false);
  });

  it("returns false when both are undefined", () => {
    expect(isCs2Game(undefined, undefined)).toBe(false);
  });

  it("slug match takes precedence (no name needed)", () => {
    expect(isCs2Game("cs2", null)).toBe(true);
  });
});

// ─── computeCs2Readiness ─────────────────────────────────────────────────────

describe("computeCs2Readiness", () => {
  const STEAM_ID = "76561198000000001";
  const FACEIT_ID = "faceit-player-1";

  it("is fully ready when all three conditions are met", () => {
    expect(
      computeCs2Readiness({
        steamId64: STEAM_ID,
        faceitPlayerId: FACEIT_ID,
        faceitSteamId64: STEAM_ID,
      }),
    ).toEqual({
      steamConnected: true,
      faceitConnected: true,
      faceitMatchesSteam: true,
      isReady: true,
    });
  });

  it("not ready when steam is missing", () => {
    const result = computeCs2Readiness({
      steamId64: null,
      faceitPlayerId: FACEIT_ID,
      faceitSteamId64: STEAM_ID,
    });
    expect(result.steamConnected).toBe(false);
    expect(result.isReady).toBe(false);
  });

  it("not ready when FACEIT is missing", () => {
    const result = computeCs2Readiness({
      steamId64: STEAM_ID,
      faceitPlayerId: null,
      faceitSteamId64: null,
    });
    expect(result.faceitConnected).toBe(false);
    expect(result.isReady).toBe(false);
  });

  it("not ready when FACEIT steam ID does not match connected steam", () => {
    const result = computeCs2Readiness({
      steamId64: STEAM_ID,
      faceitPlayerId: FACEIT_ID,
      faceitSteamId64: "76561198000000999",
    });
    expect(result.faceitMatchesSteam).toBe(false);
    expect(result.isReady).toBe(false);
  });

  it("not ready when FACEIT has no linked steam ID (faceitSteamId64 is null)", () => {
    const result = computeCs2Readiness({
      steamId64: STEAM_ID,
      faceitPlayerId: FACEIT_ID,
      faceitSteamId64: null,
    });
    expect(result.faceitMatchesSteam).toBe(false);
    expect(result.isReady).toBe(false);
  });

  it("all false when nothing is connected", () => {
    expect(
      computeCs2Readiness({
        steamId64: null,
        faceitPlayerId: null,
        faceitSteamId64: null,
      }),
    ).toEqual({
      steamConnected: false,
      faceitConnected: false,
      faceitMatchesSteam: false,
      isReady: false,
    });
  });

  it("handles undefined values the same as null", () => {
    const result = computeCs2Readiness({
      steamId64: undefined,
      faceitPlayerId: undefined,
      faceitSteamId64: undefined,
    });
    expect(result.isReady).toBe(false);
  });
});

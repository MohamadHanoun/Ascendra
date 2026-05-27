import { describe, expect, it } from "vitest";

import { computeRiotAccountReadiness } from "@/lib/riotAccountReadiness";

const PUUID = "puuid-abc-123";

// ─── isRiotTournament ─────────────────────────────────────────────────────────

describe("computeRiotAccountReadiness — isRiotTournament", () => {
  it("returns false for a non-Riot game (CS2 slug)", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "cs2", riotExternalId: null }).isRiotTournament,
    ).toBe(false);
  });

  it("returns false for a generic slug with no name", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "generic-game", riotExternalId: null })
        .isRiotTournament,
    ).toBe(false);
  });

  it("returns false when both slug and name are null", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: null, riotExternalId: null }).isRiotTournament,
    ).toBe(false);
  });

  it("returns true for League of Legends slug 'lol'", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: null }).isRiotTournament,
    ).toBe(true);
  });

  it("returns true for slug 'league-of-legends'", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "league-of-legends", riotExternalId: null })
        .isRiotTournament,
    ).toBe(true);
  });

  it("returns true for name 'League of Legends'", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: null, gameName: "League of Legends", riotExternalId: null })
        .isRiotTournament,
    ).toBe(true);
  });

  it("returns true for VALORANT slug", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "valorant", riotExternalId: null }).isRiotTournament,
    ).toBe(true);
  });

  it("returns true for name 'VALORANT'", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: null, gameName: "VALORANT", riotExternalId: null })
        .isRiotTournament,
    ).toBe(true);
  });
});

// ─── riotConnected ────────────────────────────────────────────────────────────

describe("computeRiotAccountReadiness — riotConnected", () => {
  it("returns true when a PUUID is present", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: PUUID }).riotConnected,
    ).toBe(true);
  });

  it("returns false when externalId is null", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: null }).riotConnected,
    ).toBe(false);
  });

  it("returns false when externalId is undefined", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: undefined }).riotConnected,
    ).toBe(false);
  });

  it("returns false when externalId is whitespace only", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: "   " }).riotConnected,
    ).toBe(false);
  });

  it("returns false when externalId is empty string", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: "" }).riotConnected,
    ).toBe(false);
  });
});

// ─── ready ────────────────────────────────────────────────────────────────────

describe("computeRiotAccountReadiness — ready", () => {
  it("is true for non-Riot game even without Riot account", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "cs2", riotExternalId: null }).ready,
    ).toBe(true);
  });

  it("is true for Riot game when account is linked", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: PUUID }).ready,
    ).toBe(true);
  });

  it("is true for VALORANT game when account is linked", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "valorant", riotExternalId: PUUID }).ready,
    ).toBe(true);
  });

  it("is false for League of Legends game when Riot account is missing", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: null }).ready,
    ).toBe(false);
  });

  it("is false for VALORANT game when Riot account is missing", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "valorant", riotExternalId: null }).ready,
    ).toBe(false);
  });
});

// ─── missing ─────────────────────────────────────────────────────────────────

describe("computeRiotAccountReadiness — missing", () => {
  it("is empty for non-Riot game without account", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "cs2", riotExternalId: null }).missing,
    ).toHaveLength(0);
  });

  it("is empty for Riot game with linked account", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: PUUID }).missing,
    ).toHaveLength(0);
  });

  it("contains 'riot_account' when Riot game is missing account", () => {
    const { missing } = computeRiotAccountReadiness({ gameSlug: "lol", riotExternalId: null });
    expect(missing).toContain("riot_account");
  });

  it("contains 'riot_account' for VALORANT with no Riot account", () => {
    const { missing } = computeRiotAccountReadiness({ gameSlug: "valorant", riotExternalId: undefined });
    expect(missing).toContain("riot_account");
  });

  it("is empty when both slug and name are null (no game)", () => {
    expect(
      computeRiotAccountReadiness({ gameSlug: null, riotExternalId: null }).missing,
    ).toHaveLength(0);
  });
});

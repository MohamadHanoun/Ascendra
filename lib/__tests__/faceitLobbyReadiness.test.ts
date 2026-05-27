import { describe, expect, it } from "vitest";

import { getFaceitLobbyReadiness } from "@/lib/faceitLobbyReadiness";

const allConfigured = {
  FACEIT_ORGANIZER_API_KEY: "organizer-key-abc",
  FACEIT_ORGANIZER_ID: "org-123",
  FACEIT_CHAMPIONSHIP_ID: "champ-456",
  FACEIT_API_KEY: "data-api-key",
};

// ─── canAttemptAutoLobby ──────────────────────────────────────────────────────

describe("getFaceitLobbyReadiness — canAttemptAutoLobby", () => {
  it("returns true when all required env vars are present", () => {
    expect(getFaceitLobbyReadiness(allConfigured).canAttemptAutoLobby).toBe(true);
  });

  it("returns true when hub ID is provided instead of championship ID", () => {
    const env = {
      ...allConfigured,
      FACEIT_CHAMPIONSHIP_ID: undefined,
      FACEIT_HUB_ID: "hub-789",
    };
    expect(getFaceitLobbyReadiness(env).canAttemptAutoLobby).toBe(true);
  });

  it("returns true when both championship and hub ID are present", () => {
    const env = { ...allConfigured, FACEIT_HUB_ID: "hub-789" };
    expect(getFaceitLobbyReadiness(env).canAttemptAutoLobby).toBe(true);
  });

  it("returns false when organizer API key is missing", () => {
    const env = { ...allConfigured, FACEIT_ORGANIZER_API_KEY: undefined };
    expect(getFaceitLobbyReadiness(env).canAttemptAutoLobby).toBe(false);
  });

  it("returns false when organizer API key is empty string", () => {
    const env = { ...allConfigured, FACEIT_ORGANIZER_API_KEY: "" };
    expect(getFaceitLobbyReadiness(env).canAttemptAutoLobby).toBe(false);
  });

  it("returns false when organizer API key is whitespace only", () => {
    const env = { ...allConfigured, FACEIT_ORGANIZER_API_KEY: "   " };
    expect(getFaceitLobbyReadiness(env).canAttemptAutoLobby).toBe(false);
  });

  it("returns false when organizer ID is missing", () => {
    const env = { ...allConfigured, FACEIT_ORGANIZER_ID: undefined };
    expect(getFaceitLobbyReadiness(env).canAttemptAutoLobby).toBe(false);
  });

  it("returns false when both championship ID and hub ID are missing", () => {
    const env = {
      ...allConfigured,
      FACEIT_CHAMPIONSHIP_ID: undefined,
      FACEIT_HUB_ID: undefined,
    };
    expect(getFaceitLobbyReadiness(env).canAttemptAutoLobby).toBe(false);
  });

  it("returns false when all env vars are absent (empty env)", () => {
    expect(getFaceitLobbyReadiness({}).canAttemptAutoLobby).toBe(false);
  });
});

// ─── missing ─────────────────────────────────────────────────────────────────

describe("getFaceitLobbyReadiness — missing", () => {
  it("returns empty missing array when fully configured", () => {
    expect(getFaceitLobbyReadiness(allConfigured).missing).toHaveLength(0);
  });

  it("reports missing organizer API key", () => {
    const env = { ...allConfigured, FACEIT_ORGANIZER_API_KEY: undefined };
    const { missing } = getFaceitLobbyReadiness(env);
    expect(missing.some((m) => m.includes("FACEIT_ORGANIZER_API_KEY"))).toBe(true);
  });

  it("reports missing organizer ID", () => {
    const env = { ...allConfigured, FACEIT_ORGANIZER_ID: undefined };
    const { missing } = getFaceitLobbyReadiness(env);
    expect(missing.some((m) => m.includes("FACEIT_ORGANIZER_ID"))).toBe(true);
  });

  it("reports missing championship/hub when both are absent", () => {
    const env = {
      ...allConfigured,
      FACEIT_CHAMPIONSHIP_ID: undefined,
      FACEIT_HUB_ID: undefined,
    };
    const { missing } = getFaceitLobbyReadiness(env);
    expect(
      missing.some(
        (m) => m.includes("FACEIT_CHAMPIONSHIP_ID") && m.includes("FACEIT_HUB_ID"),
      ),
    ).toBe(true);
  });

  it("reports three items when all required vars are missing", () => {
    expect(getFaceitLobbyReadiness({}).missing).toHaveLength(3);
  });

  it("does not report championship/hub missing when hub is provided", () => {
    const env = {
      ...allConfigured,
      FACEIT_CHAMPIONSHIP_ID: undefined,
      FACEIT_HUB_ID: "hub-789",
    };
    const { missing } = getFaceitLobbyReadiness(env);
    expect(
      missing.some((m) => m.includes("FACEIT_CHAMPIONSHIP_ID") || m.includes("FACEIT_HUB_ID")),
    ).toBe(false);
  });
});

// ─── warnings ────────────────────────────────────────────────────────────────

describe("getFaceitLobbyReadiness — warnings", () => {
  it("returns no warnings when data API key is configured", () => {
    expect(getFaceitLobbyReadiness(allConfigured).warnings).toHaveLength(0);
  });

  it("returns a warning when FACEIT_API_KEY is absent", () => {
    const env = { ...allConfigured, FACEIT_API_KEY: undefined };
    const { warnings } = getFaceitLobbyReadiness(env);
    expect(warnings.some((w) => w.includes("FACEIT_API_KEY"))).toBe(true);
  });

  it("returns a warning when FACEIT_API_KEY is empty", () => {
    const env = { ...allConfigured, FACEIT_API_KEY: "" };
    const { warnings } = getFaceitLobbyReadiness(env);
    expect(warnings.some((w) => w.includes("FACEIT_API_KEY"))).toBe(true);
  });

  it("does not include data API key absence in missing (it is a warning only)", () => {
    const env = { ...allConfigured, FACEIT_API_KEY: undefined };
    const { missing } = getFaceitLobbyReadiness(env);
    expect(missing.some((m) => m.includes("FACEIT_API_KEY"))).toBe(false);
  });

  it("can be fully configured with no warnings", () => {
    const result = getFaceitLobbyReadiness(allConfigured);
    expect(result.canAttemptAutoLobby).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

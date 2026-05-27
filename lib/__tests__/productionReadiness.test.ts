import { describe, expect, it } from "vitest";

import {
  getFaceitProductionWarnings,
  getCs2ReadinessSummary,
} from "@/lib/productionReadiness";

// ─── getFaceitProductionWarnings ──────────────────────────────────────────────

describe("getFaceitProductionWarnings", () => {
  const allGood = {
    apiKeyConfigured: true,
    webhookSecretConfigured: true,
    autoConfirmEnabled: true,
    factionOrderFallbackEnabled: false,
  };

  it("returns no warnings when everything is properly configured", () => {
    expect(getFaceitProductionWarnings(allGood)).toHaveLength(0);
  });

  it("returns an error warning when API key is missing", () => {
    const warnings = getFaceitProductionWarnings({
      ...allGood,
      apiKeyConfigured: false,
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].key).toBe("missing_api_key");
    expect(warnings[0].severity).toBe("error");
  });

  it("warning message mentions proof sync", () => {
    const warnings = getFaceitProductionWarnings({
      ...allGood,
      apiKeyConfigured: false,
    });
    expect(warnings[0].message).toMatch(/proof sync/i);
  });

  it("returns an error warning when webhook secret is missing", () => {
    const warnings = getFaceitProductionWarnings({
      ...allGood,
      webhookSecretConfigured: false,
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].key).toBe("missing_webhook_secret");
    expect(warnings[0].severity).toBe("error");
  });

  it("webhook secret warning message mentions rejected", () => {
    const warnings = getFaceitProductionWarnings({
      ...allGood,
      webhookSecretConfigured: false,
    });
    expect(warnings[0].message).toMatch(/rejected/i);
  });

  it("returns a warning when faction-order fallback is enabled", () => {
    const warnings = getFaceitProductionWarnings({
      ...allGood,
      factionOrderFallbackEnabled: true,
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].key).toBe("faction_order_fallback");
    expect(warnings[0].severity).toBe("warning");
  });

  it("faction-order warning message mentions public tournaments", () => {
    const warnings = getFaceitProductionWarnings({
      ...allGood,
      factionOrderFallbackEnabled: true,
    });
    expect(warnings[0].message).toMatch(/public tournaments/i);
  });

  it("does not warn about auto-confirm state (not a warning condition)", () => {
    expect(
      getFaceitProductionWarnings({ ...allGood, autoConfirmEnabled: false }),
    ).toHaveLength(0);
  });

  it("returns all three warnings when API key, webhook secret, and fallback all fail", () => {
    const warnings = getFaceitProductionWarnings({
      apiKeyConfigured: false,
      webhookSecretConfigured: false,
      autoConfirmEnabled: false,
      factionOrderFallbackEnabled: true,
    });
    expect(warnings).toHaveLength(3);
    expect(warnings.map((w) => w.key)).toContain("missing_api_key");
    expect(warnings.map((w) => w.key)).toContain("missing_webhook_secret");
    expect(warnings.map((w) => w.key)).toContain("faction_order_fallback");
  });

  it("returns only API key warning when only API key is missing", () => {
    const warnings = getFaceitProductionWarnings({
      apiKeyConfigured: false,
      webhookSecretConfigured: true,
      autoConfirmEnabled: true,
      factionOrderFallbackEnabled: false,
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].key).toBe("missing_api_key");
  });

  it("returns two error warnings when both secrets are missing", () => {
    const warnings = getFaceitProductionWarnings({
      apiKeyConfigured: false,
      webhookSecretConfigured: false,
      autoConfirmEnabled: true,
      factionOrderFallbackEnabled: false,
    });
    expect(warnings.filter((w) => w.severity === "error")).toHaveLength(2);
  });
});

// ─── getCs2ReadinessSummary ───────────────────────────────────────────────────

describe("getCs2ReadinessSummary", () => {
  it("returns all zeros for an empty card list", () => {
    const result = getCs2ReadinessSummary([]);
    expect(result.totalCs2Active).toBe(0);
    expect(result.missingSchedule).toBe(0);
    expect(result.missingRoom).toBe(0);
    expect(result.missingProof).toBe(0);
    expect(result.needsCheckin).toBe(0);
  });

  it("does not count non-CS2 cards in the total", () => {
    const result = getCs2ReadinessSummary([
      { isCs2: false, readinessIssues: ["missing_schedule"] },
      { isCs2: false, readinessIssues: [] },
    ]);
    expect(result.totalCs2Active).toBe(0);
    expect(result.missingSchedule).toBe(0);
  });

  it("counts only CS2 cards toward the total", () => {
    const result = getCs2ReadinessSummary([
      { isCs2: true, readinessIssues: [] },
      { isCs2: true, readinessIssues: [] },
      { isCs2: false, readinessIssues: [] },
    ]);
    expect(result.totalCs2Active).toBe(2);
  });

  it("counts missing_schedule only among CS2 cards", () => {
    const result = getCs2ReadinessSummary([
      { isCs2: true, readinessIssues: ["missing_schedule"] },
      { isCs2: false, readinessIssues: ["missing_schedule"] },
    ]);
    expect(result.missingSchedule).toBe(1);
  });

  it("counts missing_room correctly", () => {
    const result = getCs2ReadinessSummary([
      { isCs2: true, readinessIssues: ["missing_room"] },
      { isCs2: true, readinessIssues: ["missing_room"] },
      { isCs2: true, readinessIssues: [] },
    ]);
    expect(result.missingRoom).toBe(2);
  });

  it("counts missing_proof correctly", () => {
    const result = getCs2ReadinessSummary([
      { isCs2: true, readinessIssues: ["missing_proof"] },
      { isCs2: true, readinessIssues: [] },
    ]);
    expect(result.missingProof).toBe(1);
  });

  it("counts needs_checkin correctly", () => {
    const result = getCs2ReadinessSummary([
      { isCs2: true, readinessIssues: ["needs_checkin"] },
      { isCs2: true, readinessIssues: ["needs_checkin"] },
    ]);
    expect(result.needsCheckin).toBe(2);
  });

  it("counts multiple issues per card independently", () => {
    const result = getCs2ReadinessSummary([
      {
        isCs2: true,
        readinessIssues: ["missing_schedule", "missing_room", "missing_proof", "needs_checkin"],
      },
    ]);
    expect(result.totalCs2Active).toBe(1);
    expect(result.missingSchedule).toBe(1);
    expect(result.missingRoom).toBe(1);
    expect(result.missingProof).toBe(1);
    expect(result.needsCheckin).toBe(1);
  });

  it("returns zeros when all CS2 matches are fully ready", () => {
    const result = getCs2ReadinessSummary([
      { isCs2: true, readinessIssues: [] },
      { isCs2: true, readinessIssues: [] },
      { isCs2: true, readinessIssues: [] },
    ]);
    expect(result.totalCs2Active).toBe(3);
    expect(result.missingSchedule).toBe(0);
    expect(result.missingRoom).toBe(0);
    expect(result.missingProof).toBe(0);
    expect(result.needsCheckin).toBe(0);
  });

  it("handles a mixed list of CS2 and non-CS2 cards with various issues", () => {
    const result = getCs2ReadinessSummary([
      { isCs2: true, readinessIssues: ["missing_schedule", "missing_room"] },
      { isCs2: true, readinessIssues: ["missing_room", "needs_checkin"] },
      { isCs2: false, readinessIssues: ["missing_schedule"] },
      { isCs2: true, readinessIssues: [] },
    ]);
    expect(result.totalCs2Active).toBe(3);
    expect(result.missingSchedule).toBe(1);
    expect(result.missingRoom).toBe(2);
    expect(result.missingProof).toBe(0);
    expect(result.needsCheckin).toBe(1);
  });
});

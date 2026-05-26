import { describe, expect, it } from "vitest";

import {
  getFaceitIntegrationStatus,
  isConfiguredEnvValue,
  isEnabledEnvFlag,
} from "@/lib/faceitIntegrationStatus";

describe("isConfiguredEnvValue", () => {
  it("returns true for non-empty values", () => {
    expect(isConfiguredEnvValue("abc123")).toBe(true);
  });

  it("returns false for missing or whitespace-only values", () => {
    expect(isConfiguredEnvValue(undefined)).toBe(false);
    expect(isConfiguredEnvValue("")).toBe(false);
    expect(isConfiguredEnvValue("   ")).toBe(false);
  });
});

describe("isEnabledEnvFlag", () => {
  it("only treats the literal string true as enabled", () => {
    expect(isEnabledEnvFlag("true")).toBe(true);
    expect(isEnabledEnvFlag("false")).toBe(false);
    expect(isEnabledEnvFlag("1")).toBe(false);
    expect(isEnabledEnvFlag("TRUE")).toBe(false);
    expect(isEnabledEnvFlag(undefined)).toBe(false);
  });
});

describe("getFaceitIntegrationStatus", () => {
  it("returns booleans without exposing env values", () => {
    expect(
      getFaceitIntegrationStatus({
        FACEIT_API_KEY: "api-key-value",
        FACEIT_WEBHOOK_SECRET: "webhook-secret-value",
        FACEIT_AUTO_CONFIRM_ENABLED: "true",
        FACEIT_AUTO_CONFIRM_ALLOW_FACTION_ORDER: "false",
      }),
    ).toEqual({
      apiKeyConfigured: true,
      webhookSecretConfigured: true,
      autoConfirmEnabled: true,
      factionOrderFallbackEnabled: false,
    });
  });

  it("treats missing values and non-true flags as disabled", () => {
    expect(getFaceitIntegrationStatus({})).toEqual({
      apiKeyConfigured: false,
      webhookSecretConfigured: false,
      autoConfirmEnabled: false,
      factionOrderFallbackEnabled: false,
    });
  });
});

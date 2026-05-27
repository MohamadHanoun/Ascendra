import { describe, expect, it } from "vitest";

import { getRiotIntegrationReadiness } from "@/lib/riotIntegrationReadiness";

const allConfigured = {
  RIOT_RSO_CLIENT_ID: "client-id-abc",
  RIOT_RSO_CLIENT_SECRET: "client-secret-xyz",
  RIOT_RSO_REDIRECT_URI: "http://localhost:3000/api/auth/riot/callback",
};

// ─── riotFeatureReady ─────────────────────────────────────────────────────────

describe("getRiotIntegrationReadiness — riotFeatureReady", () => {
  it("returns true when all RSO credentials are present", () => {
    expect(getRiotIntegrationReadiness(allConfigured).riotFeatureReady).toBe(true);
  });

  it("returns false when client ID is missing", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_ID: undefined };
    expect(getRiotIntegrationReadiness(env).riotFeatureReady).toBe(false);
  });

  it("returns false when client ID is empty string", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_ID: "" };
    expect(getRiotIntegrationReadiness(env).riotFeatureReady).toBe(false);
  });

  it("returns false when client ID is whitespace only", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_ID: "   " };
    expect(getRiotIntegrationReadiness(env).riotFeatureReady).toBe(false);
  });

  it("returns false when client secret is missing", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_SECRET: undefined };
    expect(getRiotIntegrationReadiness(env).riotFeatureReady).toBe(false);
  });

  it("returns false when redirect URI is missing", () => {
    const env = { ...allConfigured, RIOT_RSO_REDIRECT_URI: undefined };
    expect(getRiotIntegrationReadiness(env).riotFeatureReady).toBe(false);
  });

  it("returns false when all env vars are absent (empty env)", () => {
    expect(getRiotIntegrationReadiness({}).riotFeatureReady).toBe(false);
  });
});

// ─── individual booleans ──────────────────────────────────────────────────────

describe("getRiotIntegrationReadiness — individual booleans", () => {
  it("riotClientConfigured is true when client ID is present", () => {
    expect(getRiotIntegrationReadiness(allConfigured).riotClientConfigured).toBe(true);
  });

  it("riotClientConfigured is false when client ID is absent", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_ID: undefined };
    expect(getRiotIntegrationReadiness(env).riotClientConfigured).toBe(false);
  });

  it("riotSecretConfigured is true when client secret is present", () => {
    expect(getRiotIntegrationReadiness(allConfigured).riotSecretConfigured).toBe(true);
  });

  it("riotSecretConfigured is false when client secret is absent", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_SECRET: undefined };
    expect(getRiotIntegrationReadiness(env).riotSecretConfigured).toBe(false);
  });

  it("riotCallbackConfigured is true when redirect URI is present", () => {
    expect(getRiotIntegrationReadiness(allConfigured).riotCallbackConfigured).toBe(true);
  });

  it("riotCallbackConfigured is false when redirect URI is absent", () => {
    const env = { ...allConfigured, RIOT_RSO_REDIRECT_URI: undefined };
    expect(getRiotIntegrationReadiness(env).riotCallbackConfigured).toBe(false);
  });
});

// ─── missing ──────────────────────────────────────────────────────────────────

describe("getRiotIntegrationReadiness — missing", () => {
  it("returns empty missing array when fully configured", () => {
    expect(getRiotIntegrationReadiness(allConfigured).missing).toHaveLength(0);
  });

  it("reports missing client ID", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_ID: undefined };
    const { missing } = getRiotIntegrationReadiness(env);
    expect(missing.some((m) => m.includes("RIOT_RSO_CLIENT_ID"))).toBe(true);
  });

  it("reports missing client secret", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_SECRET: undefined };
    const { missing } = getRiotIntegrationReadiness(env);
    expect(missing.some((m) => m.includes("RIOT_RSO_CLIENT_SECRET"))).toBe(true);
  });

  it("reports missing redirect URI", () => {
    const env = { ...allConfigured, RIOT_RSO_REDIRECT_URI: undefined };
    const { missing } = getRiotIntegrationReadiness(env);
    expect(missing.some((m) => m.includes("RIOT_RSO_REDIRECT_URI"))).toBe(true);
  });

  it("reports three items when all vars are missing", () => {
    expect(getRiotIntegrationReadiness({}).missing).toHaveLength(3);
  });

  it("reports exactly one item when only client ID is missing", () => {
    const env = { ...allConfigured, RIOT_RSO_CLIENT_ID: undefined };
    expect(getRiotIntegrationReadiness(env).missing).toHaveLength(1);
  });
});

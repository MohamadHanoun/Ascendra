import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getRiotRsoConfig } from "@/lib/riotRsoConfig";

// ─── getRiotRsoConfig ─────────────────────────────────────────────────────────

describe("getRiotRsoConfig", () => {
  const SAVED = {
    id: process.env.RIOT_RSO_CLIENT_ID,
    secret: process.env.RIOT_RSO_CLIENT_SECRET,
    uri: process.env.RIOT_RSO_REDIRECT_URI,
  };

  beforeEach(() => {
    delete process.env.RIOT_RSO_CLIENT_ID;
    delete process.env.RIOT_RSO_CLIENT_SECRET;
    delete process.env.RIOT_RSO_REDIRECT_URI;
  });

  afterEach(() => {
    if (SAVED.id === undefined) delete process.env.RIOT_RSO_CLIENT_ID;
    else process.env.RIOT_RSO_CLIENT_ID = SAVED.id;

    if (SAVED.secret === undefined) delete process.env.RIOT_RSO_CLIENT_SECRET;
    else process.env.RIOT_RSO_CLIENT_SECRET = SAVED.secret;

    if (SAVED.uri === undefined) delete process.env.RIOT_RSO_REDIRECT_URI;
    else process.env.RIOT_RSO_REDIRECT_URI = SAVED.uri;
  });

  it("returns null when all three env vars are missing", () => {
    expect(getRiotRsoConfig()).toBeNull();
  });

  it("returns null when only client ID is set", () => {
    process.env.RIOT_RSO_CLIENT_ID = "some-id";
    expect(getRiotRsoConfig()).toBeNull();
  });

  it("returns null when client secret is missing", () => {
    process.env.RIOT_RSO_CLIENT_ID = "some-id";
    process.env.RIOT_RSO_REDIRECT_URI = "https://example.com/callback";
    expect(getRiotRsoConfig()).toBeNull();
  });

  it("returns null when client ID is missing", () => {
    process.env.RIOT_RSO_CLIENT_SECRET = "super-secret";
    process.env.RIOT_RSO_REDIRECT_URI = "https://example.com/callback";
    expect(getRiotRsoConfig()).toBeNull();
  });

  it("returns null when redirect URI is missing", () => {
    process.env.RIOT_RSO_CLIENT_ID = "some-id";
    process.env.RIOT_RSO_CLIENT_SECRET = "super-secret";
    expect(getRiotRsoConfig()).toBeNull();
  });

  it("returns null when client secret is an empty string", () => {
    process.env.RIOT_RSO_CLIENT_ID = "some-id";
    process.env.RIOT_RSO_CLIENT_SECRET = "";
    process.env.RIOT_RSO_REDIRECT_URI = "https://example.com/callback";
    expect(getRiotRsoConfig()).toBeNull();
  });

  it("returns null when client secret is only whitespace", () => {
    process.env.RIOT_RSO_CLIENT_ID = "some-id";
    process.env.RIOT_RSO_CLIENT_SECRET = "   ";
    process.env.RIOT_RSO_REDIRECT_URI = "https://example.com/callback";
    expect(getRiotRsoConfig()).toBeNull();
  });

  it("returns the config when all three vars are set", () => {
    process.env.RIOT_RSO_CLIENT_ID = "my-client-id";
    process.env.RIOT_RSO_CLIENT_SECRET = "my-client-secret";
    process.env.RIOT_RSO_REDIRECT_URI = "https://example.com/callback";

    const config = getRiotRsoConfig();

    expect(config).not.toBeNull();
    expect(config?.clientId).toBe("my-client-id");
    expect(config?.clientSecret).toBe("my-client-secret");
    expect(config?.redirectUri).toBe("https://example.com/callback");
  });

  it("trims whitespace from all three vars", () => {
    process.env.RIOT_RSO_CLIENT_ID = "  my-client-id  ";
    process.env.RIOT_RSO_CLIENT_SECRET = "  my-secret  ";
    process.env.RIOT_RSO_REDIRECT_URI = "  https://example.com/callback  ";

    const config = getRiotRsoConfig();

    expect(config?.clientId).toBe("my-client-id");
    expect(config?.clientSecret).toBe("my-secret");
    expect(config?.redirectUri).toBe("https://example.com/callback");
  });

  // ── Security: no fallback to a literal string ──────────────────────────────
  // This test explicitly documents that getRiotRsoConfig() must NEVER return a
  // config with the well-known "fallback" string as the secret.  If this test
  // breaks, the HMAC-based CSRF protection would be trivially bypassable.

  it("never returns a fallback secret — missing secret yields null", () => {
    process.env.RIOT_RSO_CLIENT_ID = "my-client-id";
    // deliberately leave RIOT_RSO_CLIENT_SECRET unset
    process.env.RIOT_RSO_REDIRECT_URI = "https://example.com/callback";

    const config = getRiotRsoConfig();

    expect(config).toBeNull();
    // Make sure we didn't silently fill in any string
    // (including the old "fallback" value that was in the code).
    expect(config?.clientSecret).toBeUndefined();
  });
});

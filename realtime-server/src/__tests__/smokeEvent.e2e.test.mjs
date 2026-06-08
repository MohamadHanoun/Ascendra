import { afterEach, beforeAll, describe, expect, it } from "vitest";

/**
 * Opt-in E2E for the smoke-event tool (Batch 1N). Gated by ASCENDRA_REALTIME_E2E.
 * Runs the real signing pipeline against a local ephemeral server and asserts a
 * 2xx plus an incremented accepted-events counter. No production network.
 */

const E2E_ENABLED = process.env.ASCENDRA_REALTIME_E2E === "true";

describe.runIf(E2E_ENABLED)("smoke-event tool E2E", () => {
  let startTestServer;
  let runSmoke;
  const servers = [];

  beforeAll(async () => {
    ({ startTestServer } = await import("./helpers/startTestServer.mjs"));
    ({ runSmoke } = await import("../../scripts/smoke-event.mjs"));
  }, 20000);

  afterEach(async () => {
    while (servers.length) {
      try {
        await servers.pop().close();
      } catch {
        /* ignore */
      }
    }
  });

  it("delivers a signed smoke event and increments the accepted counter", async () => {
    const server = await startTestServer();
    servers.push(server);

    const result = await runSmoke({
      secret: server.eventSecret,
      targetUrl: server.baseUrl,
      isProduction: false,
      env: {},
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.origin).toBe(server.baseUrl);
    // Result must not leak the secret/signature.
    expect(JSON.stringify(result)).not.toContain(server.eventSecret);
    expect(JSON.stringify(result)).not.toMatch(/Bearer|sha256=/);

    const status = await fetch(`${server.baseUrl}/internal/status`, {
      headers: { Authorization: `Bearer ${server.eventSecret}` },
    });
    const body = await status.json();
    expect(body.counters.internalEventsAccepted).toBe(1);
    expect(body.counters.emittedRooms).toBe(1);
  }, 15000);

  it("fails closed against the server with a wrong secret", async () => {
    const server = await startTestServer();
    servers.push(server);

    const result = await runSmoke({
      secret: "wrong".repeat(8),
      targetUrl: server.baseUrl,
      isProduction: false,
      env: {},
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  }, 15000);
});

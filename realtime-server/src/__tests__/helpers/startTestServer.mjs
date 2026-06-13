/**
 * E2E test harness (Batch 1G) — start a realtime server on an ephemeral local
 * port with generated test secrets. Local/test-only; never production.
 *
 * Returns { baseUrl, socketUrl, eventSecret, clientTokenSecret, port, close }.
 * Secrets are generated per call and never logged.
 */

import { randomBytes } from "node:crypto";

import { createRealtimeServer } from "../../server.mjs";

export async function startTestServer(overrides = {}) {
  const eventSecret = randomBytes(32).toString("hex");
  const clientTokenSecret = randomBytes(32).toString("hex");

  const server = createRealtimeServer({
    eventSecret,
    clientTokenSecret,
    allowedOrigins: [],
    isProduction: false,
    nodeEnv: "test",
    logLevel: "error", // suppress info/debug noise during tests
    ...overrides,
  });

  // Port 0 => OS assigns a free ephemeral port; bind to loopback only.
  const { port } = await server.listen({ port: 0, host: "127.0.0.1" });
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    socketUrl: baseUrl,
    eventSecret,
    clientTokenSecret,
    port,
    close: () => server.close(),
  };
}

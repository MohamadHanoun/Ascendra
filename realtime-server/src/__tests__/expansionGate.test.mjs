import { describe, expect, it } from "vitest";

import {
  importSpecifiers,
  dispatchedEventTypes,
  hasForbiddenNextPublicSecret,
  runExpansionGate,
} from "../../scripts/expansion-gate.mjs";

describe("dispatchedEventTypes", () => {
  it("extracts the dispatched event type(s)", () => {
    const src = `
      dispatchRealtimeEventSoon({
        type: "leaderboard.updated",
        audience: "public",
        payload: { tournamentId },
      });
    `;
    expect(dispatchedEventTypes(src)).toEqual(["leaderboard.updated"]);
  });

  it("detects a second/forbidden dispatched event type", () => {
    const src = `
      dispatchRealtimeEventSoon({ type: "leaderboard.updated", payload: {} });
      dispatchRealtimeEventSoon({ type: "tournament.result.updated", payload: {} });
    `;
    expect(dispatchedEventTypes(src)).toEqual([
      "leaderboard.updated",
      "tournament.result.updated",
    ]);
  });
});

describe("importSpecifiers", () => {
  it("detects a socket.io-client import", () => {
    expect(importSpecifiers('import { io } from "socket.io-client";')).toContain(
      "socket.io-client",
    );
  });

  it("detects a realtime hook import", () => {
    const specs = importSpecifiers(
      'import { useRealtimeSocket } from "@/components/realtime/realtimeContext";',
    );
    expect(specs.some((s) => /realtime\/realtimeContext$/.test(s))).toBe(true);
  });
});

describe("hasForbiddenNextPublicSecret", () => {
  it("flags NEXT_PUBLIC *SECRET / *TOKEN_SECRET", () => {
    expect(hasForbiddenNextPublicSecret("NEXT_PUBLIC_REALTIME_EVENT_SECRET")).toBe(true);
    expect(hasForbiddenNextPublicSecret("NEXT_PUBLIC_FOO_TOKEN_SECRET")).toBe(true);
  });

  it("does not flag non-secret NEXT_PUBLIC vars", () => {
    expect(hasForbiddenNextPublicSecret("NEXT_PUBLIC_REALTIME_ENABLE")).toBe(false);
    expect(hasForbiddenNextPublicSecret("NEXT_PUBLIC_REALTIME_URL")).toBe(false);
  });
});

describe("runExpansionGate (current repo)", () => {
  it("passes — repo matches the approved leaderboard pilot", () => {
    const violations = runExpansionGate();
    expect(violations).toEqual([]);
  });
});

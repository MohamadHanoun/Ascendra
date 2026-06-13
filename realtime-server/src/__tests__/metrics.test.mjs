import { describe, expect, it } from "vitest";

import { createMetrics } from "../metrics.mjs";

describe("createMetrics", () => {
  it("tracks connections and disconnects without going negative", () => {
    const m = createMetrics();
    m.onConnect();
    m.onConnect();
    m.onDisconnect();
    const snap = m.snapshot();
    expect(snap.connections).toBe(1);
    expect(snap.counters.socketConnectionsTotal).toBe(2);
    expect(snap.counters.socketDisconnectsTotal).toBe(1);
  });

  it("counts accepted events + emitted rooms and sets lastEventAt", () => {
    const m = createMetrics();
    expect(m.snapshot().counters.lastEventAt).toBeNull();
    m.onInternalAccepted(3);
    const snap = m.snapshot();
    expect(snap.counters.internalEventsAccepted).toBe(1);
    expect(snap.counters.emittedEvents).toBe(1);
    expect(snap.counters.emittedRooms).toBe(3);
    expect(snap.counters.lastEventAt).not.toBeNull();
  });

  it("counts internal rejections by reason and ignores unknown reasons", () => {
    const m = createMetrics();
    expect(m.onInternalRejected("hmac")).toBe(1);
    expect(m.onInternalRejected("hmac")).toBe(2);
    expect(m.onInternalRejected("replay")).toBe(1);
    expect(m.onInternalRejected("bogus")).toBe(0);
    const c = m.snapshot().counters.internalEventsRejected;
    expect(c.hmac).toBe(2);
    expect(c.replay).toBe(1);
    expect(c).not.toHaveProperty("bogus");
    expect(m.snapshot().counters.lastRejectionAt).not.toBeNull();
  });

  it("counts join attempts/accepts/rejections by reason", () => {
    const m = createMetrics();
    m.onJoinAttempt();
    m.onJoinAccepted();
    expect(m.onJoinRejected("private_denied")).toBe(1);
    expect(m.onJoinRejected("admin_denied")).toBe(1);
    const c = m.snapshot().counters;
    expect(c.roomJoinAttempts).toBe(1);
    expect(c.roomJoinsAccepted).toBe(1);
    expect(c.roomJoinsRejected.private_denied).toBe(1);
    expect(c.roomJoinsRejected.admin_denied).toBe(1);
  });

  it("isolates separate instances", () => {
    const a = createMetrics();
    const b = createMetrics();
    a.onConnect();
    expect(a.snapshot().connections).toBe(1);
    expect(b.snapshot().connections).toBe(0);
  });

  it("snapshot holds only counters/timestamps (no secrets/payloads)", () => {
    const m = createMetrics();
    m.onInternalAccepted(1);
    const json = JSON.stringify(m.snapshot());
    // structural sanity — exposed keys are counters/timestamps only
    expect(Object.keys(m.snapshot())).toEqual([
      "uptimeSeconds",
      "connections",
      "counters",
    ]);
    expect(json).not.toMatch(/secret|token|signature|payload/i);
  });
});

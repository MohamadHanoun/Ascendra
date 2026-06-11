import { afterEach, beforeAll, describe, expect, it } from "vitest";

/**
 * Full tournament-room realtime loop (Batch 2A). Opt-in via ASCENDRA_REALTIME_E2E.
 *
 * Proves: app dispatch (dispatchRealtimeEvent, "tournament.result.updated") →
 * signed POST /internal/events on a LOCAL ephemeral server → broadcast to the
 * "tournament:{id}" room only → a Socket.IO client in that room receives a
 * sanitized ascendra:event → the tournament refresh-decision helper would
 * trigger a refresh — while a client in a DIFFERENT tournament room receives
 * nothing. Localhost only; no production network.
 *
 * Heavy imports are dynamic so default root runs skip cleanly.
 */

const E2E_ENABLED = process.env.ASCENDRA_REALTIME_E2E === "true";

describe.runIf(E2E_ENABLED)("tournament room realtime full loop", () => {
  let startTestServer;
  let ioClient;
  let dispatchRealtimeEvent;
  let shouldRefresh;
  let shouldRefreshMatch;
  let server;
  let sockets = [];
  const savedEnv = new Map();

  beforeAll(async () => {
    ({ startTestServer } = await import("./helpers/startTestServer.mjs"));
    ({ io: ioClient } = await import("socket.io-client"));
    ({ dispatchRealtimeEvent } = await import("../../../lib/realtime/dispatchRealtime.ts"));
    ({ shouldRefreshTournamentDetailsFromRealtimeEvent: shouldRefresh } = await import(
      "../../../components/tournament/tournamentRealtimeUtils.ts"
    ));
    ({ shouldRefreshMatchFromRealtimeEvent: shouldRefreshMatch } = await import(
      "../../../components/match/matchRealtimeUtils.ts"
    ));
  }, 20000);

  function setEnv(values) {
    for (const [key, value] of Object.entries(values)) {
      if (!savedEnv.has(key)) savedEnv.set(key, process.env[key]);
      process.env[key] = value;
    }
  }

  afterEach(async () => {
    for (const s of sockets) {
      try {
        s.disconnect();
      } catch {
        /* ignore */
      }
    }
    sockets = [];
    for (const [key, value] of savedEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    savedEnv.clear();
    if (server) {
      await server.close();
      server = null;
    }
  });

  function connect(url) {
    const s = ioClient(url, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
    });
    sockets.push(s);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("connect timeout")), 5000);
      s.on("connect", () => {
        clearTimeout(timer);
        resolve(s);
      });
      s.on("connect_error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function join(s, room) {
    return new Promise((resolve) => s.emit("join", room, (ack) => resolve(ack)));
  }

  function waitForEvent(s, name, timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("event timeout")), timeoutMs);
      s.once(name, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  it("dispatch → /internal/events → tournament:{id} room → sanitized socket receive; other tournament room receives nothing", async () => {
    server = await startTestServer();
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: server.baseUrl,
      REALTIME_EVENT_SECRET: server.eventSecret,
    });

    const socketA = await connect(server.socketUrl);
    const socketB = await connect(server.socketUrl);
    expect((await join(socketA, "tournament:tour_a")).ok).toBe(true);
    expect((await join(socketB, "tournament:tour_b")).ok).toBe(true);

    let otherRoomReceived = false;
    socketB.on("ascendra:event", () => {
      otherRoomReceived = true;
    });

    const received = waitForEvent(socketA, "ascendra:event");

    // Include sensitive fields to PROVE they are stripped before delivery.
    const result = await dispatchRealtimeEvent({
      type: "tournament.result.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour_a",
      payload: {
        tournamentId: "tour_a",
        teamName: "Secret Team",
        rejectionReason: "should not leak",
      },
    });
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.rooms).toEqual(["tournament:tour_a"]);

    const msg = await received;
    expect(msg.type).toBe("tournament.result.updated");
    expect(msg.entityId).toBe("tour_a");
    expect(msg.payload.tournamentId).toBe("tour_a");
    expect(shouldRefresh(msg, "tour_a")).toBe(true);
    expect(shouldRefresh(msg, "tour_b")).toBe(false);

    const json = JSON.stringify(msg);
    for (const forbidden of [
      "teamName",
      "Secret Team",
      "rejectionReason",
      "userIds",
      "discordId",
      "email",
      "token",
      "secret",
      "password",
      "cookie",
      "headers",
      "raw",
      server.eventSecret,
    ]) {
      expect(json).not.toContain(forbidden);
    }

    // Give a stray broadcast time to arrive before asserting isolation.
    await sleep(300);
    expect(otherRoomReceived).toBe(false);

    const status = await fetch(`${server.baseUrl}/internal/status`, {
      headers: { Authorization: `Bearer ${server.eventSecret}` },
    });
    const body = await status.json();
    expect(body.counters.internalEventsAccepted).toBe(1);
    expect(body.counters.emittedRooms).toBe(1);
  }, 15000);

  it("tournament.bracket.generated (RC3) reaches its tournament room only; other room receives nothing", async () => {
    server = await startTestServer();
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: server.baseUrl,
      REALTIME_EVENT_SECRET: server.eventSecret,
    });

    const socketA = await connect(server.socketUrl);
    const socketB = await connect(server.socketUrl);
    expect((await join(socketA, "tournament:tour_a")).ok).toBe(true);
    expect((await join(socketB, "tournament:tour_b")).ok).toBe(true);

    let otherRoomReceived = false;
    socketB.on("ascendra:event", () => {
      otherRoomReceived = true;
    });

    const received = waitForEvent(socketA, "ascendra:event");

    // Include extra fields to PROVE the payload stays ID-only.
    const result = await dispatchRealtimeEvent({
      type: "tournament.bracket.generated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour_a",
      payload: {
        tournamentId: "tour_a",
        totalMatches: 16,
        rounds: 4,
        teamName: "Secret Team",
      },
    });
    expect(result.ok).toBe(true);
    expect(result.rooms).toEqual(["tournament:tour_a"]);

    const msg = await received;
    expect(msg.type).toBe("tournament.bracket.generated");
    expect(msg.entityId).toBe("tour_a");
    expect(msg.payload).toEqual({
      tournamentId: "tour_a",
      entityType: "tournament",
      entityId: "tour_a",
    });
    expect(shouldRefresh(msg, "tour_a")).toBe(true);
    expect(shouldRefresh(msg, "tour_b")).toBe(false);

    const json = JSON.stringify(msg);
    for (const forbidden of ["teamName", "Secret Team", "totalMatches", server.eventSecret]) {
      expect(json).not.toContain(forbidden);
    }

    // Give a stray broadcast time to arrive before asserting isolation.
    await sleep(300);
    expect(otherRoomReceived).toBe(false);
  }, 15000);

  it("tournament.status.updated (RC4) reaches its tournament room only; other room receives nothing", async () => {
    server = await startTestServer();
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: server.baseUrl,
      REALTIME_EVENT_SECRET: server.eventSecret,
    });

    const socketA = await connect(server.socketUrl);
    const socketB = await connect(server.socketUrl);
    expect((await join(socketA, "tournament:tour_a")).ok).toBe(true);
    expect((await join(socketB, "tournament:tour_b")).ok).toBe(true);

    let otherRoomReceived = false;
    socketB.on("ascendra:event", () => {
      otherRoomReceived = true;
    });

    const received = waitForEvent(socketA, "ascendra:event");

    // Include extra fields to PROVE the payload stays ID-only.
    const result = await dispatchRealtimeEvent({
      type: "tournament.status.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour_a",
      payload: {
        tournamentId: "tour_a",
        status: "open",
        teamName: "Secret Team",
      },
    });
    expect(result.ok).toBe(true);
    expect(result.rooms).toEqual(["tournament:tour_a"]);

    const msg = await received;
    expect(msg.type).toBe("tournament.status.updated");
    expect(msg.entityId).toBe("tour_a");
    expect(msg.payload).toEqual({
      tournamentId: "tour_a",
      entityType: "tournament",
      entityId: "tour_a",
    });
    expect(shouldRefresh(msg, "tour_a")).toBe(true);
    expect(shouldRefresh(msg, "tour_b")).toBe(false);

    const json = JSON.stringify(msg);
    for (const forbidden of ['"status"', "teamName", "Secret Team", server.eventSecret]) {
      expect(json).not.toContain(forbidden);
    }

    // Give a stray broadcast time to arrive before asserting isolation.
    await sleep(300);
    expect(otherRoomReceived).toBe(false);
  }, 15000);

  it("tournament.registration.updated (RC8) reaches its tournament room only; other room receives nothing", async () => {
    server = await startTestServer();
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: server.baseUrl,
      REALTIME_EVENT_SECRET: server.eventSecret,
    });

    const socketA = await connect(server.socketUrl);
    const socketB = await connect(server.socketUrl);
    expect((await join(socketA, "tournament:tour_a")).ok).toBe(true);
    expect((await join(socketB, "tournament:tour_b")).ok).toBe(true);

    let otherRoomReceived = false;
    socketB.on("ascendra:event", () => {
      otherRoomReceived = true;
    });

    const received = waitForEvent(socketA, "ascendra:event");

    // Include sensitive fields to prove the payload stays tournament-only.
    const result = await dispatchRealtimeEvent({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour_a",
      payload: {
        tournamentId: "tour_a",
        registrationId: "reg_a",
        teamId: "team_a",
        teamName: "Secret Team",
        userId: "user_a",
        discordId: "123456789012345678",
        rejectionReason: "private",
        adminNotes: "private",
      },
    });
    expect(result.ok).toBe(true);
    expect(result.rooms).toEqual(["tournament:tour_a"]);

    const msg = await received;
    expect(msg.type).toBe("tournament.registration.updated");
    expect(msg.entityId).toBe("tour_a");
    expect(msg.payload).toEqual({
      tournamentId: "tour_a",
      entityType: "tournament",
      entityId: "tour_a",
    });
    expect(shouldRefresh(msg, "tour_a")).toBe(true);
    expect(shouldRefresh(msg, "tour_b")).toBe(false);

    const json = JSON.stringify(msg);
    for (const forbidden of [
      "registrationId",
      "teamId",
      "teamName",
      "Secret Team",
      "userId",
      "discordId",
      "rejectionReason",
      "adminNotes",
      server.eventSecret,
    ]) {
      expect(json).not.toContain(forbidden);
    }

    await sleep(300);
    expect(otherRoomReceived).toBe(false);
  }, 15000);

  it("tournament.match.report_submitted (RC5) reaches its match room (+ parent tournament room); a different match room receives nothing", async () => {
    server = await startTestServer();
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: server.baseUrl,
      REALTIME_EVENT_SECRET: server.eventSecret,
    });

    const socketMatchA = await connect(server.socketUrl);
    const socketMatchB = await connect(server.socketUrl);
    const socketTournament = await connect(server.socketUrl);
    expect((await join(socketMatchA, "match:match_a")).ok).toBe(true);
    expect((await join(socketMatchB, "match:match_b")).ok).toBe(true);
    expect((await join(socketTournament, "tournament:tour_a")).ok).toBe(true);

    let otherMatchReceived = false;
    socketMatchB.on("ascendra:event", () => {
      otherMatchReceived = true;
    });

    const receivedMatch = waitForEvent(socketMatchA, "ascendra:event");
    const receivedTournament = waitForEvent(socketTournament, "ascendra:event");

    // Include sensitive fields to PROVE they are stripped before delivery.
    const result = await dispatchRealtimeEvent({
      type: "tournament.match.report_submitted",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match_a",
      payload: {
        tournamentId: "tour_a",
        matchId: "match_a",
        teamAScore: 13,
        teamBScore: 7,
        proofUrl: "https://example.com/proof.png",
        reporterId: "user789",
        teamName: "Secret Team",
      },
    });
    expect(result.ok).toBe(true);
    // The mapper intentionally targets BOTH rooms for public match events.
    expect(result.rooms).toEqual(["match:match_a", "tournament:tour_a"]);

    const msg = await receivedMatch;
    expect(msg.type).toBe("tournament.match.report_submitted");
    expect(msg.entityId).toBe("match_a");
    expect(msg.payload).toEqual({
      tournamentId: "tour_a",
      matchId: "match_a",
      entityType: "tournamentMatch",
      entityId: "match_a",
    });
    expect(shouldRefreshMatch(msg, "match_a")).toBe(true);
    expect(shouldRefreshMatch(msg, "match_b")).toBe(false);

    // The parent tournament room also receives the event (intended mapper
    // behavior), but the tournament-details refresh helper ignores match
    // events, so tournament pages do not refresh from it.
    const tournamentMsg = await receivedTournament;
    expect(tournamentMsg.type).toBe("tournament.match.report_submitted");
    expect(shouldRefresh(tournamentMsg, "tour_a")).toBe(false);

    const json = JSON.stringify(msg);
    for (const forbidden of [
      "teamAScore",
      "teamBScore",
      "proofUrl",
      "reporterId",
      "teamName",
      "Secret Team",
      server.eventSecret,
    ]) {
      expect(json).not.toContain(forbidden);
    }

    // Give a stray broadcast time to arrive before asserting isolation.
    await sleep(300);
    expect(otherMatchReceived).toBe(false);
  }, 15000);

  it("tournament.match.confirmed (RC6) reaches its match room (+ parent tournament room); a different match room receives nothing", async () => {
    server = await startTestServer();
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: server.baseUrl,
      REALTIME_EVENT_SECRET: server.eventSecret,
    });

    const socketMatchA = await connect(server.socketUrl);
    const socketMatchB = await connect(server.socketUrl);
    const socketTournament = await connect(server.socketUrl);
    expect((await join(socketMatchA, "match:match_a")).ok).toBe(true);
    expect((await join(socketMatchB, "match:match_b")).ok).toBe(true);
    expect((await join(socketTournament, "tournament:tour_a")).ok).toBe(true);

    let otherMatchReceived = false;
    socketMatchB.on("ascendra:event", () => {
      otherMatchReceived = true;
    });

    const receivedMatch = waitForEvent(socketMatchA, "ascendra:event");
    const receivedTournament = waitForEvent(socketTournament, "ascendra:event");

    // Include sensitive fields to PROVE they are stripped before delivery.
    const result = await dispatchRealtimeEvent({
      type: "tournament.match.confirmed",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match_a",
      payload: {
        tournamentId: "tour_a",
        matchId: "match_a",
        winnerTeamId: "team_w",
        adminUserId: "admin123",
        teamAScore: 13,
        teamBScore: 7,
        teamName: "Secret Team",
      },
    });
    expect(result.ok).toBe(true);
    // The mapper intentionally targets BOTH rooms for public match events.
    expect(result.rooms).toEqual(["match:match_a", "tournament:tour_a"]);

    const msg = await receivedMatch;
    expect(msg.type).toBe("tournament.match.confirmed");
    expect(msg.entityId).toBe("match_a");
    expect(msg.payload).toEqual({
      tournamentId: "tour_a",
      matchId: "match_a",
      entityType: "tournamentMatch",
      entityId: "match_a",
    });
    expect(shouldRefreshMatch(msg, "match_a")).toBe(true);
    expect(shouldRefreshMatch(msg, "match_b")).toBe(false);

    // The parent tournament room also receives the event (intended mapper
    // behavior), but the tournament-details refresh helper ignores match
    // events, so tournament pages do not refresh from it.
    const tournamentMsg = await receivedTournament;
    expect(tournamentMsg.type).toBe("tournament.match.confirmed");
    expect(shouldRefresh(tournamentMsg, "tour_a")).toBe(false);

    const json = JSON.stringify(msg);
    for (const forbidden of [
      "winnerTeamId",
      "adminUserId",
      "teamAScore",
      "teamBScore",
      "teamName",
      "Secret Team",
      server.eventSecret,
    ]) {
      expect(json).not.toContain(forbidden);
    }

    // Give a stray broadcast time to arrive before asserting isolation.
    await sleep(300);
    expect(otherMatchReceived).toBe(false);
  }, 15000);

  it("tournament.match.advanced (RC7) reaches its match room and its OWN tournament room; other match/tournament rooms receive nothing", async () => {
    server = await startTestServer();
    setEnv({
      REALTIME_ENABLE_SOCKET: "true",
      REALTIME_SERVER_URL: server.baseUrl,
      REALTIME_EVENT_SECRET: server.eventSecret,
    });

    const socketMatchA = await connect(server.socketUrl);
    const socketMatchB = await connect(server.socketUrl);
    const socketTournamentA = await connect(server.socketUrl);
    const socketTournamentB = await connect(server.socketUrl);
    expect((await join(socketMatchA, "match:match_a")).ok).toBe(true);
    expect((await join(socketMatchB, "match:match_b")).ok).toBe(true);
    expect((await join(socketTournamentA, "tournament:tour_a")).ok).toBe(true);
    expect((await join(socketTournamentB, "tournament:tour_b")).ok).toBe(true);

    let otherMatchReceived = false;
    socketMatchB.on("ascendra:event", () => {
      otherMatchReceived = true;
    });
    let otherTournamentReceived = false;
    socketTournamentB.on("ascendra:event", () => {
      otherTournamentReceived = true;
    });

    const receivedMatch = waitForEvent(socketMatchA, "ascendra:event");
    const receivedTournament = waitForEvent(socketTournamentA, "ascendra:event");

    // Include sensitive fields to PROVE they are stripped before delivery.
    const result = await dispatchRealtimeEvent({
      type: "tournament.match.advanced",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match_a",
      payload: {
        tournamentId: "tour_a",
        matchId: "match_a",
        nextMatchId: "match_next",
        slot: "A",
        winnerTeamId: "team_w",
        teamName: "Secret Team",
      },
    });
    expect(result.ok).toBe(true);
    // The mapper intentionally targets BOTH rooms for public match events.
    expect(result.rooms).toEqual(["match:match_a", "tournament:tour_a"]);

    const msg = await receivedMatch;
    expect(msg.type).toBe("tournament.match.advanced");
    expect(msg.entityId).toBe("match_a");
    expect(msg.payload).toEqual({
      tournamentId: "tour_a",
      matchId: "match_a",
      entityType: "tournamentMatch",
      entityId: "match_a",
    });
    expect(shouldRefreshMatch(msg, "match_a")).toBe(true);
    expect(shouldRefreshMatch(msg, "match_b")).toBe(false);

    // RC7: the matching tournament's details page DOES refresh on bracket
    // progression (approved — the event reaches its own tournament room), and
    // a different tournament does not.
    const tournamentMsg = await receivedTournament;
    expect(tournamentMsg.type).toBe("tournament.match.advanced");
    expect(shouldRefresh(tournamentMsg, "tour_a")).toBe(true);
    expect(shouldRefresh(tournamentMsg, "tour_b")).toBe(false);

    const json = JSON.stringify(msg);
    for (const forbidden of [
      "nextMatchId",
      '"slot"',
      "winnerTeamId",
      "teamName",
      "Secret Team",
      server.eventSecret,
    ]) {
      expect(json).not.toContain(forbidden);
    }

    // Give stray broadcasts time to arrive before asserting isolation.
    await sleep(300);
    expect(otherMatchReceived).toBe(false);
    expect(otherTournamentReceived).toBe(false);
  }, 15000);
});

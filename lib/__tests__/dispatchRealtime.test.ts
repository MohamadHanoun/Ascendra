import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  dispatchRealtimeEvent,
  dispatchRealtimeEventSoon,
} from "@/lib/realtime/dispatchRealtime";

// Enable the bridge with localhost http (allowed outside production) + a
// sufficiently long secret. NODE_ENV is "test" in vitest, so production-only
// guards (https-required, weak-secret) do not apply.
function enableBridge() {
  vi.stubEnv("REALTIME_ENABLE_SOCKET", "true");
  vi.stubEnv("REALTIME_SERVER_URL", "http://localhost:8787");
  vi.stubEnv("REALTIME_EVENT_SECRET", "k".repeat(40));
}

function mockFetchOk() {
  const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }) as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastFetchBody(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls.at(-1);
  const options = call?.[1] as RequestInit | undefined;
  return JSON.parse(String(options?.body ?? "{}")) as Record<string, unknown>;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("dispatchRealtimeEvent — routing", () => {
  it("returns skipped no_safe_rooms when the event has no safe rooms", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "weird.event",
      audience: "public",
      payload: {},
    });

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "no_safe_rooms",
      rooms: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends leaderboard.updated to the leaderboard room with a sanitized payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "leaderboard.updated",
      audience: "public",
      entityType: "leaderboard",
      entityId: "global",
      payload: { tournamentId: "tour123" },
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.rooms).toEqual(["leaderboard"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = lastFetchBody(fetchMock);
    expect(body.rooms).toEqual(["leaderboard"]);
    expect(body.payload).toEqual({
      tournamentId: "tour123",
      entityType: "leaderboard",
      entityId: "global",
    });
  });

  it("sends tournament.result.updated to its tournament room with an ID-only payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.result.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: { tournamentId: "tour123" },
    });

    expect(result.ok).toBe(true);
    expect(result.rooms).toEqual(["tournament:tour123"]);

    const body = lastFetchBody(fetchMock);
    expect(body.rooms).toEqual(["tournament:tour123"]);
    expect(body.payload).toEqual({
      tournamentId: "tour123",
      entityType: "tournament",
      entityId: "tour123",
    });
  });

  it("sends tournament.bracket.generated to its tournament room with an ID-only payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.bracket.generated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: { tournamentId: "tour123" },
    });

    expect(result.ok).toBe(true);
    expect(result.rooms).toEqual(["tournament:tour123"]);

    const body = lastFetchBody(fetchMock);
    expect(body.rooms).toEqual(["tournament:tour123"]);
    expect(body.payload).toEqual({
      tournamentId: "tour123",
      entityType: "tournament",
      entityId: "tour123",
    });
  });

  it("sends tournament.status.updated to its tournament room with an ID-only payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.status.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: { tournamentId: "tour123" },
    });

    expect(result.ok).toBe(true);
    expect(result.rooms).toEqual(["tournament:tour123"]);

    const body = lastFetchBody(fetchMock);
    expect(body.rooms).toEqual(["tournament:tour123"]);
    expect(body.payload).toEqual({
      tournamentId: "tour123",
      entityType: "tournament",
      entityId: "tour123",
    });
  });

  it("strips a status field from a public tournament.status.updated payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.status.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: { tournamentId: "tour123", status: "open" },
    });

    expect(result.ok).toBe(true);

    const body = lastFetchBody(fetchMock);
    const payload = body.payload as Record<string, unknown>;
    expect(payload).not.toHaveProperty("status");
    expect(payload.tournamentId).toBe("tour123");
  });

  it("sends tournament.match.report_submitted to its match + tournament rooms with an ID-only payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.match.report_submitted",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match789",
      payload: { tournamentId: "tour123", matchId: "match789" },
    });

    expect(result.ok).toBe(true);
    // The mapper intentionally targets BOTH the match room and its parent
    // tournament room for public match events (pre-existing behavior).
    expect(result.rooms).toEqual(["match:match789", "tournament:tour123"]);

    const body = lastFetchBody(fetchMock);
    expect(body.rooms).toEqual(["match:match789", "tournament:tour123"]);
    expect(body.payload).toEqual({
      tournamentId: "tour123",
      matchId: "match789",
      entityType: "tournamentMatch",
      entityId: "match789",
    });
  });

  it("strips scores/proof/reporter fields from a public tournament.match.report_submitted payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.match.report_submitted",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match789",
      payload: {
        tournamentId: "tour123",
        matchId: "match789",
        teamAScore: 13,
        teamBScore: 7,
        winnerTeamId: "team456",
        proofUrl: "https://example.com/proof.png",
        proofFileName: "proof.png",
        reporterId: "user789",
        teamName: "Shadow Wolves",
        comment: "we won",
        adminNotes: "check this",
      },
    });

    expect(result.ok).toBe(true);

    const body = lastFetchBody(fetchMock);
    const payload = body.payload as Record<string, unknown>;
    expect(payload).toEqual({
      tournamentId: "tour123",
      matchId: "match789",
      entityType: "tournamentMatch",
      entityId: "match789",
    });
    for (const forbidden of [
      "teamAScore",
      "teamBScore",
      "winnerTeamId",
      "proofUrl",
      "proofFileName",
      "reporterId",
      "teamName",
      "comment",
      "adminNotes",
    ]) {
      expect(payload).not.toHaveProperty(forbidden);
    }
  });

  it("sends tournament.match.advanced to its match + tournament rooms with an ID-only payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.match.advanced",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match789",
      payload: { tournamentId: "tour123", matchId: "match789" },
    });

    expect(result.ok).toBe(true);
    // The mapper intentionally targets BOTH the match room and its parent
    // tournament room for public match events (pre-existing behavior).
    expect(result.rooms).toEqual(["match:match789", "tournament:tour123"]);

    const body = lastFetchBody(fetchMock);
    expect(body.rooms).toEqual(["match:match789", "tournament:tour123"]);
    expect(body.payload).toEqual({
      tournamentId: "tour123",
      matchId: "match789",
      entityType: "tournamentMatch",
      entityId: "match789",
    });
  });

  it("strips winner/nextMatch/score fields from a public tournament.match.advanced payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.match.advanced",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match789",
      payload: {
        tournamentId: "tour123",
        matchId: "match789",
        nextMatchId: "match999",
        slot: "A",
        winnerTeamId: "team456",
        teamAScore: 13,
        teamBScore: 7,
        teamName: "Shadow Wolves",
        adminUserId: "admin123",
      },
    });

    expect(result.ok).toBe(true);

    const body = lastFetchBody(fetchMock);
    const payload = body.payload as Record<string, unknown>;
    expect(payload).toEqual({
      tournamentId: "tour123",
      matchId: "match789",
      entityType: "tournamentMatch",
      entityId: "match789",
    });
    for (const forbidden of [
      "nextMatchId",
      "slot",
      "winnerTeamId",
      "teamAScore",
      "teamBScore",
      "teamName",
      "adminUserId",
    ]) {
      expect(payload).not.toHaveProperty(forbidden);
    }
  });

  it("sends tournament.match.confirmed to its match + tournament rooms with an ID-only payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.match.confirmed",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match789",
      payload: { matchId: "match789", tournamentId: "tour123" },
    });

    // The mapper intentionally targets BOTH the match room and its parent
    // tournament room for public match events (pre-existing behavior).
    expect(result.rooms).toEqual(["match:match789", "tournament:tour123"]);
    const body = lastFetchBody(fetchMock);
    expect(body.rooms).toEqual(["match:match789", "tournament:tour123"]);
    expect(body.payload).toEqual({
      tournamentId: "tour123",
      matchId: "match789",
      entityType: "tournamentMatch",
      entityId: "match789",
    });
  });

  it("strips winner/admin/score fields from a public tournament.match.confirmed payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.match.confirmed",
      audience: "public",
      entityType: "tournamentMatch",
      entityId: "match789",
      payload: {
        tournamentId: "tour123",
        matchId: "match789",
        winnerTeamId: "team456",
        adminUserId: "admin123",
        faceitAutoConfirm: true,
        teamAScore: 13,
        teamBScore: 7,
        teamName: "Shadow Wolves",
        comment: "confirmed by admin",
      },
    });

    expect(result.ok).toBe(true);

    const body = lastFetchBody(fetchMock);
    const payload = body.payload as Record<string, unknown>;
    expect(payload).toEqual({
      tournamentId: "tour123",
      matchId: "match789",
      entityType: "tournamentMatch",
      entityId: "match789",
    });
    for (const forbidden of [
      "winnerTeamId",
      "adminUserId",
      "faceitAutoConfirm",
      "teamAScore",
      "teamBScore",
      "teamName",
      "comment",
    ]) {
      expect(payload).not.toHaveProperty(forbidden);
    }
  });

  it("sends tournament.registration.updated to its tournament room with an ID-only payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: { tournamentId: "tour123" },
    });

    expect(result.ok).toBe(true);
    expect(result.rooms).toEqual(["tournament:tour123"]);

    const body = lastFetchBody(fetchMock);
    expect(body.rooms).toEqual(["tournament:tour123"]);
    expect(body.payload).toEqual({
      tournamentId: "tour123",
      entityType: "tournament",
      entityId: "tour123",
    });
  });

  it("strips registration/team/user/admin fields from a public tournament.registration.updated payload", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.registration.updated",
      audience: "public",
      entityType: "tournament",
      entityId: "tour123",
      payload: {
        tournamentId: "tour123",
        registrationId: "reg789",
        teamId: "team456",
        teamName: "Shadow Wolves",
        rejectionReason: "not eligible",
        userId: "user123",
        discordId: "123456789012345678",
        adminUserId: "admin123",
        notes: "private",
      },
    });

    expect(result.ok).toBe(true);

    const body = lastFetchBody(fetchMock);
    const payload = body.payload as Record<string, unknown>;
    expect(payload).toEqual({
      tournamentId: "tour123",
      entityType: "tournament",
      entityId: "tour123",
    });
    for (const forbidden of [
      "registrationId",
      "teamId",
      "teamName",
      "rejectionReason",
      "userId",
      "discordId",
      "adminUserId",
      "notes",
    ]) {
      expect(payload).not.toHaveProperty(forbidden);
    }
  });
});

describe("dispatchRealtimeEvent — notifications", () => {
  it("does not send a notification without a userId", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "notification.created",
      audience: "public",
      entityType: "notification",
      payload: {},
    });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("no_safe_rooms");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a notification with a safe userId to notifications:{userId}", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "notification.created",
      audience: "public",
      entityType: "notification",
      payload: { userId: "ckuser123" },
    });

    expect(result.rooms).toEqual(["notifications:ckuser123"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("dispatchRealtimeEvent — safety", () => {
  it("does not send when IDs are invalid (no safe rooms)", async () => {
    const fetchMock = mockFetchOk();
    enableBridge();

    const result = await dispatchRealtimeEvent({
      type: "tournament.updated",
      audience: "public",
      payload: { tournamentId: "bad id/with spaces" },
    });

    expect(result.reason).toBe("no_safe_rooms");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the bridge skip (disabled) when REALTIME_ENABLE_SOCKET is not true", async () => {
    const fetchMock = mockFetchOk();
    // Bridge intentionally NOT enabled.

    const result = await dispatchRealtimeEvent({
      type: "leaderboard.updated",
      audience: "public",
      entityType: "leaderboard",
      entityId: "global",
    });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("disabled");
    expect(result.rooms).toEqual(["leaderboard"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("handles a bridge network failure without throwing", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("connection refused");
    });
    vi.stubGlobal("fetch", fetchMock);
    enableBridge();

    let result: Awaited<ReturnType<typeof dispatchRealtimeEvent>> | undefined;
    await expect(
      (async () => {
        result = await dispatchRealtimeEvent({
          type: "leaderboard.updated",
          audience: "public",
          entityType: "leaderboard",
          entityId: "global",
        });
      })(),
    ).resolves.toBeUndefined();

    expect(result?.ok).toBe(false);
    expect(result?.skipped).toBe(false);
    expect(result?.reason).toBe("network_error");
    expect(result?.rooms).toEqual(["leaderboard"]);
  });

  it("never throws on bad input", async () => {
    await expect(
      dispatchRealtimeEvent({ type: undefined as unknown as string }),
    ).resolves.toMatchObject({ ok: false });
  });

  it("fire-and-forget helper does not throw", () => {
    enableBridge();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );

    expect(() =>
      dispatchRealtimeEventSoon({
        type: "leaderboard.updated",
        audience: "public",
        entityType: "leaderboard",
        entityId: "global",
      }),
    ).not.toThrow();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dispatchRealtimeEventSoon } from "@/lib/realtime/dispatchRealtime";

/**
 * RC1 hardening — serverless-safe fire-and-forget scheduling.
 *
 * `next/server` is mocked so the `after()` branch is testable outside a real
 * Next.js request scope (where the real `after()` throws synchronously). The
 * companion test in dispatchRealtime.test.ts exercises the fallback against
 * the REAL module.
 */

const { afterMock } = vi.hoisted(() => ({
  afterMock: vi.fn<(task: () => unknown) => void>(),
}));

vi.mock("next/server", () => ({
  after: afterMock,
}));

function enableBridge() {
  vi.stubEnv("REALTIME_ENABLE_SOCKET", "true");
  vi.stubEnv("REALTIME_SERVER_URL", "http://localhost:8787");
  vi.stubEnv("REALTIME_EVENT_SECRET", "k".repeat(40));
}

const leaderboardEvent = {
  type: "leaderboard.updated",
  audience: "public",
  entityType: "leaderboard",
  entityId: "global",
  payload: { tournamentId: "tour123" },
};

function lastFetchBody(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls.at(-1);
  const options = call?.[1] as RequestInit | undefined;
  return JSON.parse(String(options?.body ?? "{}")) as Record<string, unknown>;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  afterMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("dispatchRealtimeEventSoon — serverless-safe scheduling", () => {
  it("schedules nothing at all while REALTIME_ENABLE_SOCKET is not true", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    dispatchRealtimeEventSoon(leaderboardEvent);

    expect(afterMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("schedules the dispatch through after() when enabled (runs post-response)", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }) as Response);
    vi.stubGlobal("fetch", fetchMock);
    enableBridge();

    dispatchRealtimeEventSoon(leaderboardEvent);

    // Nothing is sent synchronously — the emit runs after the response.
    expect(afterMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();

    const task = afterMock.mock.calls[0][0];
    await task();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = lastFetchBody(fetchMock);
    expect(body.type).toBe("leaderboard.updated");
    expect(body.rooms).toEqual(["leaderboard"]);
  });

  it("falls back to a best-effort void dispatch when after() throws (no request scope)", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }) as Response);
    vi.stubGlobal("fetch", fetchMock);
    enableBridge();
    afterMock.mockImplementationOnce(() => {
      throw new Error("after() was called outside a request scope");
    });

    expect(() => dispatchRealtimeEventSoon(leaderboardEvent)).not.toThrow();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("the scheduled task resolves without throwing even when the bridge fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      }),
    );
    enableBridge();

    dispatchRealtimeEventSoon(leaderboardEvent);

    const task = afterMock.mock.calls[0][0];
    await expect(Promise.resolve(task())).resolves.toBeUndefined();
  });
});

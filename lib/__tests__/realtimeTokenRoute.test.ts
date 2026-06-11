import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: authMock,
}));

import { GET } from "@/app/api/realtime/token/route";
import { verifyClientToken } from "@/lib/realtime/clientToken";

const SECRET = "k".repeat(40);

beforeEach(() => {
  vi.unstubAllEnvs();
  authMock.mockReset();
  vi.stubEnv("REALTIME_ENABLE_SOCKET", "true");
  vi.stubEnv("REALTIME_CLIENT_TOKEN_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  authMock.mockReset();
});

describe("GET /api/realtime/token", () => {
  it("issues a signed token with the signed-in user's own notifications room", async () => {
    authMock.mockResolvedValue({
      user: {
        databaseId: "userA",
        isAdmin: false,
      },
    });

    const response = await GET();
    const body = (await response.json()) as {
      ok: boolean;
      token: string;
      rooms: string[];
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.rooms).toEqual(["notifications:userA"]);
    expect(body.rooms).not.toContain("notifications:userB");
    expect(body.rooms.some((room) => room.startsWith("user:"))).toBe(false);
    expect(body.rooms.some((room) => room.startsWith("profile:"))).toBe(false);
    expect(body.rooms.some((room) => room.startsWith("team:"))).toBe(false);
    expect(body.rooms.some((room) => room === "admin" || room.startsWith("admin:"))).toBe(
      false,
    );

    const verified = verifyClientToken({ secret: SECRET, token: body.token });
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.claims.sub).toBe("userA");
      expect(verified.claims.rooms).toEqual(["notifications:userA"]);
      expect(verified.claims.rooms).not.toContain("notifications:userB");
    }
  });

  it("does not issue a token to anonymous users", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET();
    const body = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Unauthorized");
  });

  it("stays hidden while realtime socket support is disabled", async () => {
    vi.stubEnv("REALTIME_ENABLE_SOCKET", "false");
    authMock.mockResolvedValue({
      user: {
        databaseId: "userA",
        isAdmin: false,
      },
    });

    const response = await GET();
    const body = (await response.json()) as { ok: boolean; error: string };

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Not found");
  });
});

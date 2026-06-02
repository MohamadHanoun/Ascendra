import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gameApiAuditLog: {
      create: vi.fn(),
    },
    gameWebhookEvent: {
      create: vi.fn(),
      update: vi.fn(),
    },
    tournamentMatch: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tournamentMatchGame: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/matchNotifications", () => ({
  notifyMatchConfirmed: vi.fn(),
  notifyMatchProcessingFailed: vi.fn(),
  notifyMatchResultReceived: vi.fn(),
}));

vi.mock("@/lib/tournamentMatchEngine", () => ({
  completeMatchGame: vi.fn(),
  advanceBracketAfterMatch: vi.fn(),
}));

import { POST } from "@/app/api/integrations/riot/lol/callback/route";

function makeRequest(ip: string) {
  return new Request("http://localhost/api/integrations/riot/lol/callback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: "{invalid-json",
  });
}

describe("Riot LoL callback rate limiting", () => {
  it("rate-limits provider callback requests before body parsing", async () => {
    const ip = "198.51.100.30";

    for (let i = 0; i < 30; i += 1) {
      const response = await POST(makeRequest(ip));
      expect(response.status).toBe(400);
    }

    const blocked = await POST(makeRequest(ip));
    expect(blocked.status).toBe(429);
  });
});

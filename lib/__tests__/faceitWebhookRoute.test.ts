import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const webhookLogMocks = vi.hoisted(() => ({
  createFaceitWebhookLog: vi.fn(),
  updateFaceitWebhookLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournamentMatch: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/faceit", () => ({
  FaceitApiError: class FaceitApiError extends Error {},
  getFaceitMatchDetails: vi.fn(),
  getFaceitMatchStats: vi.fn(),
}));

vi.mock("@/lib/faceitCs2Parser", () => ({
  parseFaceitCs2MatchResult: vi.fn(),
}));

vi.mock("@/lib/faceitWebhookLog", async () => {
  const actual = await vi.importActual<typeof import("@/lib/faceitWebhookLog")>(
    "@/lib/faceitWebhookLog",
  );

  return {
    ...actual,
    createFaceitWebhookLog: webhookLogMocks.createFaceitWebhookLog,
    updateFaceitWebhookLog: webhookLogMocks.updateFaceitWebhookLog,
  };
});

import { POST } from "@/app/api/webhooks/faceit/route";

const savedSecret = process.env.FACEIT_WEBHOOK_SECRET;

function makeRequest(input: {
  url?: string;
  ip: string;
  authorization?: string;
  body?: unknown;
}) {
  return new Request(
    input.url ?? "http://localhost/api/webhooks/faceit",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": input.ip,
        ...(input.authorization ? { authorization: input.authorization } : {}),
      },
      body: JSON.stringify(input.body ?? { event: "unsupported_event" }),
    },
  );
}

describe("FACEIT webhook route auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FACEIT_WEBHOOK_SECRET = "faceit-test-secret";
    webhookLogMocks.createFaceitWebhookLog.mockResolvedValue("log-1");
    webhookLogMocks.updateFaceitWebhookLog.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (savedSecret === undefined) {
      delete process.env.FACEIT_WEBHOOK_SECRET;
    } else {
      process.env.FACEIT_WEBHOOK_SECRET = savedSecret;
    }
  });

  it("does not authenticate a matching query-string secret", async () => {
    const response = await POST(
      makeRequest({
        url: "http://localhost/api/webhooks/faceit?secret=faceit-test-secret",
        ip: "203.0.113.10",
      }),
    );

    expect(response.status).toBe(401);
    expect(webhookLogMocks.createFaceitWebhookLog).not.toHaveBeenCalled();
    expect(webhookLogMocks.updateFaceitWebhookLog).not.toHaveBeenCalled();
  });

  it("accepts Authorization bearer auth and keeps authenticated logging", async () => {
    const response = await POST(
      makeRequest({
        ip: "203.0.113.11",
        authorization: "Bearer faceit-test-secret",
      }),
    );

    expect(response.status).toBe(200);
    expect(webhookLogMocks.createFaceitWebhookLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "unsupported_event",
        status: "received",
      }),
    );
    expect(webhookLogMocks.updateFaceitWebhookLog).toHaveBeenCalledWith(
      "log-1",
      expect.objectContaining({
        status: "skipped",
        reason: "unsupported_event",
      }),
    );
  });
});

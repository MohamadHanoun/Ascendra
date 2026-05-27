import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDiscordMessageContent,
  isDiscordSendConfigured,
  sendDiscordNotificationsToUsers,
  uniqueDiscordIds,
} from "@/lib/discordNotificationBridge";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

// ─── uniqueDiscordIds ──────────────────────────────────────────────────────────

describe("uniqueDiscordIds", () => {
  it("returns empty array for empty input", () => {
    expect(uniqueDiscordIds([])).toEqual([]);
  });

  it("removes null values", () => {
    expect(uniqueDiscordIds([null, "123"])).toEqual(["123"]);
  });

  it("removes undefined values", () => {
    expect(uniqueDiscordIds([undefined, "456"])).toEqual(["456"]);
  });

  it("removes empty strings and whitespace-only strings", () => {
    expect(uniqueDiscordIds(["", "  ", "789"])).toEqual(["789"]);
  });

  it("removes duplicate IDs, keeping first occurrence", () => {
    expect(uniqueDiscordIds(["aaa", "bbb", "aaa", "ccc"])).toEqual([
      "aaa",
      "bbb",
      "ccc",
    ]);
  });

  it("trims whitespace from IDs", () => {
    expect(uniqueDiscordIds([" 111 ", "222"])).toEqual(["111", "222"]);
  });

  it("returns all unique valid IDs", () => {
    expect(uniqueDiscordIds(["a", null, "b", undefined, "a", "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

// ─── buildDiscordMessageContent ───────────────────────────────────────────────

describe("buildDiscordMessageContent", () => {
  it("formats title in bold", () => {
    const content = buildDiscordMessageContent("Match scheduled", "Team A vs Team B is scheduled.");
    expect(content).toContain("**Match scheduled**");
  });

  it("includes the message body", () => {
    const content = buildDiscordMessageContent("Title", "Some message body.");
    expect(content).toContain("Some message body.");
  });

  it("includes url when provided", () => {
    const content = buildDiscordMessageContent("T", "M", "https://ascendra.gg/match");
    expect(content).toContain("https://ascendra.gg/match");
  });

  it("omits url when not provided", () => {
    const content = buildDiscordMessageContent("T", "M");
    expect(content).not.toContain("http");
  });

  it("omits url when empty string", () => {
    const content = buildDiscordMessageContent("T", "M", "");
    expect(content).not.toContain("http");
  });

  it("truncates content to max 1900 characters", () => {
    const longMessage = "x".repeat(2000);
    const content = buildDiscordMessageContent("Title", longMessage);
    expect(content.length).toBeLessThanOrEqual(1900);
  });

  it("separates title, message, and url with newlines", () => {
    const content = buildDiscordMessageContent("T", "M", "https://example.com");
    expect(content).toBe("**T**\nM\nhttps://example.com");
  });
});

// ─── isDiscordSendConfigured ──────────────────────────────────────────────────

describe("isDiscordSendConfigured", () => {
  afterEach(() => {
    delete process.env.DISCORD_BOT_TOKEN;
  });

  it("returns true when DISCORD_BOT_TOKEN is set to a non-empty value", () => {
    process.env.DISCORD_BOT_TOKEN = "Bot.token.value";
    expect(isDiscordSendConfigured()).toBe(true);
  });

  it("returns false when DISCORD_BOT_TOKEN is an empty string", () => {
    process.env.DISCORD_BOT_TOKEN = "";
    expect(isDiscordSendConfigured()).toBe(false);
  });

  it("returns false when DISCORD_BOT_TOKEN is only whitespace", () => {
    process.env.DISCORD_BOT_TOKEN = "   ";
    expect(isDiscordSendConfigured()).toBe(false);
  });

  it("returns false when DISCORD_BOT_TOKEN is not set", () => {
    expect(isDiscordSendConfigured()).toBe(false);
  });
});

// ─── sendDiscordNotificationsToUsers ─────────────────────────────────────────

describe("sendDiscordNotificationsToUsers", () => {
  const mockFetch = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    process.env.DISCORD_BOT_TOKEN = "test-bot-token";

    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { discordId: "discord-111" },
      { discordId: "discord-222" },
    ] as never);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "dm-channel-abc" }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DISCORD_BOT_TOKEN;
  });

  it("skips entirely when DISCORD_BOT_TOKEN is not configured", async () => {
    delete process.env.DISCORD_BOT_TOKEN;
    const { prisma } = await import("@/lib/prisma");

    await sendDiscordNotificationsToUsers({
      userIds: ["u1"],
      title: "T",
      message: "M",
    });

    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("skips when userIds is empty", async () => {
    await sendDiscordNotificationsToUsers({
      userIds: [],
      title: "T",
      message: "M",
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("skips when all users have no valid Discord IDs", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { discordId: "" },
      { discordId: "  " },
    ] as never);

    await sendDiscordNotificationsToUsers({
      userIds: ["u1", "u2"],
      title: "T",
      message: "M",
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("deduplicates Discord IDs before sending", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { discordId: "discord-111" },
      { discordId: "discord-111" }, // duplicate
      { discordId: "discord-222" },
    ] as never);

    await sendDiscordNotificationsToUsers({
      userIds: ["u1", "u2", "u3"],
      title: "T",
      message: "M",
    });

    const dmChannelCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      String(url).includes("@me/channels"),
    );
    expect(dmChannelCalls).toHaveLength(2);
  });

  it("does not throw when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    await expect(
      sendDiscordNotificationsToUsers({
        userIds: ["u1"],
        title: "T",
        message: "M",
      }),
    ).resolves.not.toThrow();
  });

  it("does not throw when prisma throws", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("DB error"));

    await expect(
      sendDiscordNotificationsToUsers({
        userIds: ["u1"],
        title: "T",
        message: "M",
      }),
    ).resolves.not.toThrow();
  });

  it("does not throw when fetch returns non-ok for DM channel creation", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    await expect(
      sendDiscordNotificationsToUsers({
        userIds: ["u1"],
        title: "T",
        message: "M",
      }),
    ).resolves.not.toThrow();
  });

  it("sends one DM channel create and one message send per Discord ID", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { discordId: "discord-only" },
    ] as never);

    await sendDiscordNotificationsToUsers({
      userIds: ["u1"],
      title: "Result confirmed",
      message: "Team won the match.",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [channelCall, messageCall] = mockFetch.mock.calls as [[string, RequestInit]][];
    expect(String(channelCall[0])).toContain("@me/channels");
    expect(String(messageCall[0])).toContain("channels/dm-channel-abc/messages");
  });

  it("message body contains title and message", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { discordId: "discord-only" },
    ] as never);

    await sendDiscordNotificationsToUsers({
      userIds: ["u1"],
      title: "Match scheduled",
      message: "Team A vs Team B is scheduled.",
    });

    const messageCall = mockFetch.mock.calls.find(([url]: [string]) =>
      String(url).includes("/messages"),
    );
    expect(messageCall).toBeDefined();
    const body = JSON.parse(String((messageCall![1] as RequestInit).body));
    expect(body.content).toContain("**Match scheduled**");
    expect(body.content).toContain("Team A vs Team B is scheduled.");
  });
});

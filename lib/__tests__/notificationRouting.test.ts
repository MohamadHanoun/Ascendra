import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/realtime", () => ({ createRealtimeEvent: vi.fn() }));
vi.mock("@/lib/discordNotificationBridge", () => ({
  sendDiscordNotificationsToUsers: vi.fn(),
}));
vi.mock("@/lib/serverDiscordLogs", () => ({
  getServerLogErrorMessage: vi.fn((error: unknown) => String(error)),
  logServerBotError: vi.fn(),
  logServerTournamentAction: vi.fn(),
}));

import {
  getAdminMatchNotificationHref,
  getMatchNotificationHref,
} from "@/lib/matchNotifications";
import { normalizeNotificationHref } from "@/lib/notifications";

describe("notification route helpers", () => {
  const match = {
    id: "match-1",
    tournamentId: "tournament-1",
  };

  it("builds player match links", () => {
    expect(getMatchNotificationHref(match)).toBe(
      "/tournaments/tournament-1/matches/match-1",
    );
  });

  it("builds admin match operation links", () => {
    expect(getAdminMatchNotificationHref(match)).toBe(
      "/admin/tournaments/tournament-1/matches#match-match-1",
    );
  });

  it("normalizes legacy admin registration links when tournament metadata exists", () => {
    expect(
      normalizeNotificationHref("/admin?tab=registrations", {
        tournamentId: "tournament-1",
      }),
    ).toBe("/admin/tournaments/tournament-1#registrations");
  });

  it("normalizes legacy admin match links when match metadata exists", () => {
    expect(
      normalizeNotificationHref("/admin?tab=matches", {
        tournamentId: "tournament-1",
        matchId: "match-1",
      }),
    ).toBe("/admin/tournaments/tournament-1/matches#match-match-1");
  });

  it("falls back to the global review queue for legacy admin match links without match metadata", () => {
    expect(normalizeNotificationHref("/admin?tab=matches")).toBe(
      "/admin/match-operations?review=needs",
    );
  });
});

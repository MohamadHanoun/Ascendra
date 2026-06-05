import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import type { PointEvent, TournamentResult } from "@/components/profile/types";
import { prisma } from "@/lib/prisma";

export const profileShellUserSelect = {
  id: true,
  username: true,
  avatar: true,
  displayName: true,
  discordId: true,
  isGuildMember: true,
} satisfies Prisma.UserSelect;

export const profileAccountUserSelect = {
  id: true,
  username: true,
  isGuildMember: true,
  displayName: true,
  bio: true,
  country: true,
  favoriteGame: true,
  publicProfileEnabled: true,
  showDiscordId: true,
  showTeams: true,
  showTournamentHistory: true,
  faceitPlayerId: true,
  faceitNickname: true,
  faceitSkillLevelCs2: true,
  faceitLinkedAt: true,
} satisfies Prisma.UserSelect;

export const profileGameSelect = {
  slug: true,
  name: true,
} satisfies Prisma.GameSelect;

export const profileLinkedAccountSelect = {
  id: true,
  provider: true,
  externalId: true,
  displayName: true,
  verifiedAt: true,
} satisfies Prisma.PlayerGameAccountSelect;

export const profileTeamSelect = {
  id: true,
  name: true,
  status: true,
  leaderId: true,
  rejectionReason: true,
  game: {
    select: {
      name: true,
    },
  },
  members: {
    select: {
      userId: true,
      role: true,
    },
  },
} satisfies Prisma.TeamSelect;

export const profileInvitationSelect = {
  id: true,
  team: {
    select: {
      name: true,
      game: {
        select: {
          name: true,
        },
      },
      members: {
        select: {
          userId: true,
        },
      },
    },
  },
  invitedBy: {
    select: {
      username: true,
      displayName: true,
    },
  },
} satisfies Prisma.TeamInviteSelect;

export const profileTournamentResultSelect = {
  id: true,
  placement: true,
  points: true,
  note: true,
  awardedAt: true,
  snapshotTeamName: true,
  snapshotTeamGame: true,
  team: {
    select: {
      name: true,
      game: {
        select: {
          name: true,
        },
      },
    },
  },
  tournament: {
    select: {
      id: true,
      title: true,
      game: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.TournamentResultSelect;

export const profilePointEventSelect = {
  points: true,
  createdAt: true,
} satisfies Prisma.RankingPointEventSelect;

export type ProfileShellUser = Prisma.UserGetPayload<{
  select: typeof profileShellUserSelect;
}>;

export type ProfileAccountUser = Prisma.UserGetPayload<{
  select: typeof profileAccountUserSelect;
}>;

export type ProfileLinkedAccount = Prisma.PlayerGameAccountGetPayload<{
  select: typeof profileLinkedAccountSelect;
}>;

export type ProfileGame = Prisma.GameGetPayload<{
  select: typeof profileGameSelect;
}>;

export type ProfileTeam = Prisma.TeamGetPayload<{
  select: typeof profileTeamSelect;
}>;

export type ProfileInvitation = Prisma.TeamInviteGetPayload<{
  select: typeof profileInvitationSelect;
}>;

export type ProfileTournamentResult = Prisma.TournamentResultGetPayload<{
  select: typeof profileTournamentResultSelect;
}>;

export type ProfilePointEvent = Prisma.RankingPointEventGetPayload<{
  select: typeof profilePointEventSelect;
}>;

export const requireProfileUserId = cache(async () => {
  const session = await auth();
  const userId = session?.user?.databaseId;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user.id;
});

export function getUserTournamentResultWhere(
  userId: string,
): Prisma.TournamentResultWhereInput {
  return {
    team: {
      members: {
        some: {
          userId,
        },
      },
    },
  };
}

export function serializeTournamentResults(
  results: ProfileTournamentResult[],
): TournamentResult[] {
  return results.map((result) => ({
    ...result,
    awardedAt: result.awardedAt.toISOString(),
  }));
}

export function serializePointEvents(events: ProfilePointEvent[]): PointEvent[] {
  return events.map((event) => ({
    points: event.points,
    createdAt: event.createdAt.toISOString(),
  }));
}

export function getBestPlacement(
  results: Array<{ placement: number }>,
): number | null {
  return results.length > 0
    ? Math.min(...results.map((result) => result.placement))
    : null;
}

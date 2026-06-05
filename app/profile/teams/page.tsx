import { redirect } from "next/navigation";

import { TeamsPanel } from "@/components/profile/TeamsPanel";
import { getLocale } from "@/lib/i18nServer";
import {
  profileGameSelect,
  profileInvitationSelect,
  profileTeamSelect,
  requireProfileUserId,
} from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";
import { prisma } from "@/lib/prisma";

export default async function ProfileTeamsPage() {
  const [locale, userId] = await Promise.all([
    getLocale(),
    requireProfileUserId(),
  ]);

  const [user, teams, invitations, dbGames] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        isGuildMember: true,
      },
    }),
    prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: profileTeamSelect,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.teamInvite.findMany({
      where: {
        invitedUserId: userId,
        status: "pending",
      },
      select: profileInvitationSelect,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.game.findMany({
      where: {
        isActive: true,
      },
      select: profileGameSelect,
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const messages = profileMessages[locale];

  return (
    <TeamsPanel
      teams={teams}
      invitations={invitations}
      userId={user.id}
      isGuildMember={user.isGuildMember}
      dbGames={dbGames}
      labels={messages.labels}
      sectionLabels={messages.sections}
      statuses={messages.statuses}
      heroLabels={{
        team: messages.hero.team,
        teams: messages.hero.teams,
      }}
    />
  );
}

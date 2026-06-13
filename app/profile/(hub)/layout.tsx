import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import ProfileShell from "@/components/profile/ProfileShell";
import ProfileShellGate from "@/components/profile/ProfileShellGate";
import { getTextDirection } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { getActiveMatchesForUser } from "@/lib/playerMatchHub";
import {
  getBestPlacement,
  getUserTournamentResultWhere,
  profileShellUserSelect,
  requireProfileUserId,
} from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = profileMessages[locale].metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

export default async function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, userId] = await Promise.all([
    getLocale(),
    requireProfileUserId(),
  ]);

  const [
    user,
    resultPlacements,
    rankingPointsAgg,
    invitationCount,
    activeMatches,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: profileShellUserSelect,
    }),
    prisma.tournamentResult.findMany({
      where: getUserTournamentResultWhere(userId),
      select: {
        placement: true,
      },
    }),
    prisma.rankingPointEvent.aggregate({
      where: {
        userId,
      },
      _sum: {
        points: true,
      },
    }),
    prisma.teamInvite.count({
      where: {
        invitedUserId: userId,
        status: "pending",
      },
    }),
    getActiveMatchesForUser(userId),
  ]);

  if (!user) {
    redirect("/login");
  }

  const shell = (
    <ProfileShell
      user={user}
      messages={profileMessages[locale]}
      dir={getTextDirection(locale)}
      rankingPoints={rankingPointsAgg._sum.points ?? 0}
      resultsCount={resultPlacements.length}
      bestPlacement={getBestPlacement(resultPlacements)}
      invitationCount={invitationCount}
      activeMatchesCount={activeMatches.length}
    >
      {children}
    </ProfileShell>
  );

  return <ProfileShellGate shell={shell}>{children}</ProfileShellGate>;
}

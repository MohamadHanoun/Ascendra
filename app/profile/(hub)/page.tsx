import ProfileNotice from "@/components/ProfileNotice";
import { OverviewPanel } from "@/components/profile/OverviewPanel";
import { getLocale } from "@/lib/i18nServer";
import {
  getBestPlacement,
  getUserTournamentResultWhere,
  profilePointEventSelect,
  profileTournamentResultSelect,
  requireProfileUserId,
  serializePointEvents,
  serializeTournamentResults,
} from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";
import { prisma } from "@/lib/prisma";

type ProfilePageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [params, locale, userId] = await Promise.all([
    searchParams,
    getLocale(),
    requireProfileUserId(),
  ]);

  const [
    teamsCount,
    invitationCount,
    tournamentResults,
    rankingPointsAgg,
    rawPointEvents,
  ] = await Promise.all([
    prisma.team.count({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    }),
    prisma.teamInvite.count({
      where: {
        invitedUserId: userId,
        status: "pending",
      },
    }),
    prisma.tournamentResult.findMany({
      where: getUserTournamentResultWhere(userId),
      select: profileTournamentResultSelect,
      orderBy: {
        awardedAt: "desc",
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
    prisma.rankingPointEvent.findMany({
      where: {
        userId,
      },
      select: profilePointEventSelect,
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const messages = profileMessages[locale];

  return (
    <div className="grid gap-6">
      <ProfileNotice message={params.message} error={params.error} />
      <OverviewPanel
        tournamentResults={serializeTournamentResults(tournamentResults)}
        teamsCount={teamsCount}
        invitationCount={invitationCount}
        pointEvents={serializePointEvents(rawPointEvents)}
        rankingPoints={rankingPointsAgg._sum.points ?? 0}
        bestPlacement={getBestPlacement(tournamentResults)}
        labels={messages.labels}
        sectionLabels={messages.sections}
        heroLabels={{
          team: messages.hero.team,
          teams: messages.hero.teams,
        }}
      />
    </div>
  );
}

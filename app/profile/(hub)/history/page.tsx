import { HistoryPanel } from "@/components/profile/HistoryPanel";
import { getLocale } from "@/lib/i18nServer";
import {
  getUserTournamentResultWhere,
  profilePointEventSelect,
  profileTournamentResultSelect,
  requireProfileUserId,
  serializePointEvents,
  serializeTournamentResults,
} from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";
import { prisma } from "@/lib/prisma";

export default async function ProfileHistoryPage() {
  const [locale, userId] = await Promise.all([
    getLocale(),
    requireProfileUserId(),
  ]);

  const [tournamentResults, rawPointEvents] = await Promise.all([
    prisma.tournamentResult.findMany({
      where: getUserTournamentResultWhere(userId),
      select: profileTournamentResultSelect,
      orderBy: {
        awardedAt: "desc",
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
    <HistoryPanel
      tournamentResults={serializeTournamentResults(tournamentResults)}
      pointEvents={serializePointEvents(rawPointEvents)}
      labels={messages.labels}
      sectionLabels={messages.sections}
    />
  );
}

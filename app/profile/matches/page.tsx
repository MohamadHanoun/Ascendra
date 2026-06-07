import { ActiveMatchesPanel } from "@/components/profile/ActiveMatchesPanel";
import {
  TournamentTasksPanel,
  type ProfileTournamentRegistrationTask,
} from "@/components/profile/TournamentTasksPanel";
import { getLocale } from "@/lib/i18nServer";
import { getActiveMatchesForUser } from "@/lib/playerMatchHub";
import { requireProfileUserId } from "@/lib/profile/profileData";
import { profileMessages } from "@/lib/profile/profileMessages";
import { prisma } from "@/lib/prisma";

const PREFERRED_MATCH_STATUSES = new Set([
  "scheduled",
  "ready",
  "room_created",
  "in_progress",
  "result_pending",
  "disputed",
]);

async function getTournamentRegistrationTasksForUser(
  userId: string,
): Promise<ProfileTournamentRegistrationTask[]> {
  const teamRows = await prisma.team.findMany({
    where: {
      OR: [{ leaderId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  const teamIds = teamRows.map((team) => team.id);

  if (teamIds.length === 0) {
    return [];
  }

  const registrationRows = await prisma.tournamentRegistration.findMany({
    where: {
      teamId: { in: teamIds },
      status: { in: ["registered", "approved", "rejected", "cancelled"] },
    },
    select: {
      id: true,
      status: true,
      rejectionReason: true,
      teamId: true,
      snapshotTeamName: true,
      updatedAt: true,
      team: {
        select: {
          name: true,
        },
      },
      tournament: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 12,
  });

  if (registrationRows.length === 0) {
    return [];
  }

  const tournamentIds = [
    ...new Set(registrationRows.map((registration) => registration.tournament.id)),
  ];
  const matchRows = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId: { in: tournamentIds },
      OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }],
    },
    select: {
      id: true,
      tournamentId: true,
      teamAId: true,
      teamBId: true,
      status: true,
      scheduledAt: true,
      createdAt: true,
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  function findRegistrationMatch(registration: (typeof registrationRows)[number]) {
    const matches = matchRows.filter(
      (match) =>
        match.tournamentId === registration.tournament.id &&
        (match.teamAId === registration.teamId ||
          match.teamBId === registration.teamId),
    );

    return (
      matches.find((match) => PREFERRED_MATCH_STATUSES.has(match.status)) ??
      matches[0] ??
      null
    );
  }

  return registrationRows.map((registration) => {
    const match = findRegistrationMatch(registration);

    return {
      id: registration.id,
      status: registration.status,
      tournamentId: registration.tournament.id,
      tournamentTitle: registration.tournament.title,
      tournamentStatus: registration.tournament.status,
      teamName: registration.snapshotTeamName ?? registration.team.name,
      rejectionReason: registration.rejectionReason,
      tournamentHref: `/tournaments/${registration.tournament.id}`,
      matchHref: match
        ? `/tournaments/${registration.tournament.id}/matches/${match.id}`
        : null,
    };
  });
}

export default async function ProfileMatchesPage() {
  const [locale, userId] = await Promise.all([
    getLocale(),
    requireProfileUserId(),
  ]);
  const [activeMatches, tournamentRegistrationTasks] = await Promise.all([
    getActiveMatchesForUser(userId),
    getTournamentRegistrationTasksForUser(userId),
  ]);
  const messages = profileMessages[locale];

  return (
    <div className="grid gap-6">
      <TournamentTasksPanel
        activeMatches={activeMatches}
        registrations={tournamentRegistrationTasks}
        messages={messages.tournamentTasks}
        activeMatchMessages={messages.activeMatches}
        locale={locale}
      />
      <ActiveMatchesPanel
        cards={activeMatches}
        messages={messages.activeMatches}
        locale={locale}
      />
    </div>
  );
}

export type MatchTeamSide = {
  teamId: string | null | undefined;
  name: string;
  memberUserIds?: string[];
  leaderUserId?: string | null;
};

export type MatchCheckInRecord = {
  id?: string;
  userId: string;
  teamId: string | null;
  username: string;
  createdAt: string;
};

export type MatchCheckInSummary = {
  teamId: string;
  name: string;
  totalMembers: number | null;
  checkedInCount: number;
  checkIns: MatchCheckInRecord[];
};

export function determineUserMatchTeam({
  userId,
  teams,
}: {
  userId: string;
  teams: MatchTeamSide[];
}): string | null {
  for (const team of teams) {
    if (!team.teamId) continue;
    if (team.leaderUserId === userId) return team.teamId;
    if (team.memberUserIds?.includes(userId)) return team.teamId;
  }

  return null;
}

export function summarizeMatchCheckIns({
  teams,
  checkIns,
}: {
  teams: MatchTeamSide[];
  checkIns: MatchCheckInRecord[];
}): MatchCheckInSummary[] {
  return teams
    .filter((team): team is MatchTeamSide & { teamId: string } =>
      Boolean(team.teamId),
    )
    .map((team) => {
      const participantIds = new Set<string>();
      if (team.leaderUserId) participantIds.add(team.leaderUserId);
      for (const memberUserId of team.memberUserIds ?? []) {
        participantIds.add(memberUserId);
      }

      const teamCheckIns = checkIns.filter(
        (checkIn) => checkIn.teamId === team.teamId,
      );

      return {
        teamId: team.teamId,
        name: team.name,
        totalMembers: participantIds.size > 0 ? participantIds.size : null,
        checkedInCount: teamCheckIns.length,
        checkIns: teamCheckIns,
      };
    });
}

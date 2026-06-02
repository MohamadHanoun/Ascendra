/**
 * Pure helpers for tournament registration validation.
 *
 * Extracted from the server action so they can be unit-tested without a
 * database connection.
 */

/**
 * Count the unique players on a team.
 *
 * The team leader is stored separately from TeamMember rows, so a naive
 * `team.members.length` check misses the leader entirely.  This function adds
 * the leader and deduplicates in case the leader somehow also appears in the
 * members array (edge case from legacy data).
 */
export function countTeamPlayers(team: {
  leaderId: string;
  members: { userId: string }[];
}): number {
  const ids = new Set(team.members.map((m) => m.userId));
  ids.add(team.leaderId);
  return ids.size;
}

/**
 * Check whether a team meets the minimum player count for a tournament.
 *
 * @param totalPlayers  Result of countTeamPlayers.
 * @param required      tournament.teamSize.
 */
export function meetsTeamSize(totalPlayers: number, required: number): boolean {
  return totalPlayers >= required;
}

/**
 * Check whether a tournament still has room for one more team.
 *
 * @param activeRegistrations  Current count of active registrations.
 * @param maxTeams             tournament.maxTeams.
 */
export function hasTournamentCapacity(
  activeRegistrations: number,
  maxTeams: number,
): boolean {
  return activeRegistrations < maxTeams;
}

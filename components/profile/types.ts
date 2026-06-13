export type PointEvent = { points: number; createdAt: string };

export type TournamentResult = {
  id: string;
  placement: number;
  points: number;
  note: string | null;
  awardedAt: string;
  snapshotTeamName: string | null;
  snapshotTeamGame: string | null;
  team: { name: string; game: { name: string } | null };
  tournament: { id: string; title: string; game: { name: string } | null };
};

export type Team = {
  id: string;
  name: string;
  status: string;
  leaderId: string;
  rejectionReason: string | null;
  game: { name: string } | null;
  members: Array<{ userId: string; role: string | null }>;
};

export type Invitation = {
  id: string;
  team: {
    name: string;
    game: { name: string } | null;
    members: Array<{ userId: string }>;
  };
  invitedBy: { username: string; displayName: string | null };
};

export type Game = { slug: string; name: string };

export type ProfileTabLabels = {
  overview: string;
  teams: string;
  history: string;
  matches: string;
  achievements: string;
  account: string;
};

export type ProfileLabels = {
  by: string;
  members: string;
  member: string;
  leader: string;
  open: string;
  accept: string;
  decline: string;
  teamName: string;
  teamNamePlaceholder: string;
  game: string;
  selectGame: string;
  teamGame: string;
  createTeam: string;
  ascendraDiscordRequired: string;
  discordRequiredDescription: string;
  results: string;
  result: string;
  best: string;
  pts: string;
  confirmationEyebrow: string;
  cancelLabel: string;
  acceptTitle: string;
  declineTitle: string;
  joinTeamTemplate: string;
  declineTeamTemplate: string;
  acceptingLabel: string;
  decliningLabel: string;
  creatingLabel: string;
  createTeamDialogTitle: string;
  createTeamDialogDesc: string;
};

export type ProfileSectionLabels = {
  invitations: string;
  teamInvitations: string;
  noPendingInvitations: string;
  myTeams: string;
  teamsLead: string;
  noTeamsTitle: string;
  noTeamsDescription: string;
  createTeam: string;
  startNewTeam: string;
  createTeamMeta: string;
  discordRequiredMeta: string;
  tournamentHistory: string;
  noTournamentResults: string;
  performanceEyebrow: string;
  pointHistoryTitle: string;
  noTournamentData: string;
  recentMatchesEyebrow: string;
  matchHistoryTitle: string;
  noResultsYet: string;
  fullRecordEyebrow: string;
  tournamentHistoryTitle: string;
  achievementsEyebrow: string;
  achievementsTitle: string;
  comingSoon: string;
  comingSoonDesc: string;
  tableColTournament: string;
  tableColTeam: string;
  tableColPlace: string;
  tableColPts: string;
  tableColDate: string;
  noActivityDesc: string;
  browseTournaments: string;
};

export type ProfileStatuses = {
  active: string;
  pending: string;
  rejected: string;
  member: string;
  notMember: string;
};

export type ProfileHeroLabels = { team: string; teams: string };

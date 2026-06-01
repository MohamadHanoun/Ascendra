import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

type SlashCommandContext = {
  siteUrl: string;
  apiTimeoutMs: number;
  slashCommandsReady: boolean;
  slashCommandError: string;
  uptimeMs: number;
};

type PublicTournament = {
  id: string;
  title: string;
  game: string;
  date: string;
  prize: string;
  status: string;
  description?: string;
};

type PublicAnnouncement = {
  id: string;
  title: string;
  category: string;
  description: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
};

type PublicRule = {
  id: string;
  text: string;
  order: number;
  isActive: boolean;
};

type PublicStaffMember = {
  id: string;
  name: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  order: number;
  isActive: boolean;
};

type PublicStats = {
  summary: Array<{
    label: string;
    value: string;
  }>;
  details: Array<{
    title: string;
    value: string;
    description: string;
  }>;
  gameBreakdown: Array<{
    game: string;
    tournaments: number;
    results: number;
    points: number;
  }>;
};

type LeaderboardType = "players" | "teams";

type LeaderboardEntry = {
  rank: number;
  username?: string;
  name?: string;
  game?: string;
  leaderName?: string;
  membersCount?: number;
  tournamentResults: number;
  tournamentPoints: number;
  bestPlacement: number | null;
};

type PlayerProfileTeam = {
  id: string;
  name: string;
  game: string;
  status: string;
  role: string;
  membersCount: number;
  registrationsCount: number;
  resultsCount: number;
  tournamentPoints: number;
  bestPlacement: number | null;
  latestRegistration: {
    status: string;
    tournamentTitle: string;
    tournamentGame: string;
    tournamentStatus: string;
    registrationStatus: string;
    tournamentDate: string;
  } | null;
};

type PlayerProfile = {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  role: string;
  isGuildMember: boolean;
  createdAt: string;
  totals: {
    teams: number;
    registrations: number;
    results: number;
    tournamentPoints: number;
    bestPlacement: number | null;
  };
  teams: PlayerProfileTeam[];
  registrations: Array<{
    id: string;
    status: string;
    teamId: string;
    teamName: string;
    tournamentId: string;
    tournamentTitle: string;
    tournamentGame: string;
    tournamentStatus: string;
    registrationStatus: string;
    tournamentDate: string;
  }>;
};

type BotTournamentLookup = {
  success: boolean;
  count: number;
  tournaments: BotTournamentDetails[];
};

type BotTournamentDetails = {
  id: string;
  title: string;
  game: string;
  description: string;
  date: string;
  prize: string;
  imageUrl: string | null;
  maxSlots: number;
  teamSize: number;
  status: string;
  registrationStatus: string;
  discordAnnouncementUrl: string | null;
  registrationsSummary: {
    total: number;
    active: number;
    approved: number;
    pending: number;
    rejected: number;
    cancelled: number;
  };
  teams: Array<{
    id: string;
    name: string;
    game: string;
    status: string;
    registrationStatus: string;
    leaderName: string;
    membersCount: number;
  }>;
  results: Array<{
    id: string;
    teamId: string;
    teamName: string;
    placement: number;
    points: number;
  }>;
};

type BotTeamLookup = {
  success: boolean;
  count: number;
  teams: BotTeamDetails[];
};

type BotTeamDetails = {
  id: string;
  name: string;
  game: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  membersCount: number;
  resultsCount: number;
  registrationsCount: number;
  tournamentPoints: number;
  bestPlacement: number | null;
  leader: {
    id: string;
    discordId: string;
    username: string;
    avatar: string | null;
    role: string;
  };
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      discordId: string;
      username: string;
      avatar: string | null;
      role: string;
    };
  }>;
  registrations: Array<{
    id: string;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
    approvedAt: string | null;
    cancelledAt: string | null;
    reviewedAt: string | null;
    tournament: {
      id: string;
      title: string;
      game: string;
      date: string;
      status: string;
      registrationStatus: string;
    };
  }>;
  results: Array<{
    id: string;
    placement: number;
    points: number;
    note: string | null;
    awardedAt: string;
    tournament: {
      id: string;
      title: string;
      game: string;
      date: string;
      status: string;
    };
  }>;
};

type BotMatchDetails = {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  tournamentGame: string | null;
  roundNumber: number;
  matchNumber: number;
  status: string;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  teamAName: string | null;
  teamBName: string | null;
  winnerName: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  isBye: boolean;
  report: {
    teamAScore: number;
    teamBScore: number;
    status: string;
  } | null;
};

const COLORS = {
  brand: 0xb88746,
  secondary: 0x6f5431,
  success: 0x2f855a,
  warning: 0xb7791f,
  error: 0xb23a48,
  info: 0xb88746,
  tournament: 0xb88746,
  premium: 0xb88746,
  deepPurple: 0x6f5431,
};

const games = ["Overall", "Valorant", "League of Legends", "CS2", "Dota2"];

const tournamentStatuses = [
  "all",
  "open",
  "upcoming",
  "closed",
  "ended",
  "cancelled",
];

function getSiteLink(ctx: SlashCommandContext, path = "") {
  if (!path) {
    return ctx.siteUrl;
  }

  return `${ctx.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function getDiscordInviteUrl() {
  return (
    process.env.BOT_DISCORD_INVITE_URL ||
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ||
    ""
  ).trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function formatUptime(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }

  const totalSeconds = Math.floor(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatLatency(interaction: any) {
  const latency = Number(interaction.client?.ws?.ping);

  if (!Number.isFinite(latency) || latency < 0) {
    return "-";
  }

  return `${Math.round(latency)}ms`;
}

function getGuildLabel(interaction: any) {
  return interaction.guild?.name || interaction.guildId || "Direct Message";
}

function isValidHttpUrl(value: unknown) {
  const raw = String(value || "").trim();

  if (!raw) {
    return false;
  }

  try {
    const url = new URL(raw);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildLinkRow(label: string, url: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setLabel(label).setStyle(ButtonStyle.Link).setURL(url),
  );
}

function buildButtonRow(
  links: Array<{
    label: string;
    url: string;
  }>,
) {
  const row = new ActionRowBuilder<ButtonBuilder>();

  for (const link of links.slice(0, 5)) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(link.label)
        .setStyle(ButtonStyle.Link)
        .setURL(link.url),
    );
  }

  return row;
}

function buildTwoLinkRow(
  first: {
    label: string;
    url: string;
  },
  second?: {
    label: string;
    url: string;
  },
) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(first.label)
      .setStyle(ButtonStyle.Link)
      .setURL(first.url),
  );

  if (second) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(second.label)
        .setStyle(ButtonStyle.Link)
        .setURL(second.url),
    );
  }

  return row;
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBotJsonWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const botApiToken = process.env.BOT_API_TOKEN || "";

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${botApiToken}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeLeaderboardType(value: string | null): LeaderboardType {
  return value === "teams" ? "teams" : "players";
}

function normalizeGame(value: string | null) {
  if (value && games.includes(value)) {
    return value;
  }

  return "Overall";
}

function normalizeTournamentStatus(value: string | null) {
  if (value && tournamentStatuses.includes(value)) {
    return value;
  }

  return "all";
}

function formatTournamentStatus(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "open") return "Open";
  if (normalized === "upcoming") return "Upcoming";
  if (normalized === "closed") return "Closed";
  if (normalized === "ended") return "Ended";
  if (normalized === "cancelled") return "Cancelled";

  return status || "-";
}

function formatRegistrationStatus(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "open") return "Open";
  if (normalized === "upcoming") return "Upcoming";
  if (normalized === "closed") return "Closed";
  if (normalized === "approved") return "Approved";
  if (normalized === "registered") return "Registered";
  if (normalized === "pending") return "Pending";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "cancelled") return "Cancelled";

  return status || "-";
}

function formatPlacement(value: number | null) {
  if (!value) {
    return "-";
  }

  return `#${value}`;
}

function formatTeamStatus(value: string) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "approved") return "Approved";
  if (normalized === "pending") return "Pending";
  if (normalized === "draft") return "Draft";
  if (normalized === "rejected") return "Rejected";

  return value || "-";
}

function parseFlexibleDate(value: string) {
  if (!value) {
    return null;
  }

  const direct = new Date(value);

  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = value.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const parsed = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 18, 0, 0),
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getDateSortValue(value: string) {
  const date = parseFlexibleDate(value);

  if (!date) {
    return Number.MAX_SAFE_INTEGER;
  }

  return date.getTime();
}

function isUpcomingScheduleStatus(status: string) {
  const normalized = String(status || "").toLowerCase();

  return normalized === "open" || normalized === "upcoming";
}

async function fetchPublicTournaments(ctx: SlashCommandContext) {
  const data = await fetchJsonWithTimeout(
    `${ctx.siteUrl}/api/tournaments`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !Array.isArray(data.data)) {
    return [] as PublicTournament[];
  }

  return data.data as PublicTournament[];
}

async function fetchAnnouncements(ctx: SlashCommandContext) {
  const data = await fetchJsonWithTimeout(
    `${ctx.siteUrl}/api/announcements`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !Array.isArray(data.data)) {
    return [] as PublicAnnouncement[];
  }

  return data.data as PublicAnnouncement[];
}

async function fetchRules(ctx: SlashCommandContext) {
  const data = await fetchJsonWithTimeout(
    `${ctx.siteUrl}/api/rules`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !Array.isArray(data.data)) {
    return [] as PublicRule[];
  }

  return data.data as PublicRule[];
}

async function fetchStaff(ctx: SlashCommandContext) {
  const data = await fetchJsonWithTimeout(
    `${ctx.siteUrl}/api/staff`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !Array.isArray(data.data)) {
    return [] as PublicStaffMember[];
  }

  return data.data as PublicStaffMember[];
}

async function fetchStats(ctx: SlashCommandContext) {
  const data = await fetchJsonWithTimeout(
    `${ctx.siteUrl}/api/stats`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !data.data) {
    return null;
  }

  return data.data as PublicStats;
}

function filterTournaments(
  tournaments: PublicTournament[],
  selectedGame: string,
  selectedStatus: string,
) {
  return tournaments.filter((tournament) => {
    const gameMatches =
      selectedGame === "Overall" ||
      String(tournament.game || "").toLowerCase() ===
        selectedGame.toLowerCase();

    const statusMatches =
      selectedStatus === "all" ||
      String(tournament.status || "").toLowerCase() === selectedStatus;

    return gameMatches && statusMatches;
  });
}

function buildTournamentListDescription(tournaments: PublicTournament[]) {
  if (tournaments.length === 0) {
    return "No tournaments available.";
  }

  return tournaments
    .slice(0, 5)
    .map((tournament, index) => {
      return [
        `**${index + 1}. ${tournament.title}**`,
        `${tournament.game} | ${formatTournamentStatus(tournament.status)}`,
        `Date: ${tournament.date || "-"}`,
        `Prize: ${tournament.prize || "-"}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildScheduleDescription(tournaments: PublicTournament[]) {
  if (tournaments.length === 0) {
    return "No upcoming tournaments found.";
  }

  return tournaments
    .slice(0, 8)
    .map((tournament, index) => {
      return [
        `**${index + 1}. ${tournament.title}**`,
        `${tournament.game} | ${formatTournamentStatus(tournament.status)}`,
        `Date: ${tournament.date || "-"}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildAnnouncementsDescription(announcements: PublicAnnouncement[]) {
  if (announcements.length === 0) {
    return "No announcements available.";
  }

  return announcements
    .slice(0, 5)
    .map((announcement, index) => {
      return [
        `**${index + 1}. ${announcement.title}**`,
        `${announcement.important ? "Important" : announcement.category}`,
        truncate(announcement.description || "-", 220),
      ].join("\n");
    })
    .join("\n\n");
}

function buildRulesDescription(rules: PublicRule[]) {
  if (rules.length === 0) {
    return "No active rules available.";
  }

  return rules
    .slice(0, 10)
    .map((rule) => `**${rule.order}.** ${truncate(rule.text, 220)}`)
    .join("\n\n");
}

function buildStaffDescription(staff: PublicStaffMember[]) {
  if (staff.length === 0) {
    return "No staff members available.";
  }

  return staff
    .slice(0, 10)
    .map((member, index) => {
      return [
        `**${index + 1}. ${member.name}**`,
        `${member.role} | ${member.status}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildStatsDescription(stats: PublicStats) {
  if (stats.summary.length === 0) {
    return "No stats available.";
  }

  return stats.summary
    .slice(0, 8)
    .map((item) => `**${item.label}:** ${item.value}`)
    .join("\n");
}

function buildGameStatsDescription(stats: PublicStats) {
  if (stats.gameBreakdown.length === 0) {
    return "No game stats available.";
  }

  return stats.gameBreakdown
    .slice(0, 5)
    .map((item) => {
      return [
        `**${item.game}**`,
        `Tournaments: ${item.tournaments} | Results: ${item.results} | Points: ${item.points}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildTournamentRows(
  ctx: SlashCommandContext,
  tournaments: PublicTournament[],
) {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const visibleTournaments = tournaments.slice(0, 4);

  if (visibleTournaments.length > 0) {
    const row = new ActionRowBuilder<ButtonBuilder>();

    for (const tournament of visibleTournaments) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel(truncate(tournament.title, 80))
          .setStyle(ButtonStyle.Link)
          .setURL(getSiteLink(ctx, `/tournaments/${tournament.id}`)),
      );
    }

    rows.push(row);
  }

  rows.push(buildLinkRow("Tournaments", getSiteLink(ctx, "/tournaments")));

  return rows;
}

async function fetchLeaderboard(
  ctx: SlashCommandContext,
  params: {
    type: LeaderboardType;
    game: string;
  },
) {
  const query = new URLSearchParams({
    type: params.type,
    game: params.game,
  });

  const data = await fetchJsonWithTimeout(
    `${ctx.siteUrl}/api/leaderboard?${query.toString()}`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !Array.isArray(data.data)) {
    return {
      type: params.type,
      game: params.game,
      entries: [] as LeaderboardEntry[],
    };
  }

  return {
    type: normalizeLeaderboardType(data.type),
    game: normalizeGame(data.game),
    entries: data.data as LeaderboardEntry[],
  };
}

function buildLeaderboardTitle(type: LeaderboardType, game: string) {
  const label = type === "teams" ? "Teams" : "Players";

  return `${label} Leaderboard | ${game}`;
}

function buildLeaderboardDescription(
  entries: LeaderboardEntry[],
  type: LeaderboardType,
) {
  if (entries.length === 0) {
    return "No leaderboard results available.";
  }

  return entries
    .slice(0, 10)
    .map((entry) => {
      const name =
        type === "teams"
          ? entry.name || "Unnamed team"
          : entry.username || "Unnamed player";

      const details =
        type === "teams"
          ? `Leader: ${entry.leaderName || "-"} | Members: ${
              entry.membersCount ?? "-"
            }`
          : `Results: ${entry.tournamentResults}`;

      return [
        `**#${entry.rank} - ${name}**`,
        `${entry.tournamentPoints} pts | Best: ${formatPlacement(
          entry.bestPlacement,
        )}`,
        details,
      ].join("\n");
    })
    .join("\n\n");
}

async function fetchPlayerProfile(ctx: SlashCommandContext, discordId: string) {
  const query = new URLSearchParams({
    discordId,
  });

  const data = await fetchBotJsonWithTimeout(
    `${ctx.siteUrl}/api/bot/player-profile?${query.toString()}`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !data.profile) {
    return null;
  }

  return data.profile as PlayerProfile;
}

async function fetchTournamentLookup(ctx: SlashCommandContext, query: string) {
  const params = new URLSearchParams({
    query,
  });

  const data = await fetchBotJsonWithTimeout(
    `${ctx.siteUrl}/api/bot/tournament-lookup?${params.toString()}`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !Array.isArray(data.tournaments)) {
    return [] as BotTournamentDetails[];
  }

  return (data as BotTournamentLookup).tournaments;
}

async function fetchTeamLookup(ctx: SlashCommandContext, query: string) {
  const params = new URLSearchParams({
    query,
  });

  const data = await fetchBotJsonWithTimeout(
    `${ctx.siteUrl}/api/bot/team-lookup?${params.toString()}`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success || !Array.isArray(data.teams)) {
    return [] as BotTeamDetails[];
  }

  return (data as BotTeamLookup).teams;
}

async function fetchMatchLookup(
  ctx: SlashCommandContext,
  query: string,
): Promise<BotMatchDetails | null> {
  const params = new URLSearchParams({ query });

  const data = await fetchBotJsonWithTimeout(
    `${ctx.siteUrl}/api/bot/match-lookup?${params.toString()}`,
    ctx.apiTimeoutMs,
  );

  if (!data?.success) {
    return null;
  }

  return (data.match as BotMatchDetails) || null;
}

function formatMatchStatus(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "scheduled") return "Scheduled";
  if (normalized === "ready") return "Ready";
  if (normalized === "room_created") return "Room created";
  if (normalized === "in_progress") return "In progress";
  if (normalized === "result_pending") return "Result pending";
  if (normalized === "disputed") return "Disputed";
  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled") return "Cancelled";
  if (normalized === "forfeit") return "Forfeit";
  if (normalized === "bye") return "Bye";

  return status || "—";
}

function formatDiscordTimestamp(isoString: string | null) {
  if (!isoString) return "—";

  const date = new Date(isoString);

  if (isNaN(date.getTime())) return "—";

  return `<t:${Math.floor(date.getTime() / 1000)}:f>`;
}

function getTeamLeaderboardUrl(ctx: SlashCommandContext, team: BotTeamDetails) {
  const url = new URL(getSiteLink(ctx, "/leaderboard"));

  url.searchParams.set("type", "teams");
  url.searchParams.set("game", team.game);

  return url.toString();
}

function buildTeamDetailsDescription(team: BotTeamDetails) {
  return [
    `Game: **${team.game}**`,
    `Status: **${formatTeamStatus(team.status)}**`,
    `Leader: **${team.leader.username}**`,
    `Members: **${team.membersCount}**`,
    "",
    `Tournament registrations: **${team.registrationsCount}**`,
    `Tournament results: **${team.resultsCount}**`,
    `Tournament points: **${team.tournamentPoints}**`,
    `Best placement: **${formatPlacement(team.bestPlacement)}**`,
  ].join("\n");
}

function buildTeamRosterDescription(team: BotTeamDetails) {
  if (team.members.length === 0) {
    return "No members found.";
  }

  return team.members
    .slice(0, 10)
    .map((member, index) => {
      return [
        `**${index + 1}. ${member.user.username}**`,
        `Team role: ${member.role} | Site role: ${member.user.role}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildTeamRegistrationsDescription(team: BotTeamDetails) {
  if (team.registrations.length === 0) {
    return "No tournament registrations found.";
  }

  return team.registrations
    .slice(0, 6)
    .map((registration, index) => {
      return [
        `**${index + 1}. ${registration.tournament.title}**`,
        `${registration.tournament.game} | ${formatTournamentStatus(
          registration.tournament.status,
        )}`,
        `Registration: ${formatRegistrationStatus(registration.status)}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildTeamResultsDescription(team: BotTeamDetails) {
  if (team.results.length === 0) {
    return "No tournament results found.";
  }

  return team.results
    .slice(0, 8)
    .map((result) => {
      return [
        `**#${result.placement} - ${result.tournament.title}**`,
        `${result.tournament.game} | ${result.points} pts`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildProfileDescription(profile: PlayerProfile) {
  return [
    `Role: **${profile.role}**`,
    `Guild member: **${profile.isGuildMember ? "Yes" : "No"}**`,
    "",
    `Teams: **${profile.totals.teams}**`,
    `Tournament results: **${profile.totals.results}**`,
    `Tournament points: **${profile.totals.tournamentPoints}**`,
    `Best placement: **${formatPlacement(profile.totals.bestPlacement)}**`,
  ].join("\n");
}

function buildTeamsDescription(teams: PlayerProfileTeam[]) {
  if (teams.length === 0) {
    return "No teams found.";
  }

  return teams
    .slice(0, 8)
    .map((team, index) => {
      return [
        `**${index + 1}. ${team.name}**`,
        `${team.game} | ${formatTeamStatus(team.status)} | ${team.role}`,
        `Members: ${team.membersCount} | Points: ${team.tournamentPoints} | Best: ${formatPlacement(
          team.bestPlacement,
        )}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildRegistrationsDescription(profile: PlayerProfile) {
  if (profile.registrations.length === 0) {
    return "No tournament registrations found.";
  }

  return profile.registrations
    .slice(0, 5)
    .map((registration, index) => {
      return [
        `**${index + 1}. ${registration.tournamentTitle}**`,
        `${registration.tournamentGame} | ${formatTournamentStatus(
          registration.tournamentStatus,
        )}`,
        `Team: ${registration.teamName}`,
        `Registration: ${formatRegistrationStatus(registration.status)}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildTournamentDetailsDescription(tournament: BotTournamentDetails) {
  const summary = tournament.registrationsSummary;

  return [
    tournament.description ? truncate(tournament.description, 500) : "",
    "",
    `Game: **${tournament.game}**`,
    `Date: **${tournament.date || "-"}**`,
    `Status: **${formatTournamentStatus(tournament.status)}**`,
    `Registration: **${formatRegistrationStatus(
      tournament.registrationStatus,
    )}**`,
    `Team size: **${tournament.teamSize}**`,
    `Slots: **${summary.active}/${tournament.maxSlots}**`,
    `Prize: **${tournament.prize || "-"}**`,
    "",
    `Approved: **${summary.approved}** | Pending: **${summary.pending}** | Total: **${summary.total}**`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTournamentTeamsDescription(tournament: BotTournamentDetails) {
  if (tournament.teams.length === 0) {
    return "No registered teams.";
  }

  return tournament.teams
    .slice(0, 8)
    .map((team, index) => {
      return [
        `**${index + 1}. ${team.name}**`,
        `Leader: ${team.leaderName} | Members: ${team.membersCount}`,
        `Status: ${formatRegistrationStatus(team.registrationStatus)}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildTournamentResultsDescription(tournament: BotTournamentDetails) {
  if (tournament.results.length === 0) {
    return "No results have been published for this tournament.";
  }

  return tournament.results
    .slice(0, 8)
    .map((result) => {
      return `**#${result.placement} - ${result.teamName}**\n${result.points} pts`;
    })
    .join("\n\n");
}

function getTargetDiscordUser(interaction: any) {
  return interaction.options?.getUser("user") || interaction.user;
}

async function deferCommand(interaction: any) {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({
      ephemeral: true,
    });
  }
}

async function replyToCommand(interaction: any, payload: any) {
  if (interaction.deferred) {
    await interaction.editReply(payload);
    return;
  }

  if (interaction.replied) {
    await interaction.followUp({
      ...payload,
      ephemeral: true,
    });

    return;
  }

  await interaction.reply({
    ...payload,
    ephemeral: true,
  });
}

export function getSlashCommands() {
  return [
    {
      name: "ascendra",
      description: "Open Ascendra.",
    },
    {
      name: "about",
      description: "Show Ascendra overview.",
    },
    {
      name: "links",
      description: "Show Ascendra quick links.",
    },
    {
      name: "invite",
      description: "Get the Ascendra Discord invite.",
    },
    {
      name: "ping",
      description: "Check bot response.",
    },
    {
      name: "tournaments",
      description: "Show Ascendra tournaments.",
      options: [
        {
          name: "game",
          description: "Game filter.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: games.map((game) => ({
            name: game,
            value: game,
          })),
        },
        {
          name: "status",
          description: "Status filter.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "All", value: "all" },
            { name: "Open", value: "open" },
            { name: "Upcoming", value: "upcoming" },
            { name: "Closed", value: "closed" },
            { name: "Ended", value: "ended" },
            { name: "Cancelled", value: "cancelled" },
          ],
        },
      ],
    },
    {
      name: "schedule",
      description: "Show upcoming Ascendra tournaments.",
      options: [
        {
          name: "game",
          description: "Game filter.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: games.map((game) => ({
            name: game,
            value: game,
          })),
        },
      ],
    },
    {
      name: "tournament",
      description: "Show tournament details.",
      options: [
        {
          name: "query",
          autocomplete: true,
          description: "Tournament title, game, or ID.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "results",
      description: "Show tournament results.",
      options: [
        {
          name: "query",
          autocomplete: true,
          description: "Tournament title, game, or ID.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "match",
      description: "Find a tournament match.",
      options: [
        {
          name: "query",
          autocomplete: true,
          description: "Match ID or tournament title.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "leaderboard",
      description: "Show the Ascendra leaderboard.",
      options: [
        {
          name: "type",
          description: "Leaderboard type.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "Players", value: "players" },
            { name: "Teams", value: "teams" },
          ],
        },
        {
          name: "game",
          description: "Game filter.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: games.map((game) => ({
            name: game,
            value: game,
          })),
        },
      ],
    },
    {
      name: "games",
      description: "Show Ascendra game stats.",
    },
    {
      name: "profile",
      description: "Show an Ascendra player profile.",
      options: [
        {
          name: "user",
          description: "Discord user.",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: "teams",
      description: "Show a player's Ascendra teams.",
      options: [
        {
          name: "user",
          description: "Discord user.",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: "team",
      description: "Show Ascendra team details.",
      options: [
        {
          name: "query",
          autocomplete: true,
          description: "Team name, game, or ID.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "roster",
      description: "Show an Ascendra team roster.",
      options: [
        {
          name: "query",
          autocomplete: true,
          description: "Team name, game, or ID.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "teamresults",
      description: "Show Ascendra team results.",
      options: [
        {
          name: "query",
          autocomplete: true,
          description: "Team name, game, or ID.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "registrations",
      description: "Show a player's tournament registrations.",
      options: [
        {
          name: "user",
          description: "Discord user.",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: "announcements",
      description: "Show latest Ascendra announcements.",
    },
    {
      name: "stats",
      description: "Show Ascendra community stats.",
    },
    {
      name: "staff",
      description: "Show Ascendra staff.",
    },
    {
      name: "rules",
      description: "Show Ascendra rules.",
    },
    {
      name: "community",
      description: "Open Ascendra community.",
    },
    {
      name: "status",
      description: "Check bot status.",
    },
    {
      name: "help",
      description: "Show Ascendra bot commands.",
    },
  ];
}

export async function handleSlashCommand(
  interaction: any,
  ctx: SlashCommandContext,
) {
  const commandName = interaction.commandName;

  if (commandName === "ascendra") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle("Ascendra")
      .setDescription("Open the Ascendra platform.")
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Website", getSiteLink(ctx))],
    });

    return;
  }

  if (commandName === "about") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle("Ascendra")
      .setDescription(
        [
          "Premium esports tournaments, teams, rankings, and community updates.",
          "",
          "Built for organized competition and clean match visibility.",
        ].join("\n"),
      )
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildButtonRow([
          { label: "Website", url: getSiteLink(ctx) },
          { label: "Tournaments", url: getSiteLink(ctx, "/tournaments") },
          { label: "Leaderboard", url: getSiteLink(ctx, "/leaderboard") },
        ]),
      ],
    });

    return;
  }

  if (commandName === "links") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.deepPurple)
      .setTitle("Ascendra Links")
      .setDescription("Key Ascendra destinations.")
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildButtonRow([
          { label: "Website", url: getSiteLink(ctx) },
          { label: "Tournaments", url: getSiteLink(ctx, "/tournaments") },
          { label: "Leaderboard", url: getSiteLink(ctx, "/leaderboard") },
          { label: "Rules", url: getSiteLink(ctx, "/rules") },
        ]),
        buildButtonRow([
          { label: "Community", url: getSiteLink(ctx, "/community") },
          { label: "Announcements", url: getSiteLink(ctx, "/announcements") },
          { label: "Staff", url: getSiteLink(ctx, "/staff") },
          { label: "Stats", url: getSiteLink(ctx, "/stats") },
        ]),
      ],
    });

    return;
  }

  if (commandName === "invite") {
    const inviteUrl = getDiscordInviteUrl();
    const targetUrl = isValidHttpUrl(inviteUrl)
      ? inviteUrl
      : getSiteLink(ctx, "/community");

    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle("Ascendra Discord")
      .setDescription("Join the official Ascendra Discord.")
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildLinkRow(
          isValidHttpUrl(inviteUrl) ? "Discord" : "Community",
          targetUrl,
        ),
      ],
    });

    return;
  }

  if (commandName === "ping") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle("Bot Response")
      .addFields(
        {
          name: "Status",
          value: "Online",
          inline: true,
        },
        {
          name: "Uptime",
          value: formatUptime(ctx.uptimeMs),
          inline: true,
        },
      )
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
    });

    return;
  }

  if (commandName === "tournaments") {
    await deferCommand(interaction);

    const selectedGame = normalizeGame(
      interaction.options?.getString("game") || null,
    );
    const selectedStatus = normalizeTournamentStatus(
      interaction.options?.getString("status") || null,
    );

    const tournaments = filterTournaments(
      await fetchPublicTournaments(ctx),
      selectedGame,
      selectedStatus,
    );

    const visibleTournaments = tournaments.slice(0, 5);

    const titleParts = ["Ascendra Tournaments"];

    if (selectedGame !== "Overall") {
      titleParts.push(selectedGame);
    }

    if (selectedStatus !== "all") {
      titleParts.push(formatTournamentStatus(selectedStatus));
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle(titleParts.join(" | "))
      .setDescription(buildTournamentListDescription(visibleTournaments))
      .setFooter({
        text:
          tournaments.length > visibleTournaments.length
            ? `${visibleTournaments.length} of ${tournaments.length} shown`
            : `${visibleTournaments.length} shown`,
      })
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: buildTournamentRows(ctx, visibleTournaments),
    });

    return;
  }

  if (commandName === "schedule") {
    await deferCommand(interaction);

    const selectedGame = normalizeGame(
      interaction.options?.getString("game") || null,
    );

    const tournaments = filterTournaments(
      await fetchPublicTournaments(ctx),
      selectedGame,
      "all",
    )
      .filter((tournament) => isUpcomingScheduleStatus(tournament.status))
      .sort((a, b) => getDateSortValue(a.date) - getDateSortValue(b.date));

    const visibleTournaments = tournaments.slice(0, 8);

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle(
        selectedGame === "Overall"
          ? "Ascendra Schedule"
          : `Ascendra Schedule | ${selectedGame}`,
      )
      .setDescription(buildScheduleDescription(visibleTournaments))
      .setFooter({
        text:
          tournaments.length > visibleTournaments.length
            ? `${visibleTournaments.length} of ${tournaments.length} shown`
            : `${visibleTournaments.length} shown`,
      })
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: buildTournamentRows(ctx, visibleTournaments),
    });

    return;
  }

  if (commandName === "tournament") {
    await deferCommand(interaction);

    const query = String(interaction.options?.getString("query") || "").trim();
    const tournaments = await fetchTournamentLookup(ctx, query);
    const tournament = tournaments[0];

    if (!tournament) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Tournament not found")
        .setDescription("No tournament found.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Tournaments", getSiteLink(ctx, "/tournaments")),
        ],
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle(tournament.title)
      .setDescription(buildTournamentDetailsDescription(tournament))
      .setFooter({
        text:
          tournaments.length > 1
            ? `Showing best match | ${tournaments.length} matches found`
            : "Tournament details",
      })
      .setTimestamp();

    if (tournament.imageUrl && isValidHttpUrl(tournament.imageUrl)) {
      embed.setImage(tournament.imageUrl);
    }

    const teamEmbed = new EmbedBuilder()
      .setColor(COLORS.deepPurple)
      .setTitle("Registered teams")
      .setDescription(buildTournamentTeamsDescription(tournament))
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed, teamEmbed],
      components: [
        buildTwoLinkRow(
          {
            label: "Tournament",
            url: getSiteLink(ctx, `/tournaments/${tournament.id}`),
          },
          tournament.discordAnnouncementUrl &&
            isValidHttpUrl(tournament.discordAnnouncementUrl)
            ? {
                label: "Discord",
                url: tournament.discordAnnouncementUrl,
              }
            : undefined,
        ),
      ],
    });

    return;
  }

  if (commandName === "results") {
    await deferCommand(interaction);

    const query = String(interaction.options?.getString("query") || "").trim();
    const tournaments = await fetchTournamentLookup(ctx, query);
    const tournament = tournaments[0];

    if (!tournament) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Tournament not found")
        .setDescription("No tournament found.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Tournaments", getSiteLink(ctx, "/tournaments")),
        ],
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(`${tournament.title} | Results`)
      .setDescription(buildTournamentResultsDescription(tournament))
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildLinkRow(
          "Tournament",
          getSiteLink(ctx, `/tournaments/${tournament.id}`),
        ),
      ],
    });

    return;
  }

  if (commandName === "match") {
    await deferCommand(interaction);

    const query = String(interaction.options?.getString("query") || "").trim();
    const match = await fetchMatchLookup(ctx, query);

    if (!match) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("No match found")
        .setDescription("No match found.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Tournaments", getSiteLink(ctx, "/tournaments")),
        ],
      });

      return;
    }

    const teamA = match.teamAName ?? "TBD";
    const teamB = match.teamBName ?? "TBD";

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle("Match details")
      .addFields(
        {
          name: "Tournament",
          value: match.tournamentTitle,
          inline: false,
        },
        {
          name: "Match",
          value: `Round ${match.roundNumber}, Match ${match.matchNumber}`,
          inline: true,
        },
        {
          name: "Teams",
          value: match.isBye ? "Bye" : `${teamA} vs ${teamB}`,
          inline: true,
        },
        {
          name: "Status",
          value: formatMatchStatus(match.status),
          inline: true,
        },
        {
          name: "Scheduled",
          value: formatDiscordTimestamp(match.scheduledAt),
          inline: true,
        },
        {
          name: "Result",
          value: match.report
            ? `${match.report.teamAScore} – ${match.report.teamBScore}`
            : "—",
          inline: true,
        },
        {
          name: "Winner",
          value: match.winnerName ?? "—",
          inline: true,
        },
      )
      .setTimestamp();

    const matchUrl = getSiteLink(
      ctx,
      `/tournaments/${match.tournamentId}/matches/${match.id}`,
    );
    const tournamentUrl = getSiteLink(ctx, `/tournaments/${match.tournamentId}`);

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildTwoLinkRow(
          { label: "Open match", url: matchUrl },
          { label: "Tournament", url: tournamentUrl },
        ),
      ],
    });

    return;
  }

  if (commandName === "leaderboard") {
    await deferCommand(interaction);

    const selectedType = normalizeLeaderboardType(
      interaction.options?.getString("type") || null,
    );
    const selectedGame = normalizeGame(
      interaction.options?.getString("game") || null,
    );

    const leaderboard = await fetchLeaderboard(ctx, {
      type: selectedType,
      game: selectedGame,
    });

    const visibleEntries = leaderboard.entries.slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(buildLeaderboardTitle(leaderboard.type, leaderboard.game))
      .setDescription(
        buildLeaderboardDescription(visibleEntries, leaderboard.type),
      )
      .setFooter({
        text:
          leaderboard.entries.length > visibleEntries.length
            ? `${visibleEntries.length} of ${leaderboard.entries.length} shown`
            : `${visibleEntries.length} shown`,
      })
      .setTimestamp();

    const leaderboardUrl = new URL(getSiteLink(ctx, "/leaderboard"));

    leaderboardUrl.searchParams.set("type", leaderboard.type);
    leaderboardUrl.searchParams.set("game", leaderboard.game);

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Leaderboard", leaderboardUrl.toString())],
    });

    return;
  }

  if (commandName === "games") {
    await deferCommand(interaction);

    const stats = await fetchStats(ctx);

    if (!stats) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Games unavailable")
        .setDescription("Ascendra could not load game stats.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [buildLinkRow("Stats", getSiteLink(ctx, "/stats"))],
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle("Ascendra Games")
      .setDescription(buildGameStatsDescription(stats))
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Stats", getSiteLink(ctx, "/stats"))],
    });

    return;
  }

  if (commandName === "profile") {
    await deferCommand(interaction);

    const targetUser = getTargetDiscordUser(interaction);
    const profile = await fetchPlayerProfile(ctx, targetUser.id);

    if (!profile) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Profile not found")
        .setDescription("No Ascendra profile found.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Profile", getSiteLink(ctx, "/profile")),
        ],
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle(`${profile.username} | Ascendra Profile`)
      .setDescription(buildProfileDescription(profile))
      .setTimestamp();

    if (profile.avatar && isValidHttpUrl(profile.avatar)) {
      embed.setThumbnail(profile.avatar);
    }

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Profile", getSiteLink(ctx, "/profile"))],
    });

    return;
  }

  if (commandName === "teams") {
    await deferCommand(interaction);

    const targetUser = getTargetDiscordUser(interaction);
    const profile = await fetchPlayerProfile(ctx, targetUser.id);

    if (!profile) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Teams not found")
        .setDescription("No Ascendra profile found.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Profile", getSiteLink(ctx, "/profile")),
        ],
      });

      return;
    }

    if (commandName === "team") {
      await deferCommand(interaction);

      const query = String(
        interaction.options?.getString("query") || "",
      ).trim();
      const teams = await fetchTeamLookup(ctx, query);
      const team = teams[0];

      if (!team) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle("Team not found")
          .setDescription("No team found.")
          .setTimestamp();

        await replyToCommand(interaction, {
          embeds: [embed],
          components: [
            buildLinkRow("Profile", getSiteLink(ctx, "/profile")),
          ],
        });

        return;
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.tournament)
        .setTitle(`${team.name} | Team Details`)
        .setDescription(buildTeamDetailsDescription(team))
        .setFooter({
          text:
            teams.length > 1
              ? `Showing best match | ${teams.length} matches found`
              : "Team details",
        })
        .setTimestamp();

      if (team.leader.avatar && isValidHttpUrl(team.leader.avatar)) {
        embed.setThumbnail(team.leader.avatar);
      }

      const registrationsEmbed = new EmbedBuilder()
        .setColor(COLORS.deepPurple)
        .setTitle("Recent registrations")
        .setDescription(buildTeamRegistrationsDescription(team))
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed, registrationsEmbed],
        components: [
          buildTwoLinkRow(
            {
              label: "Leaderboard",
              url: getTeamLeaderboardUrl(ctx, team),
            },
            {
              label: "Tournaments",
              url: getSiteLink(ctx, "/tournaments"),
            },
          ),
        ],
      });

      return;
    }

    if (commandName === "roster") {
      await deferCommand(interaction);

      const query = String(
        interaction.options?.getString("query") || "",
      ).trim();
      const teams = await fetchTeamLookup(ctx, query);
      const team = teams[0];

      if (!team) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle("Team not found")
          .setDescription("No team found.")
          .setTimestamp();

        await replyToCommand(interaction, {
          embeds: [embed],
          components: [
            buildLinkRow("Profile", getSiteLink(ctx, "/profile")),
          ],
        });

        return;
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.deepPurple)
        .setTitle(`${team.name} | Roster`)
        .setDescription(buildTeamRosterDescription(team))
        .setFooter({
          text:
            team.members.length > 10
              ? `10 of ${team.members.length} shown`
              : `${team.members.length} shown`,
        })
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildTwoLinkRow(
            {
              label: "Leaderboard",
              url: getTeamLeaderboardUrl(ctx, team),
            },
            {
              label: "Profile",
              url: getSiteLink(ctx, "/profile"),
            },
          ),
        ],
      });

      return;
    }

    if (commandName === "teamresults") {
      await deferCommand(interaction);

      const query = String(
        interaction.options?.getString("query") || "",
      ).trim();
      const teams = await fetchTeamLookup(ctx, query);
      const team = teams[0];

      if (!team) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle("Team not found")
          .setDescription("No team found.")
          .setTimestamp();

        await replyToCommand(interaction, {
          embeds: [embed],
          components: [
            buildLinkRow("Leaderboard", getSiteLink(ctx, "/leaderboard")),
          ],
        });

        return;
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle(`${team.name} | Team Results`)
        .setDescription(buildTeamResultsDescription(team))
        .setFooter({
          text:
            team.results.length > 8
              ? `8 of ${team.results.length} shown`
              : `${team.results.length} shown`,
        })
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildTwoLinkRow(
            {
              label: "Leaderboard",
              url: getTeamLeaderboardUrl(ctx, team),
            },
            {
              label: "Leaderboard",
              url: getSiteLink(ctx, "/leaderboard"),
            },
          ),
        ],
      });

      return;
    }

    const visibleTeams = profile.teams.slice(0, 8);

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle(`${profile.username} | Teams`)
      .setDescription(buildTeamsDescription(visibleTeams))
      .setFooter({
        text:
          profile.teams.length > visibleTeams.length
            ? `${visibleTeams.length} of ${profile.teams.length} shown`
            : `${visibleTeams.length} shown`,
      })
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Profile", getSiteLink(ctx, "/profile"))],
    });

    return;
  }

  if (commandName === "registrations") {
    await deferCommand(interaction);

    const targetUser = getTargetDiscordUser(interaction);
    const profile = await fetchPlayerProfile(ctx, targetUser.id);

    if (!profile) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Registrations not found")
        .setDescription("No Ascendra profile found.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Profile", getSiteLink(ctx, "/profile")),
        ],
      });

      return;
    }

    const visibleRegistrations = profile.registrations.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(`${profile.username} | Registrations`)
      .setDescription(buildRegistrationsDescription(profile))
      .setFooter({
        text:
          profile.registrations.length > visibleRegistrations.length
            ? `${visibleRegistrations.length} of ${profile.registrations.length} shown`
            : `${visibleRegistrations.length} shown`,
      })
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildTwoLinkRow(
          {
            label: "Profile",
            url: getSiteLink(ctx, "/profile"),
          },
          {
            label: "Tournaments",
            url: getSiteLink(ctx, "/tournaments"),
          },
        ),
      ],
    });

    return;
  }

  if (commandName === "announcements") {
    await deferCommand(interaction);

    const announcements = await fetchAnnouncements(ctx);
    const visibleAnnouncements = announcements.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle("Ascendra Announcements")
      .setDescription(buildAnnouncementsDescription(visibleAnnouncements))
      .setFooter({
        text:
          announcements.length > visibleAnnouncements.length
            ? `${visibleAnnouncements.length} of ${announcements.length} shown`
            : `${visibleAnnouncements.length} shown`,
      })
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildLinkRow("Announcements", getSiteLink(ctx, "/announcements")),
      ],
    });

    return;
  }

  if (commandName === "stats") {
    await deferCommand(interaction);

    const stats = await fetchStats(ctx);

    if (!stats) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Stats unavailable")
        .setDescription("Ascendra could not load stats.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [buildLinkRow("Stats", getSiteLink(ctx, "/stats"))],
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle("Ascendra Stats")
      .setDescription(buildStatsDescription(stats))
      .setTimestamp();

    const gameEmbed = new EmbedBuilder()
      .setColor(COLORS.deepPurple)
      .setTitle("Game Breakdown")
      .setDescription(buildGameStatsDescription(stats))
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed, gameEmbed],
      components: [buildLinkRow("Stats", getSiteLink(ctx, "/stats"))],
    });

    return;
  }

  if (commandName === "staff") {
    await deferCommand(interaction);

    const staff = await fetchStaff(ctx);
    const visibleStaff = staff.slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor(COLORS.deepPurple)
      .setTitle("Ascendra Staff")
      .setDescription(buildStaffDescription(visibleStaff))
      .setFooter({
        text:
          staff.length > visibleStaff.length
            ? `${visibleStaff.length} of ${staff.length} shown`
            : `${visibleStaff.length} shown`,
      })
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Staff", getSiteLink(ctx, "/staff"))],
    });

    return;
  }

  if (commandName === "rules") {
    await deferCommand(interaction);

    const rules = await fetchRules(ctx);
    const visibleRules = rules.slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor(COLORS.deepPurple)
      .setTitle("Ascendra Rules")
      .setDescription(buildRulesDescription(visibleRules))
      .setFooter({
        text:
          rules.length > visibleRules.length
            ? `${visibleRules.length} of ${rules.length} shown`
            : `${visibleRules.length} shown`,
      })
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Rules", getSiteLink(ctx, "/rules"))],
    });

    return;
  }

  if (commandName === "community") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle("Community")
      .setDescription("Open the Ascendra community.")
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildLinkRow("Community", getSiteLink(ctx, "/community")),
      ],
    });

    return;
  }

  if (commandName === "status") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle("Ascendra Status")
      .addFields(
        {
          name: "Bot",
          value: "Online",
          inline: true,
        },
        {
          name: "Uptime",
          value: formatUptime(ctx.uptimeMs),
          inline: true,
        },
        {
          name: "Latency",
          value: formatLatency(interaction),
          inline: true,
        },
        {
          name: "Guild",
          value: getGuildLabel(interaction),
          inline: true,
        },
        {
          name: "Commands",
          value: ctx.slashCommandsReady ? "Ready" : "Needs review",
          inline: true,
        },
      )
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
    });

    return;
  }

  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.deepPurple)
      .setTitle("Ascendra Commands")
      .addFields(
        {
          name: "Platform",
          value:
            "`/ascendra` Website\n`/about` Overview\n`/links` Links\n`/invite` Discord",
          inline: true,
        },
        {
          name: "Tournaments",
          value:
            "`/tournaments` List\n`/schedule` Schedule\n`/tournament` Details\n`/results` Results\n`/match` Match\n`/registrations` Registrations",
          inline: true,
        },
        {
          name: "Teams",
          value:
            "`/profile` Profile\n`/teams` Player teams\n`/team` Details\n`/roster` Roster\n`/teamresults` Results",
          inline: true,
        },
        {
          name: "Rankings",
          value: "`/leaderboard` Leaderboard\n`/games` Games\n`/stats` Stats",
          inline: true,
        },
        {
          name: "Community",
          value:
            "`/announcements` Announcements\n`/rules` Rules\n`/staff` Staff\n`/community` Community",
          inline: true,
        },
        {
          name: "Status",
          value: "`/ping` Response\n`/status` Bot status\n`/help` Commands",
          inline: true,
        },
      )
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Website", getSiteLink(ctx))],
    });
  }
}

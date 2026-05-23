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

const COLORS = {
  success: 0x10b981,
  error: 0xef4444,
  info: 0x8b5cf6,
  tournament: 0x7c3aed,
  premium: 0x6d28d9,
  deepPurple: 0x4c1d95,
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
    return "No tournaments available right now.";
  }

  return tournaments
    .slice(0, 5)
    .map((tournament, index) => {
      return [
        `**${index + 1}. ${tournament.title}**`,
        `${tournament.game} · ${formatTournamentStatus(tournament.status)}`,
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
        `${tournament.game} · ${formatTournamentStatus(tournament.status)}`,
        `Date: ${tournament.date || "-"}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildAnnouncementsDescription(announcements: PublicAnnouncement[]) {
  if (announcements.length === 0) {
    return "No announcements available right now.";
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
    return "No active rules available right now.";
  }

  return rules
    .slice(0, 10)
    .map((rule) => `**${rule.order}.** ${truncate(rule.text, 220)}`)
    .join("\n\n");
}

function buildStaffDescription(staff: PublicStaffMember[]) {
  if (staff.length === 0) {
    return "No staff members available right now.";
  }

  return staff
    .slice(0, 10)
    .map((member, index) => {
      return [
        `**${index + 1}. ${member.name}**`,
        `${member.role} · ${member.status}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildStatsDescription(stats: PublicStats) {
  if (stats.summary.length === 0) {
    return "No stats available right now.";
  }

  return stats.summary
    .slice(0, 8)
    .map((item) => `**${item.label}:** ${item.value}`)
    .join("\n");
}

function buildGameStatsDescription(stats: PublicStats) {
  if (stats.gameBreakdown.length === 0) {
    return "No game stats available right now.";
  }

  return stats.gameBreakdown
    .slice(0, 5)
    .map((item) => {
      return [
        `**${item.game}**`,
        `Tournaments: ${item.tournaments} · Results: ${item.results} · Points: ${item.points}`,
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

  rows.push(buildLinkRow("Open Tournaments", getSiteLink(ctx, "/tournaments")));

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

  return `${label} Leaderboard · ${game}`;
}

function buildLeaderboardDescription(
  entries: LeaderboardEntry[],
  type: LeaderboardType,
) {
  if (entries.length === 0) {
    return "No leaderboard results available right now.";
  }

  return entries
    .slice(0, 10)
    .map((entry) => {
      const name =
        type === "teams"
          ? entry.name || "Unknown team"
          : entry.username || "Unknown player";

      const details =
        type === "teams"
          ? `Leader: ${entry.leaderName || "-"} · Members: ${
              entry.membersCount ?? "-"
            }`
          : `Results: ${entry.tournamentResults}`;

      return [
        `**#${entry.rank} — ${name}**`,
        `${entry.tournamentPoints} pts · Best: ${formatPlacement(
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
    return "No teams found for this player.";
  }

  return teams
    .slice(0, 8)
    .map((team, index) => {
      return [
        `**${index + 1}. ${team.name}**`,
        `${team.game} · ${formatTeamStatus(team.status)} · ${team.role}`,
        `Members: ${team.membersCount} · Points: ${team.tournamentPoints} · Best: ${formatPlacement(
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
        `${registration.tournamentGame} · ${formatTournamentStatus(
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
    `Approved: **${summary.approved}** · Pending: **${summary.pending}** · Total: **${summary.total}**`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTournamentTeamsDescription(tournament: BotTournamentDetails) {
  if (tournament.teams.length === 0) {
    return "No registered teams found.";
  }

  return tournament.teams
    .slice(0, 8)
    .map((team, index) => {
      return [
        `**${index + 1}. ${team.name}**`,
        `Leader: ${team.leaderName} · Members: ${team.membersCount}`,
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
      return `**#${result.placement} — ${result.teamName}**\n${result.points} pts`;
    })
    .join("\n\n");
}

function getTargetDiscordUser(interaction: any) {
  return interaction.options?.getUser("user") || interaction.user;
}

async function replyToCommand(interaction: any, payload: any) {
  if (interaction.deferred || interaction.replied) {
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
      description: "Open AscendraHub.",
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
          description: "Tournament title, game, or ID.",
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
      description: "Open the Ascendra community page.",
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
      .setTitle("AscendraHub")
      .setDescription("Open the AscendraHub website.")
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Open AscendraHub", getSiteLink(ctx))],
    });

    return;
  }

  if (commandName === "tournaments") {
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
      .setTitle(titleParts.join(" · "))
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
          : `Ascendra Schedule · ${selectedGame}`,
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
    const query = String(interaction.options?.getString("query") || "").trim();
    const tournaments = await fetchTournamentLookup(ctx, query);
    const tournament = tournaments[0];

    if (!tournament) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Tournament not found")
        .setDescription("No tournament matched your search.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Open Tournaments", getSiteLink(ctx, "/tournaments")),
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
            ? `Showing best match · ${tournaments.length} matches found`
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
            label: "Open Tournament",
            url: getSiteLink(ctx, `/tournaments/${tournament.id}`),
          },
          tournament.discordAnnouncementUrl &&
            isValidHttpUrl(tournament.discordAnnouncementUrl)
            ? {
                label: "Discord Message",
                url: tournament.discordAnnouncementUrl,
              }
            : undefined,
        ),
      ],
    });

    return;
  }

  if (commandName === "results") {
    const query = String(interaction.options?.getString("query") || "").trim();
    const tournaments = await fetchTournamentLookup(ctx, query);
    const tournament = tournaments[0];

    if (!tournament) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Tournament not found")
        .setDescription("No tournament matched your search.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Open Tournaments", getSiteLink(ctx, "/tournaments")),
        ],
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(`${tournament.title} · Results`)
      .setDescription(buildTournamentResultsDescription(tournament))
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildLinkRow(
          "Open Tournament",
          getSiteLink(ctx, `/tournaments/${tournament.id}`),
        ),
      ],
    });

    return;
  }

  if (commandName === "leaderboard") {
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
      components: [buildLinkRow("Open Leaderboard", leaderboardUrl.toString())],
    });

    return;
  }

  if (commandName === "profile") {
    const targetUser = getTargetDiscordUser(interaction);
    const profile = await fetchPlayerProfile(ctx, targetUser.id);

    if (!profile) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Profile not found")
        .setDescription("This Discord user does not have an Ascendra profile.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Open Profile", getSiteLink(ctx, "/profile")),
        ],
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle(`${profile.username} · Ascendra Profile`)
      .setDescription(buildProfileDescription(profile))
      .setTimestamp();

    if (profile.avatar && isValidHttpUrl(profile.avatar)) {
      embed.setThumbnail(profile.avatar);
    }

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Open Profile", getSiteLink(ctx, "/profile"))],
    });

    return;
  }

  if (commandName === "teams") {
    const targetUser = getTargetDiscordUser(interaction);
    const profile = await fetchPlayerProfile(ctx, targetUser.id);

    if (!profile) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Teams not found")
        .setDescription("This Discord user does not have an Ascendra profile.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Open Profile", getSiteLink(ctx, "/profile")),
        ],
      });

      return;
    }

    const visibleTeams = profile.teams.slice(0, 8);

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle(`${profile.username} · Teams`)
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
      components: [buildLinkRow("Open Profile", getSiteLink(ctx, "/profile"))],
    });

    return;
  }

  if (commandName === "registrations") {
    const targetUser = getTargetDiscordUser(interaction);
    const profile = await fetchPlayerProfile(ctx, targetUser.id);

    if (!profile) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Registrations not found")
        .setDescription("This Discord user does not have an Ascendra profile.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [
          buildLinkRow("Open Profile", getSiteLink(ctx, "/profile")),
        ],
      });

      return;
    }

    const visibleRegistrations = profile.registrations.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(`${profile.username} · Registrations`)
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
            label: "Open Profile",
            url: getSiteLink(ctx, "/profile"),
          },
          {
            label: "Open Tournaments",
            url: getSiteLink(ctx, "/tournaments"),
          },
        ),
      ],
    });

    return;
  }

  if (commandName === "announcements") {
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
        buildLinkRow("Open Announcements", getSiteLink(ctx, "/announcements")),
      ],
    });

    return;
  }

  if (commandName === "stats") {
    const stats = await fetchStats(ctx);

    if (!stats) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle("Stats unavailable")
        .setDescription("Ascendra stats are not available right now.")
        .setTimestamp();

      await replyToCommand(interaction, {
        embeds: [embed],
        components: [buildLinkRow("Open Stats", getSiteLink(ctx, "/stats"))],
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
      components: [buildLinkRow("Open Stats", getSiteLink(ctx, "/stats"))],
    });

    return;
  }

  if (commandName === "staff") {
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
      components: [buildLinkRow("Open Staff", getSiteLink(ctx, "/staff"))],
    });

    return;
  }

  if (commandName === "rules") {
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
      components: [buildLinkRow("Open Rules", getSiteLink(ctx, "/rules"))],
    });

    return;
  }

  if (commandName === "community") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle("Community")
      .setDescription("Open the Ascendra community page.")
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildLinkRow("Open Community", getSiteLink(ctx, "/community")),
      ],
    });

    return;
  }

  if (commandName === "status") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle("Bot status")
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
        {
          name: "Slash commands",
          value: ctx.slashCommandsReady ? "Ready" : "Check required",
          inline: true,
        },
      )
      .setTimestamp();

    if (!ctx.slashCommandsReady && ctx.slashCommandError) {
      embed.setDescription(ctx.slashCommandError.slice(0, 500));
    }

    await replyToCommand(interaction, {
      embeds: [embed],
    });

    return;
  }

  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.deepPurple)
      .setTitle("Ascendra Bot")
      .setDescription(
        [
          "`/ascendra` — Website",
          "`/tournaments` — Tournament list",
          "`/schedule` — Upcoming tournaments",
          "`/tournament` — Tournament details",
          "`/results` — Tournament results",
          "`/leaderboard` — Leaderboard",
          "`/profile` — Player profile",
          "`/teams` — Player teams",
          "`/registrations` — Tournament registrations",
          "`/announcements` — Announcements",
          "`/stats` — Community stats",
          "`/staff` — Staff",
          "`/rules` — Rules",
          "`/community` — Community",
          "`/status` — Bot status",
          "`/help` — Commands",
        ].join("\n"),
      )
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Open AscendraHub", getSiteLink(ctx))],
    });
  }
}

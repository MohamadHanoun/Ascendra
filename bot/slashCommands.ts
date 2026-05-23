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

const COLORS = {
  success: 0x10b981,
  error: 0xef4444,
  info: 0x8b5cf6,
  tournament: 0x7c3aed,
  premium: 0x6d28d9,
  deepPurple: 0x4c1d95,
};

const leaderboardGames = [
  "Overall",
  "Valorant",
  "League of Legends",
  "CS2",
  "Dota2",
];

function getSiteLink(ctx: SlashCommandContext, path = "") {
  if (!path) {
    return ctx.siteUrl;
  }

  return `${ctx.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
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

function normalizeLeaderboardType(value: string | null): LeaderboardType {
  return value === "teams" ? "teams" : "players";
}

function normalizeGame(value: string | null) {
  if (value && leaderboardGames.includes(value)) {
    return value;
  }

  return "Overall";
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

function filterTournamentsByGame(
  tournaments: PublicTournament[],
  selectedGame: string,
) {
  if (selectedGame === "Overall") {
    return tournaments;
  }

  return tournaments.filter(
    (tournament) =>
      String(tournament.game || "").toLowerCase() ===
      selectedGame.toLowerCase(),
  );
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
          .setLabel(tournament.title.slice(0, 80))
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

function formatPlacement(value: number | null) {
  if (!value) {
    return "-";
  }

  return `#${value}`;
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
          choices: leaderboardGames.map((game) => ({
            name: game,
            value: game,
          })),
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
            {
              name: "Players",
              value: "players",
            },
            {
              name: "Teams",
              value: "teams",
            },
          ],
        },
        {
          name: "game",
          description: "Game filter.",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: leaderboardGames.map((game) => ({
            name: game,
            value: game,
          })),
        },
      ],
    },
    {
      name: "rules",
      description: "Open Ascendra rules.",
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

    const tournaments = filterTournamentsByGame(
      await fetchPublicTournaments(ctx),
      selectedGame,
    );

    const visibleTournaments = tournaments.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle(
        selectedGame === "Overall"
          ? "Ascendra Tournaments"
          : `Ascendra Tournaments · ${selectedGame}`,
      )
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

  if (commandName === "rules") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.deepPurple)
      .setTitle("Rules")
      .setDescription("Open Ascendra rules.")
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
          "`/tournaments` — Tournaments",
          "`/leaderboard` — Leaderboard",
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

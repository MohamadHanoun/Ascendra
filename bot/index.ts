import { loadEnvConfig } from "@next/env";
import {
  ActionRowBuilder,
  ActivityType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  type Message,
} from "discord.js";
import {
  getSlashCommands as getEnhancedSlashCommands,
  handleSlashCommand as handleEnhancedSlashCommand,
} from "./slashCommands";
import { handleAutocompleteInteraction } from "./autocomplete";

loadEnvConfig(process.cwd());

const SITE_URL = (
  process.env.BOT_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const DISCORD_INVITE_URL = (
  process.env.BOT_DISCORD_INVITE_URL ||
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ||
  ""
).trim();

const BOT_API_TOKEN = process.env.BOT_API_TOKEN;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const APPLICATION_ID =
  process.env.DISCORD_CLIENT_ID ||
  process.env.DISCORD_APPLICATION_ID ||
  process.env.AUTH_DISCORD_ID ||
  "";

const CONFIG_CACHE_MS = 30000;
const HEARTBEAT_INTERVAL_MS = 30000;
const POLL_INTERVAL_MS = 5000;
const API_TIMEOUT_MS = Number(process.env.BOT_API_TIMEOUT_MS || 8000);
const EVENT_TIMEOUT_MS = Number(process.env.BOT_EVENT_TIMEOUT_MS || 25000);
const PAUSED_LOG_INTERVAL_MS = 60000;
const ENABLE_PRESENCE_STATS =
  process.env.DISCORD_ENABLE_PRESENCE_STATS === "true";
const TEAM_CAPTAIN_ROLE_ID =
  process.env.DISCORD_TEAM_CAPTAIN_ROLE_ID || "1506789979190460446";

const COLORS = {
  brand: 0xb88746,
  secondary: 0x6f5431,
  success: 0x2f855a,
  error: 0xb23a48,
  warning: 0xb7791f,
  info: 0xb88746,
  tournament: 0xb88746,
  premium: 0xb88746,
  deepPurple: 0x6f5431,
  blue: 0xb88746,
  ended: 0x64748b,
};

const BRAND_LOGO_URL = `${SITE_URL}/images/brand/ascendra-logo-mark.png`;
const BRAND_FOOTER_TEXT = "Ascendra - Rise Beyond Limits";

if (!BOT_API_TOKEN) {
  throw new Error("Missing BOT_API_TOKEN");
}

if (!DISCORD_BOT_TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN");
}

const clientIntents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers];

if (ENABLE_PRESENCE_STATS) {
  clientIntents.push(GatewayIntentBits.GuildPresences);
}

const client = new Client({
  intents: clientIntents,
});

type DiscordMessage = Message<boolean>;

type BotRuntimeConfig = {
  announcementChannelId: string;
  tournamentCategoryId: string;
  tournamentStaffRoleIds: string[];
  botLogChannelId: string;
  tournamentLogChannelId: string;
  errorLogChannelId: string;
  adminActionsLogChannelId: string;
  inviteChannelId: string;
  enableAnnouncements: boolean;
  enableDiscordAccess: boolean;
};

type BotEvent = {
  id: string;
  type: string;
  attempts?: number;
  payload: Record<string, any>;
};

type LogField = {
  name: string;
  value: string;
  inline?: boolean;
};

type MemberRoleFailure = {
  discordId: string;
  reason: string;
};

type RegistrationPresentation = {
  label: string;
  badge: string;
  color: number;
  footerStatus: string;
};

type TournamentStatusPresentation = {
  label: string;
  badge: string;
};

type TournamentAnnouncementResult = {
  channelId: string;
  messageId: string;
  messageUrl: string;
  mode: "created" | "edited";
};

let botConfigCache: {
  value: BotRuntimeConfig;
  expiresAt: number;
} | null = null;

let heartbeatInterval: NodeJS.Timeout | null = null;
let pollingInterval: NodeJS.Timeout | null = null;
let isPolling = false;
let isShuttingDown = false;
let lastPausedLogAt = 0;
let lastQueuePausedState: boolean | null = null;
let slashCommandsReady = false;
let slashCommandError = "";

function parseRoleIds(value: string | undefined | null) {
  return String(value || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return fallback;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown bot operation error";
}

function cleanLogValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value).slice(0, 900);
}

function pickFirstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const normalized = String(value).trim();

    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function isValidHttpUrl(value: unknown) {
  const raw = pickFirstNonEmpty(value);

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

function getAbsoluteUrl(value: unknown) {
  const raw = pickFirstNonEmpty(value);

  if (!raw) {
    return "";
  }

  if (isValidHttpUrl(raw)) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `${SITE_URL}${raw}`;
  }

  return "";
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    task.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function parseFlexibleDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const raw = String(value).trim();
  const direct = new Date(raw);

  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (match) {
    const [, day, month, year] = match;

    const parsed = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), 18, 0, 0),
    );

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function formatTournamentDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const raw = String(value).trim();
  const parsed = parseFlexibleDate(raw);

  if (!parsed) {
    return raw;
  }

  const unix = Math.floor(parsed.getTime() / 1000);

  return `<t:${unix}:F>\n<t:${unix}:R>`;
}

function formatTeamSize(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const count = Number(value);

  if (Number.isFinite(count)) {
    return `${count} player${count === 1 ? "" : "s"}`;
  }

  return String(value);
}

function formatSlots(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const count = Number(value);

  if (Number.isFinite(count)) {
    return `${count} team${count === 1 ? "" : "s"}`;
  }

  return String(value);
}

function formatPrize(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "To be announced";
  }

  return String(value);
}

function getRegistrationPresentation(value: unknown): RegistrationPresentation {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "open":
      return {
        label: "Open",
        badge: "REGISTRATION OPEN",
        color: COLORS.success,
        footerStatus: "Registration Open",
      };

    case "upcoming":
      return {
        label: "Upcoming",
        badge: "REGISTRATION UPCOMING",
        color: COLORS.premium,
        footerStatus: "Registration Coming Soon",
      };

    case "closed":
      return {
        label: "Closed",
        badge: "REGISTRATION CLOSED",
        color: COLORS.error,
        footerStatus: "Registration Closed",
      };

    default:
      return {
        label: cleanLogValue(value),
        badge: "TOURNAMENT UPDATE",
        color: COLORS.premium,
        footerStatus: "Tournament Update",
      };
  }
}

function getTournamentStatusPresentation(
  value: unknown,
): TournamentStatusPresentation {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "open":
      return {
        label: "Live",
        badge: "LIVE",
      };

    case "upcoming":
      return {
        label: "Upcoming",
        badge: "UPCOMING",
      };

    case "closed":
      return {
        label: "Closed",
        badge: "CLOSED",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        badge: "CANCELLED",
      };

    case "ended":
      return {
        label: "Ended",
        badge: "ENDED",
      };

    default:
      return {
        label: cleanLogValue(value),
        badge: "TOURNAMENT",
      };
  }
}

function buildTournamentDescription(payload: Record<string, any>) {
  const description = pickFirstNonEmpty(
    payload.shortDescription,
    payload.description,
    payload.summary,
  );

  if (description) {
    return description.slice(0, 1200);
  }

  return "Ascendra tournament details are listed below.";
}

function buildTournamentButtons(tournamentUrl: string) {
  const row = new ActionRowBuilder<ButtonBuilder>();

  const safeTournamentUrl = isValidHttpUrl(tournamentUrl)
    ? tournamentUrl
    : SITE_URL;

  row.addComponents(
    new ButtonBuilder()
      .setLabel("Tournament")
      .setStyle(ButtonStyle.Link)
      .setURL(safeTournamentUrl),
  );

  if (isValidHttpUrl(DISCORD_INVITE_URL)) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Discord")
        .setStyle(ButtonStyle.Link)
        .setURL(DISCORD_INVITE_URL),
    );
  }

  return row;
}

function buildTournamentAnnouncementContent(payload: Record<string, any>) {
  const tournamentUrl = pickFirstNonEmpty(payload.websiteUrl, SITE_URL);
  const title = pickFirstNonEmpty(payload.title, "Ascendra Tournament");
  const game = cleanLogValue(payload.game);
  const date = formatTournamentDate(payload.date);
  const teamSize = formatTeamSize(payload.teamSize);
  const slots = formatSlots(payload.maxSlots);
  const prize = formatPrize(payload.prize);
  const description = buildTournamentDescription(payload);
  const registration = getRegistrationPresentation(payload.registrationStatus);
  const tournamentStatus = getTournamentStatusPresentation(payload.status);

  const heroImageUrl = getAbsoluteUrl(
    pickFirstNonEmpty(
      payload.bannerImageUrl,
      payload.coverImageUrl,
      payload.imageUrl,
      payload.thumbnailUrl,
    ),
  );

  const mainEmbed = new EmbedBuilder()
    .setColor(registration.color)
    .setAuthor({
      name: "Ascendra Tournaments",
      iconURL: BRAND_LOGO_URL,
      url: SITE_URL,
    })
    .setTitle(title)
    .setURL(isValidHttpUrl(tournamentUrl) ? tournamentUrl : SITE_URL)
    .setDescription(
      [
        `${registration.badge} | ${tournamentStatus.badge}`,
        "",
        description,
      ].join("\n"),
    )
    .setThumbnail(BRAND_LOGO_URL)
    .addFields(
      {
        name: "Game",
        value: `**${game}**`,
        inline: true,
      },
      {
        name: "Team size",
        value: `**${teamSize}**`,
        inline: true,
      },
      {
        name: "Slots",
        value: `**${slots}**`,
        inline: true,
      },
      {
        name: "Date",
        value: date,
        inline: false,
      },
      {
        name: "Prize",
        value: `**${prize}**`,
        inline: true,
      },
      {
        name: "Registration",
        value: `**${registration.label}**`,
        inline: true,
      },
      {
        name: "Status",
        value: `**${tournamentStatus.label}**`,
        inline: true,
      },
    )
    .setFooter({
      text: `${BRAND_FOOTER_TEXT} | ${registration.footerStatus}`,
      iconURL: BRAND_LOGO_URL,
    })
    .setTimestamp();

  if (heroImageUrl) {
    mainEmbed.setImage(heroImageUrl);
  }

  const detailsEmbed = new EmbedBuilder()
    .setColor(COLORS.deepPurple)
    .setDescription(
      [
        "**Tournament Brief**",
        "- Team-based competition",
        "- Official Ascendra tracking",
        "- Registration through Ascendra",
        "- Rules, slots, and status on the tournament page",
      ].join("\n"),
    );

  return {
    embeds: [mainEmbed, detailsEmbed],
    components: [buildTournamentButtons(tournamentUrl)],
  };
}

function getEnvBotConfig(): BotRuntimeConfig {
  return {
    announcementChannelId: process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID || "",
    tournamentCategoryId: process.env.DISCORD_TOURNAMENT_CATEGORY_ID || "",
    tournamentStaffRoleIds: parseRoleIds(
      process.env.DISCORD_TOURNAMENT_STAFF_ROLE_IDS,
    ),
    botLogChannelId: process.env.DISCORD_BOT_LOG_CHANNEL_ID || "",
    tournamentLogChannelId: process.env.DISCORD_TOURNAMENT_LOG_CHANNEL_ID || "",
    errorLogChannelId: "",
    adminActionsLogChannelId: "",
    inviteChannelId:
      process.env.DISCORD_INVITE_CHANNEL_ID ||
      process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID ||
      "",
    enableAnnouncements: true,
    enableDiscordAccess: true,
  };
}

async function getBotConfig(force = false): Promise<BotRuntimeConfig> {
  if (!force && botConfigCache && botConfigCache.expiresAt > Date.now()) {
    return botConfigCache.value;
  }

  const fallback = getEnvBotConfig();

  try {
    const response = await fetchWithTimeout(`${SITE_URL}/api/bot/config`, {
      headers: {
        Authorization: `Bearer ${BOT_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Config ${response.status}`);
    }

    const data = await response.json();
    const config = data.config || {};

    const runtimeConfig: BotRuntimeConfig = {
      announcementChannelId:
        String(config.announcementChannelId || "") ||
        fallback.announcementChannelId,

      tournamentCategoryId:
        String(config.tournamentCategoryId || "") ||
        fallback.tournamentCategoryId,

      tournamentStaffRoleIds:
        parseRoleIds(config.tournamentStaffRoleIds).length > 0
          ? parseRoleIds(config.tournamentStaffRoleIds)
          : fallback.tournamentStaffRoleIds,

      botLogChannelId:
        String(config.botLogChannelId || "") || fallback.botLogChannelId,

      tournamentLogChannelId:
        String(config.tournamentLogChannelId || "") ||
        fallback.tournamentLogChannelId,

      errorLogChannelId:
        String(config.errorLogChannelId || "") || fallback.errorLogChannelId,

      adminActionsLogChannelId:
        String(config.adminActionsLogChannelId || "") ||
        fallback.adminActionsLogChannelId,

      inviteChannelId:
        String(config.inviteChannelId || "") || fallback.inviteChannelId,

      enableAnnouncements: parseBoolean(
        config.enableAnnouncements,
        fallback.enableAnnouncements,
      ),

      enableDiscordAccess: parseBoolean(
        config.enableDiscordAccess,
        fallback.enableDiscordAccess,
      ),
    };

    botConfigCache = {
      value: runtimeConfig,
      expiresAt: Date.now() + CONFIG_CACHE_MS,
    };

    return runtimeConfig;
  } catch (error) {
    console.error("[BotConfig] Using env fallback:", error);

    botConfigCache = {
      value: fallback,
      expiresAt: Date.now() + CONFIG_CACHE_MS,
    };

    return fallback;
  }
}

async function sendDiscordLog(params: {
  channelId?: string;
  title: string;
  description?: string;
  fields?: LogField[];
  color?: number;
}) {
  if (!params.channelId) {
    return;
  }

  try {
    const channel = await withTimeout(
      client.channels.fetch(params.channelId),
      API_TIMEOUT_MS,
      "Log channel timeout.",
    );

    if (!channel || !channel.isSendable()) {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(params.color || COLORS.info)
      .setTitle(params.title)
      .setDescription(params.description || null)
      .setTimestamp()
      .setFooter({
        text: "Ascendra Bot",
      });

    if (params.fields?.length) {
      embed.addFields(
        params.fields.map((field) => ({
          name: field.name,
          value: cleanLogValue(field.value),
          inline: field.inline ?? true,
        })),
      );
    }

    await withTimeout<DiscordMessage>(
      channel.send({
        embeds: [embed],
      }) as unknown as Promise<DiscordMessage>,
      API_TIMEOUT_MS,
      "Log send timeout.",
    );
  } catch (error) {
    console.error("[DiscordLog] Failed:", error);
  }
}

async function sendBotLog(params: {
  title: string;
  description?: string;
  fields?: LogField[];
  color?: number;
}) {
  const config = await getBotConfig();

  await sendDiscordLog({
    ...params,
    channelId: config.botLogChannelId,
    color: params.color || COLORS.info,
  });
}

async function sendBotErrorLog(params: {
  title: string;
  description?: string;
  fields?: LogField[];
  color?: number;
}) {
  const config = await getBotConfig();

  await sendDiscordLog({
    ...params,
    channelId: config.errorLogChannelId || config.botLogChannelId,
    color: params.color || COLORS.error,
  });
}

async function sendAdminActionLog(params: {
  title: string;
  description?: string;
  fields?: LogField[];
  color?: number;
}) {
  const config = await getBotConfig();

  await sendDiscordLog({
    ...params,
    channelId: config.adminActionsLogChannelId || config.botLogChannelId,
    color: params.color || COLORS.warning,
  });
}

async function sendTournamentLog(params: {
  title: string;
  description?: string;
  fields?: LogField[];
  color?: number;
}) {
  const config = await getBotConfig();

  await sendDiscordLog({
    ...params,
    channelId: config.tournamentLogChannelId || config.botLogChannelId,
    color: params.color || COLORS.tournament,
  });
}

function isAdminActionEvent(type: string) {
  return [
    "bot_command_restart",
    "bot_command_refresh_config",
    "bot_command_send_message",
    "tournament_announcement_recreate",
    "tournament_announcement_delete",
  ].includes(type);
}

const publicDiscordRoleDefinitions = [
  {
    key: "owner",
    label: "Owner",
    roleId: "1506789791365333162",
    group: "staff",
  },
  {
    key: "admin",
    label: "Admin",
    roleId: "1506789830514835517",
    group: "staff",
  },
  {
    key: "moderator",
    label: "Moderator",
    roleId: "1506789859606532116",
    group: "staff",
  },
  {
    key: "tournamentStaff",
    label: "Tournament Staff",
    roleId: "1506789882255900772",
    group: "staff",
  },
  {
    key: "player",
    label: "Player",
    roleId: "1506789948379107429",
    group: "community",
  },
  {
    key: "teamCaptain",
    label: "Team Captain",
    roleId: TEAM_CAPTAIN_ROLE_ID,
    group: "community",
  },
] as const;

const slashOptionTypeLabels: Record<number, string> = {
  1: "subcommand",
  2: "subcommand_group",
  3: "string",
  4: "integer",
  5: "boolean",
  6: "user",
  7: "channel",
  8: "role",
  9: "mentionable",
  10: "number",
  11: "attachment",
};

function getSlashOptionTypeLabel(value: unknown) {
  if (typeof value === "number") {
    return slashOptionTypeLabels[value] || "option";
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "option";
}

function getPublicSlashCommands() {
  return getEnhancedSlashCommands()
    .map((command) => {
      const record = command as Record<string, any>;
      const name = String(record.name || "").trim();
      const description = String(record.description || "").trim();

      if (!name || !description) {
        return null;
      }

      const options = Array.isArray(record.options)
        ? record.options
            .map((option: Record<string, any>) => {
              const optionName = String(option?.name || "").trim();

              if (!optionName) {
                return null;
              }

              return {
                name: optionName,
                description: String(option.description || "").trim(),
                required: option.required === true,
                type: getSlashOptionTypeLabel(option.type),
              };
            })
            .filter(Boolean)
        : [];

      return {
        name,
        description,
        options,
      };
    })
    .filter(Boolean);
}

async function collectDiscordRoleCounts() {
  const guild = await getGuild();
  const roles = await withTimeout(
    guild.roles.fetch(),
    API_TIMEOUT_MS,
    "Roles fetch timeout.",
  );
  const members = await withTimeout(
    guild.members.fetch(),
    API_TIMEOUT_MS,
    "Members fetch timeout.",
  );

  return publicDiscordRoleDefinitions.map((roleDefinition) => {
    const role = roles.get(roleDefinition.roleId);
    const count = role
      ? members.filter((member) =>
          member.roles.cache.has(roleDefinition.roleId),
        ).size
      : 0;

    return {
      key: roleDefinition.key,
      label: roleDefinition.label,
      roleId: roleDefinition.roleId,
      group: roleDefinition.group,
      count,
    };
  });
}

async function collectDiscordPresenceCount(guild: Awaited<ReturnType<typeof getGuild>>) {
  const guildWithCounts = guild as typeof guild & {
    approximatePresenceCount?: number | null;
  };

  if (
    typeof guildWithCounts.approximatePresenceCount === "number" &&
    Number.isFinite(guildWithCounts.approximatePresenceCount)
  ) {
    return Math.max(0, Math.floor(guildWithCounts.approximatePresenceCount));
  }

  if (!ENABLE_PRESENCE_STATS) {
    return null;
  }

  try {
    await withTimeout(
      guild.members.fetch({ withPresences: true }),
      API_TIMEOUT_MS,
      "Presence fetch timeout.",
    );

    const visibleStatuses = new Set(["online", "idle", "dnd"]);

    return guild.presences.cache.filter((presence) =>
      visibleStatuses.has(presence.status),
    ).size;
  } catch (error) {
    console.warn("[Heartbeat] Presence stats unavailable:", getErrorMessage(error));
    return null;
  }
}

async function collectDiscordStats() {
  const guild = await withTimeout(
    client.guilds.fetch({ guild: GUILD_ID, withCounts: true } as any),
    API_TIMEOUT_MS,
    "Guild stats fetch timeout.",
  );
  const guildWithCounts = guild as typeof guild & {
    approximateMemberCount?: number | null;
  };
  const memberCount =
    typeof guildWithCounts.approximateMemberCount === "number"
      ? guildWithCounts.approximateMemberCount
      : guild.memberCount;
  const onlineCount = await collectDiscordPresenceCount(guild);
  const roleCounts = await collectDiscordRoleCounts().catch((error) => {
    console.warn("[Heartbeat] Role counts unavailable:", getErrorMessage(error));
    return [];
  });

  return {
    memberCount:
      typeof memberCount === "number" && Number.isFinite(memberCount)
        ? Math.max(0, Math.floor(memberCount))
        : null,
    onlineCount,
    roleCounts,
    slashCommands: getPublicSlashCommands(),
    lastSyncedAt: new Date().toISOString(),
  };
}

async function sendHeartbeat() {
  if (isShuttingDown) {
    return;
  }

  try {
    const discord = await collectDiscordStats().catch((error) => {
      console.warn("[Heartbeat] Discord stats sync skipped:", getErrorMessage(error));
      return null;
    });

    const response = await fetchWithTimeout(
      `${SITE_URL}/api/bot/heartbeat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BOT_API_TOKEN}`,
        },
        body: JSON.stringify({
          botTag: client.user?.tag || "Unknown",
          guildId: GUILD_ID,
          uptimeMs: Math.floor(process.uptime() * 1000),
          discord,
        }),
      },
      API_TIMEOUT_MS,
    );

    if (!response.ok) {
      throw new Error(`Heartbeat ${response.status}`);
    }
  } catch (error) {
    console.error("[Heartbeat] Failed:", error);
  }
}

async function fetchPendingEvents() {
  const response = await fetchWithTimeout(
    `${SITE_URL}/api/bot/events/pending`,
    {
      headers: {
        Authorization: `Bearer ${BOT_API_TOKEN}`,
      },
    },
    API_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`Events ${response.status}`);
  }

  return response.json();
}

async function updateEvent(
  eventId: string,
  data: {
    status: "completed" | "failed";
    result?: unknown;
    error?: string;
  },
) {
  const response = await fetchWithTimeout(
    `${SITE_URL}/api/bot/events/update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_API_TOKEN}`,
      },
      body: JSON.stringify({
        eventId,
        ...data,
      }),
    },
    API_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`Update event ${response.status}`);
  }
}

async function safeUpdateEvent(
  eventId: string,
  data: {
    status: "completed" | "failed";
    result?: unknown;
    error?: string;
  },
) {
  try {
    await updateEvent(eventId, data);
  } catch (error) {
    console.error(`[BotEvent] Failed to update ${eventId}:`, error);
  }
}

async function getAnnouncementChannel(channelId: string) {
  const channel = await withTimeout(
    client.channels.fetch(channelId),
    API_TIMEOUT_MS,
    "Announcement channel timeout.",
  );

  if (!channel || !channel.isSendable()) {
    throw new Error("Announcement channel unavailable.");
  }

  return channel;
}

async function fetchAnnouncementMessage(params: {
  channelId?: string | null;
  messageId?: string | null;
}): Promise<DiscordMessage | null> {
  if (!params.channelId || !params.messageId) {
    return null;
  }

  const channel = await withTimeout(
    client.channels.fetch(params.channelId).catch(() => null),
    API_TIMEOUT_MS,
    "Message channel timeout.",
  );

  if (!channel || !channel.isTextBased()) {
    return null;
  }

  const messages = (channel as any).messages;

  if (!messages?.fetch) {
    return null;
  }

  const message = await withTimeout<DiscordMessage | null>(
    (messages.fetch(params.messageId) as unknown as Promise<DiscordMessage>)
      .then((message) => message)
      .catch(() => null),
    API_TIMEOUT_MS,
    "Message fetch timeout.",
  );

  return message;
}

async function upsertTournamentAnnouncementMessage(
  event: BotEvent,
): Promise<TournamentAnnouncementResult> {
  const config = await getBotConfig();

  if (!config.enableAnnouncements) {
    throw new Error("Announcements disabled.");
  }

  const payload = event.payload;
  const existingChannelId = pickFirstNonEmpty(
    payload.announcementChannelId,
    payload.discordAnnouncementChannelId,
  );
  const existingMessageId = pickFirstNonEmpty(
    payload.announcementMessageId,
    payload.discordAnnouncementMessageId,
  );

  const targetChannelId = existingChannelId || config.announcementChannelId;

  if (!targetChannelId) {
    throw new Error("Missing announcement channel.");
  }

  const content = buildTournamentAnnouncementContent(payload);
  const existingMessage = await fetchAnnouncementMessage({
    channelId: existingChannelId,
    messageId: existingMessageId,
  });

  if (existingMessage) {
    const editedMessage = await withTimeout<DiscordMessage>(
      existingMessage.edit(content) as unknown as Promise<DiscordMessage>,
      API_TIMEOUT_MS,
      "Announcement edit timeout.",
    );

    await sendTournamentLog({
      title: "Tournament announcement edited",
      fields: [
        { name: "Tournament", value: cleanLogValue(payload.title) },
        { name: "Game", value: cleanLogValue(payload.game) },
        { name: "Message", value: editedMessage.url, inline: false },
        { name: "Event ID", value: event.id, inline: false },
      ],
      color: COLORS.success,
    });

    return {
      channelId: editedMessage.channelId,
      messageId: editedMessage.id,
      messageUrl: editedMessage.url,
      mode: "edited",
    };
  }

  const channel = await getAnnouncementChannel(targetChannelId);

  const sentMessage = await withTimeout<DiscordMessage>(
    channel.send(content) as unknown as Promise<DiscordMessage>,
    API_TIMEOUT_MS,
    "Announcement send timeout.",
  );

  await sendTournamentLog({
    title:
      event.type === "tournament_announcement_update"
        ? "Tournament announcement recreated"
        : "Tournament announcement sent",
    fields: [
      { name: "Tournament", value: cleanLogValue(payload.title) },
      { name: "Game", value: cleanLogValue(payload.game) },
      { name: "Message", value: sentMessage.url, inline: false },
      { name: "Event ID", value: event.id, inline: false },
    ],
    color: COLORS.success,
  });

  return {
    channelId: sentMessage.channelId,
    messageId: sentMessage.id,
    messageUrl: sentMessage.url,
    mode: "created",
  };
}

async function getGuild() {
  if (!GUILD_ID) {
    throw new Error("Missing DISCORD_GUILD_ID");
  }

  return withTimeout(
    client.guilds.fetch(GUILD_ID),
    API_TIMEOUT_MS,
    "Guild fetch timeout.",
  );
}

async function findOrCreateRole(roleName: string) {
  const guild = await getGuild();

  const roles = await withTimeout(
    guild.roles.fetch(),
    API_TIMEOUT_MS,
    "Roles fetch timeout.",
  );

  const existingRole = roles.find((role) => role.name === roleName);

  if (existingRole) {
    return {
      role: existingRole,
      created: false,
    };
  }

  const role = await withTimeout(
    guild.roles.create({
      name: roleName,
      mentionable: false,
      hoist: false,
      reason: "Tournament team access",
    }),
    API_TIMEOUT_MS,
    "Role create timeout.",
  );

  return {
    role,
    created: true,
  };
}

async function findOrCreateTeamChannel(params: {
  channelName: string;
  roleId: string;
}) {
  const config = await getBotConfig();

  if (!config.tournamentCategoryId) {
    throw new Error("Missing tournament category.");
  }

  const guild = await getGuild();

  const channels = await withTimeout(
    guild.channels.fetch(),
    API_TIMEOUT_MS,
    "Channels fetch timeout.",
  );

  const existingChannel = channels.find((channel) => {
    if (!channel) {
      return false;
    }

    return (
      channel.name === params.channelName &&
      channel.type === ChannelType.GuildVoice
    );
  });

  if (existingChannel) {
    return {
      channel: existingChannel as any,
      created: false,
    };
  }

  const permissionOverwrites: any[] = [
    {
      id: guild.roles.everyone.id,
      allow: [PermissionFlagsBits.ViewChannel],
      deny: [
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
      ],
    },
    {
      id: params.roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.UseVAD,
      ],
    },
  ];

  for (const roleId of config.tournamentStaffRoleIds) {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.UseVAD,
      ],
    });
  }

  if (client.user?.id) {
    permissionOverwrites.push({
      id: client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles,
      ],
    });
  }

  const channel = await withTimeout(
    guild.channels.create({
      name: params.channelName,
      type: ChannelType.GuildVoice,
      parent: config.tournamentCategoryId,
      permissionOverwrites,
      reason: "Tournament team voice channel",
    }),
    API_TIMEOUT_MS,
    "Team room create timeout.",
  );

  return {
    channel,
    created: true,
  };
}

async function assignRoleToMembers(params: {
  roleId: string;
  memberDiscordIds: string[];
}) {
  const guild = await getGuild();

  const assigned: string[] = [];
  const failed: string[] = [];
  const failedDetails: MemberRoleFailure[] = [];

  for (const discordId of params.memberDiscordIds) {
    try {
      const member = await withTimeout(
        guild.members.fetch(discordId),
        API_TIMEOUT_MS,
        "Member fetch timeout.",
      );

      await withTimeout(
        member.roles.add(params.roleId, "Tournament team access"),
        API_TIMEOUT_MS,
        "Role assign timeout.",
      );

      assigned.push(discordId);
    } catch (error) {
      const reason = getErrorMessage(error);

      console.error(`Failed to assign role to ${discordId}`, error);
      failed.push(discordId);
      failedDetails.push({
        discordId,
        reason,
      });
    }
  }

  return {
    assigned,
    failed,
    failedDetails,
  };
}

async function removeRoleFromMembers(params: {
  roleId?: string | null;
  memberDiscordIds: string[];
}) {
  if (!params.roleId) {
    return {
      removed: [],
      failed: [],
    };
  }

  const guild = await getGuild();

  const removed: string[] = [];
  const failed: string[] = [];

  for (const discordId of params.memberDiscordIds) {
    try {
      const member = await withTimeout(
        guild.members.fetch(discordId),
        API_TIMEOUT_MS,
        "Member fetch timeout.",
      );

      await withTimeout(
        member.roles.remove(params.roleId, "Tournament team access removed"),
        API_TIMEOUT_MS,
        "Role remove timeout.",
      );

      removed.push(discordId);
    } catch (error) {
      console.error(`Failed to remove role from ${discordId}`, error);
      failed.push(discordId);
    }
  }

  return {
    removed,
    failed,
  };
}

async function fetchTeamCaptainState(registrationId: string) {
  const url = `${SITE_URL}/api/bot/discord-roles/team-captain?registrationId=${encodeURIComponent(
    registrationId,
  )}`;
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Authorization: `Bearer ${BOT_API_TOKEN}`,
      },
    },
    API_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`Team Captain check ${response.status}`);
  }

  const data = (await response.json()) as Record<string, any>;

  return {
    leaderDiscordId: String(data.leaderDiscordId || "").trim(),
    shouldKeepTeamCaptainRole: data.shouldKeepTeamCaptainRole === true,
  };
}

async function resolveLeaderDiscordId(payload: Record<string, any>) {
  const direct = pickFirstNonEmpty(payload.leaderDiscordId);

  if (direct) {
    return direct;
  }

  const registrationId = pickFirstNonEmpty(payload.registrationId);

  if (!registrationId) {
    return "";
  }

  const state = await fetchTeamCaptainState(registrationId);

  return state.leaderDiscordId;
}

async function assignTeamCaptainRole(payload: Record<string, any>) {
  try {
    const leaderDiscordId = await resolveLeaderDiscordId(payload);

    if (!leaderDiscordId) {
      return {
        assigned: [],
        failed: [],
        skipped: true,
        reason: "No leader Discord account",
      };
    }

    const result = await assignRoleToMembers({
      roleId: TEAM_CAPTAIN_ROLE_ID,
      memberDiscordIds: [leaderDiscordId],
    });

    return {
      ...result,
      skipped: false,
      reason: result.failed.length > 0 ? "Assignment failed" : "Assigned",
    };
  } catch (error) {
    console.error("[Team Captain] Assignment failed:", error);

    return {
      assigned: [],
      failed: [],
      skipped: true,
      reason: "Assignment failed",
    };
  }
}

async function removeTeamCaptainRoleIfSafe(payload: Record<string, any>) {
  try {
    const registrationId = pickFirstNonEmpty(payload.registrationId);

    if (!registrationId) {
      return {
        removed: [],
        failed: [],
        skipped: true,
        reason: "Missing registration",
      };
    }

    const state = await fetchTeamCaptainState(registrationId);

    if (!state.leaderDiscordId) {
      return {
        removed: [],
        failed: [],
        skipped: true,
        reason: "No leader Discord account",
      };
    }

    if (state.shouldKeepTeamCaptainRole) {
      return {
        removed: [],
        failed: [],
        skipped: true,
        reason: "Leader still qualifies",
      };
    }

    const result = await removeRoleFromMembers({
      roleId: TEAM_CAPTAIN_ROLE_ID,
      memberDiscordIds: [state.leaderDiscordId],
    });

    return {
      ...result,
      skipped: false,
      reason: result.failed.length > 0 ? "Removal failed" : "Removed",
    };
  } catch (error) {
    console.error("[Team Captain] Removal check failed:", error);

    return {
      removed: [],
      failed: [],
      skipped: true,
      reason: "Removal check failed",
    };
  }
}

async function findTeamVoiceChannel(params: {
  channelId?: string | null;
  channelName?: string | null;
}) {
  const guild = await getGuild();

  if (params.channelId) {
    const channel = await withTimeout(
      guild.channels.fetch(params.channelId).catch(() => null),
      API_TIMEOUT_MS,
      "Team room fetch timeout.",
    );

    if (channel && channel.type === ChannelType.GuildVoice) {
      return channel as any;
    }
  }

  if (!params.channelName) {
    return null;
  }

  const channels = await withTimeout(
    guild.channels.fetch(),
    API_TIMEOUT_MS,
    "Channels fetch timeout.",
  );

  const channel =
    channels.find((item) => {
      if (!item) {
        return false;
      }

      return (
        item.name === params.channelName && item.type === ChannelType.GuildVoice
      );
    }) || null;

  return channel as any;
}

async function deleteTeamVoiceChannel(params: {
  channelId?: string | null;
  channelName?: string | null;
}) {
  const channel = await findTeamVoiceChannel({
    channelId: params.channelId,
    channelName: params.channelName,
  });

  if (!channel) {
    return {
      deleted: false,
      channelId: params.channelId || null,
    };
  }

  const channelId = channel.id;

  await withTimeout(
    channel.delete("Tournament team access removed"),
    API_TIMEOUT_MS,
    "Team room delete timeout.",
  );

  return {
    deleted: true,
    channelId,
  };
}

async function deleteTeamRole(params: {
  roleId?: string | null;
  roleName?: string | null;
}) {
  const guild = await getGuild();

  let role = null;

  if (params.roleId) {
    role = await withTimeout(
      guild.roles.fetch(params.roleId).catch(() => null),
      API_TIMEOUT_MS,
      "Role fetch timeout.",
    );
  }

  if (!role && params.roleName) {
    const roles = await withTimeout(
      guild.roles.fetch(),
      API_TIMEOUT_MS,
      "Roles fetch timeout.",
    );

    role = roles.find((item) => item.name === params.roleName) || null;
  }

  if (!role) {
    return {
      deleted: false,
      roleId: params.roleId || null,
    };
  }

  const roleId = role.id;

  if (!role.editable) {
    throw new Error(`Bot cannot delete role: ${role.name}`);
  }

  await withTimeout(
    role.delete("Tournament team access removed"),
    API_TIMEOUT_MS,
    "Role delete timeout.",
  );

  return {
    deleted: true,
    roleId,
  };
}

function formatAccessResult(label: unknown, created: boolean) {
  const result = created ? "Created" : "Ready";
  const cleanLabel = cleanLogValue(label);

  return cleanLabel === "-" ? result : `${result} - ${cleanLabel}`;
}

function formatAssignmentSummary(assignedCount: number, failedCount: number) {
  return `${assignedCount} assigned, ${failedCount} failed`;
}

function formatCaptainRoleSummary(params: {
  assigned: string[];
  failed: string[];
  reason: string;
}) {
  if (params.assigned.length > 0) {
    return "Assigned";
  }

  if (params.failed.length > 0) {
    return "Failed";
  }

  return cleanLogValue(params.reason);
}

function formatFailureReason(value: unknown) {
  return cleanLogValue(value).replace(/\s+/g, " ").slice(0, 180);
}

function formatMemberAssignmentFailures(
  failedIds: string[],
  failedDetails: MemberRoleFailure[] = [],
) {
  const details =
    failedDetails.length > 0
      ? failedDetails
      : failedIds.map((discordId) => ({
          discordId,
          reason: "Assignment failed",
        }));

  if (details.length === 0) {
    return "-";
  }

  const visibleDetails = details.slice(0, 8).map((failure) => {
    return `${failure.discordId}: ${formatFailureReason(failure.reason)}`;
  });
  const remainingCount = details.length - visibleDetails.length;

  if (remainingCount > 0) {
    visibleDetails.push(`${remainingCount} more`);
  }

  return visibleDetails.join("\n");
}

function getTeamAccessTournamentTitle(payload: Record<string, any>) {
  return cleanLogValue(payload.tournamentTitle);
}

function getTeamAccessTournamentName(payload: Record<string, any>) {
  return pickFirstNonEmpty(payload.tournamentTitle, "this tournament");
}

function getTeamAccessTournamentUrl(payload: Record<string, any>) {
  return getAbsoluteUrl(
    pickFirstNonEmpty(payload.websiteUrl, payload.tournamentUrl),
  );
}

function getTeamAccessCaptainDiscordId(payload: Record<string, any>) {
  return pickFirstNonEmpty(payload.leaderDiscordId, payload.captainDiscordId);
}

function isFirstBotEventAttempt(event: BotEvent) {
  const attempts = Number(event.attempts ?? 1);

  return !Number.isFinite(attempts) || attempts <= 1;
}

function shouldSendTeamApprovedDm(event: BotEvent, payload: Record<string, any>) {
  if (!isFirstBotEventAttempt(event)) {
    return false;
  }

  return pickFirstNonEmpty(payload.action) !== "manual_sync";
}

async function logCaptainDmFailure(params: {
  payload: Record<string, any>;
  eventId: string;
  captainDiscordId: string;
  reason: string;
}) {
  await sendBotErrorLog({
    title: "Captain DM failed",
    fields: [
      { name: "Team", value: cleanLogValue(params.payload.teamName) },
      {
        name: "Tournament",
        value: getTeamAccessTournamentTitle(params.payload),
      },
      {
        name: "Captain",
        value: cleanLogValue(params.captainDiscordId),
      },
      { name: "Reason", value: formatFailureReason(params.reason) },
      { name: "Event ID", value: params.eventId, inline: false },
    ],
  });
}

async function sendTeamApprovedCaptainDm(params: {
  event: BotEvent;
  payload: Record<string, any>;
  teamChannelName: string;
  roleAssignments: {
    failed: string[];
  };
}) {
  if (!shouldSendTeamApprovedDm(params.event, params.payload)) {
    return;
  }

  const captainDiscordId = getTeamAccessCaptainDiscordId(params.payload);

  if (!captainDiscordId) {
    await logCaptainDmFailure({
      payload: params.payload,
      eventId: params.event.id,
      captainDiscordId,
      reason: "Missing captain Discord ID",
    });

    return;
  }

  if (params.roleAssignments.failed.includes(captainDiscordId)) {
    await logCaptainDmFailure({
      payload: params.payload,
      eventId: params.event.id,
      captainDiscordId,
      reason: "Captain access not ready",
    });

    return;
  }

  const tournamentName = getTeamAccessTournamentName(params.payload);
  const tournamentUrl = getTeamAccessTournamentUrl(params.payload);
  const embed = new EmbedBuilder()
    .setColor(COLORS.tournament)
    .setAuthor({
      name: "Ascendra Tournaments",
      iconURL: BRAND_LOGO_URL,
      url: SITE_URL,
    })
    .setTitle("Team approved")
    .setDescription(`Your team has been approved for ${tournamentName}.`)
    .addFields(
      {
        name: "Team",
        value: cleanLogValue(params.payload.teamName),
        inline: true,
      },
      {
        name: "Tournament",
        value: getTeamAccessTournamentTitle(params.payload),
        inline: true,
      },
      {
        name: "Discord access",
        value: "Ready",
        inline: true,
      },
      {
        name: "Team channel",
        value: cleanLogValue(params.teamChannelName),
        inline: false,
      },
    )
    .setFooter({
      text: BRAND_FOOTER_TEXT,
      iconURL: BRAND_LOGO_URL,
    })
    .setTimestamp();

  const messagePayload: {
    embeds: EmbedBuilder[];
    components?: ActionRowBuilder<ButtonBuilder>[];
  } = {
    embeds: [embed],
  };

  if (tournamentUrl) {
    messagePayload.components = [
      buildLinkRow("Open tournament", tournamentUrl),
    ];
  }

  try {
    const user = await withTimeout(
      client.users.fetch(captainDiscordId),
      API_TIMEOUT_MS,
      "Captain fetch timeout.",
    );

    await withTimeout<DiscordMessage>(
      user.send(messagePayload) as unknown as Promise<DiscordMessage>,
      API_TIMEOUT_MS,
      "Captain DM timeout.",
    );
  } catch (error) {
    await logCaptainDmFailure({
      payload: params.payload,
      eventId: params.event.id,
      captainDiscordId,
      reason: getErrorMessage(error),
    });
  }
}

async function processTeamAccessCreate(event: BotEvent) {
  const payload = event.payload;
  const config = await getBotConfig();

  if (!config.enableDiscordAccess) {
    throw new Error("Discord access disabled.");
  }

  const roleResult = await findOrCreateRole(payload.roleName);

  const channelResult = await findOrCreateTeamChannel({
    channelName: payload.channelName,
    roleId: roleResult.role.id,
  });

  const roleAssignments = await assignRoleToMembers({
    roleId: roleResult.role.id,
    memberDiscordIds: payload.memberDiscordIds || [],
  });
  const teamCaptainAssignment = await assignTeamCaptainRole(payload);

  await sendTournamentLog({
    title: "Team access created",
    fields: [
      { name: "Team", value: cleanLogValue(payload.teamName) },
      {
        name: "Tournament",
        value: getTeamAccessTournamentTitle(payload),
      },
      { name: "Game", value: cleanLogValue(payload.game) },
      {
        name: "Team role",
        value: formatAccessResult(roleResult.role.name, roleResult.created),
      },
      {
        name: "Team channel",
        value: formatAccessResult(
          channelResult.channel.name,
          channelResult.created,
        ),
      },
      {
        name: "Members",
        value: formatAssignmentSummary(
          roleAssignments.assigned.length,
          roleAssignments.failed.length,
        ),
      },
      {
        name: "Captain role",
        value: formatCaptainRoleSummary(teamCaptainAssignment),
      },
      { name: "Event ID", value: event.id, inline: false },
    ],
    color:
      roleAssignments.failed.length > 0 ||
      teamCaptainAssignment.failed.length > 0
        ? COLORS.warning
        : COLORS.success,
  });

  if (
    roleAssignments.failed.length > 0 ||
    teamCaptainAssignment.failed.length > 0
  ) {
    await sendBotErrorLog({
      title: "Team role assignment incomplete",
      fields: [
        { name: "Team", value: cleanLogValue(payload.teamName) },
        {
          name: "Tournament",
          value: getTeamAccessTournamentTitle(payload),
        },
        {
          name: "Failed members",
          value: formatMemberAssignmentFailures(
            roleAssignments.failed,
            roleAssignments.failedDetails,
          ),
          inline: false,
        },
        {
          name: "Captain role",
          value: formatCaptainRoleSummary(teamCaptainAssignment),
        },
        { name: "Event ID", value: event.id, inline: false },
      ],
    });
  }

  await sendTeamApprovedCaptainDm({
    event,
    payload,
    teamChannelName: channelResult.channel.name,
    roleAssignments,
  });

  return {
    roleId: roleResult.role.id,
    channelId: channelResult.channel.id,
    roleCreated: roleResult.created,
    channelCreated: channelResult.created,
    assigned: roleAssignments.assigned,
    failed: roleAssignments.failed,
    teamCaptainAssigned: teamCaptainAssignment.assigned.length > 0,
    teamCaptainFailed: teamCaptainAssignment.failed.length > 0,
    teamCaptainSkipped: teamCaptainAssignment.skipped,
  };
}

async function processTeamAccessRemove(event: BotEvent) {
  const payload = event.payload;
  const config = await getBotConfig();

  if (!config.enableDiscordAccess) {
    throw new Error("Discord access disabled.");
  }

  const roleRemoval = await removeRoleFromMembers({
    roleId: payload.roleId,
    memberDiscordIds: payload.memberDiscordIds || [],
  });
  const teamCaptainRemoval = await removeTeamCaptainRoleIfSafe(payload);

  const channelDeletion = await deleteTeamVoiceChannel({
    channelId: payload.channelId,
    channelName: payload.channelName,
  });

  const roleDeletion = await deleteTeamRole({
    roleId: payload.roleId,
    roleName: payload.roleName,
  });

  await sendTournamentLog({
    title: "Team Discord access removed",
    fields: [
      { name: "Team", value: cleanLogValue(payload.teamName) },
      { name: "Action", value: cleanLogValue(payload.action || "removed") },
      {
        name: "Reason",
        value: cleanLogValue(payload.rejectionReason),
        inline: false,
      },
      {
        name: "Role",
        value: cleanLogValue(payload.roleName || payload.roleId),
      },
      {
        name: "Voice Room",
        value: cleanLogValue(payload.channelName || payload.channelId),
      },
      { name: "Members Removed", value: String(roleRemoval.removed.length) },
      { name: "Failed Removals", value: String(roleRemoval.failed.length) },
      {
        name: "Team Captain",
        value: cleanLogValue(teamCaptainRemoval.reason),
      },
      { name: "Room Deleted", value: channelDeletion.deleted ? "Yes" : "No" },
      { name: "Role Deleted", value: roleDeletion.deleted ? "Yes" : "No" },
      { name: "Event ID", value: event.id, inline: false },
    ],
    color:
      roleRemoval.failed.length > 0 || teamCaptainRemoval.failed.length > 0
        ? COLORS.warning
        : COLORS.success,
  });

  if (roleRemoval.failed.length > 0 || teamCaptainRemoval.failed.length > 0) {
    await sendBotErrorLog({
      title: "Team role removal failed",
      fields: [
        { name: "Team", value: cleanLogValue(payload.teamName) },
        { name: "Failed Members", value: String(roleRemoval.failed.length) },
        {
          name: "Team Captain",
          value: cleanLogValue(teamCaptainRemoval.reason),
        },
        { name: "Event ID", value: event.id, inline: false },
      ],
    });
  }

  return {
    roleId: payload.roleId,
    channelId: payload.channelId,
    removed: roleRemoval.removed,
    failed: roleRemoval.failed,
    teamCaptainRemoved: teamCaptainRemoval.removed.length > 0,
    teamCaptainFailed: teamCaptainRemoval.failed.length > 0,
    teamCaptainSkipped: teamCaptainRemoval.skipped,
    channelDeleted: channelDeletion.deleted,
    deletedChannelId: channelDeletion.channelId,
    roleDeleted: roleDeletion.deleted,
    deletedRoleId: roleDeletion.roleId,
  };
}

async function processSendMessageCommand(event: BotEvent) {
  const payload = event.payload || {};
  const channelId = pickFirstNonEmpty(payload.channelId);
  const title = pickFirstNonEmpty(payload.title);
  const message = pickFirstNonEmpty(payload.message);
  const buttonLabel = pickFirstNonEmpty(payload.buttonLabel);
  const buttonUrl = pickFirstNonEmpty(payload.buttonUrl);
  const imageUrl = pickFirstNonEmpty(payload.imageUrl);

  if (!channelId) {
    throw new Error("Missing channel ID.");
  }

  if (!title && !message) {
    throw new Error("Missing message content.");
  }

  const channel = await withTimeout(
    client.channels.fetch(channelId),
    API_TIMEOUT_MS,
    "Message channel timeout.",
  );

  if (!channel || !channel.isSendable()) {
    throw new Error("Message channel unavailable.");
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.premium)
    .setTimestamp()
    .setFooter({
      text: "Ascendra Bot",
    });

  if (title) {
    embed.setTitle(title.slice(0, 256));
  }

  if (message) {
    embed.setDescription(message.slice(0, 3900));
  }

  if (isValidHttpUrl(imageUrl)) {
    embed.setImage(imageUrl);
  }

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (buttonLabel && isValidHttpUrl(buttonUrl)) {
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(buttonLabel.slice(0, 80))
          .setStyle(ButtonStyle.Link)
          .setURL(buttonUrl),
      ),
    );
  }

  const sentMessage = await withTimeout<DiscordMessage>(
    channel.send({
      embeds: [embed],
      components,
    }) as unknown as Promise<DiscordMessage>,
    API_TIMEOUT_MS,
    "Message send timeout.",
  );

  return {
    channelId: sentMessage.channelId,
    messageId: sentMessage.id,
    messageUrl: sentMessage.url,
  };
}

async function deleteTournamentAnnouncementMessage(event: BotEvent) {
  const payload = event.payload || {};
  const channelId = pickFirstNonEmpty(
    payload.announcementChannelId,
    payload.discordAnnouncementChannelId,
  );
  const messageId = pickFirstNonEmpty(
    payload.announcementMessageId,
    payload.discordAnnouncementMessageId,
  );

  if (!channelId || !messageId) {
    throw new Error("No Discord message stored.");
  }

  const message = await fetchAnnouncementMessage({
    channelId,
    messageId,
  });

  if (!message) {
    return {
      deleted: false,
      channelId,
      messageId,
      messageUrl: "",
      reason: "Message not found.",
    };
  }

  await withTimeout(
    message.delete(),
    API_TIMEOUT_MS,
    "Announcement delete timeout.",
  );

  await sendTournamentLog({
    title: "Tournament announcement deleted",
    fields: [
      { name: "Tournament", value: cleanLogValue(payload.title) },
      { name: "Game", value: cleanLogValue(payload.game) },
      { name: "Message ID", value: messageId, inline: false },
      { name: "Event ID", value: event.id, inline: false },
    ],
    color: COLORS.warning,
  });

  return {
    deleted: true,
    channelId,
    messageId,
    messageUrl: "",
  };
}

async function recreateTournamentAnnouncementMessage(event: BotEvent) {
  const payload = event.payload || {};
  const channelId = pickFirstNonEmpty(
    payload.announcementChannelId,
    payload.discordAnnouncementChannelId,
  );
  const messageId = pickFirstNonEmpty(
    payload.announcementMessageId,
    payload.discordAnnouncementMessageId,
  );

  let deletedOldMessage = false;

  if (channelId && messageId) {
    const message = await fetchAnnouncementMessage({
      channelId,
      messageId,
    });

    if (message) {
      await withTimeout(
        message.delete(),
        API_TIMEOUT_MS,
        "Old announcement delete timeout.",
      );

      deletedOldMessage = true;
    }
  }

  const nextEvent: BotEvent = {
    ...event,
    payload: {
      ...payload,
      announcementMessageId: "",
      discordAnnouncementMessageId: "",
      announcementUrl: "",
    },
  };

  const result = await upsertTournamentAnnouncementMessage(nextEvent);

  return {
    ...result,
    mode: "created",
    deletedOldMessage,
  };
}

function canSendToChannel(channel: any, botMember: any) {
  if (!channel || !botMember || !channel.isSendable?.()) {
    return false;
  }

  const permissions = channel.permissionsFor?.(botMember);

  if (!permissions) {
    return false;
  }

  return (
    permissions.has(PermissionFlagsBits.ViewChannel) &&
    permissions.has(PermissionFlagsBits.SendMessages) &&
    permissions.has(PermissionFlagsBits.EmbedLinks)
  );
}

async function fetchDiscordChannel(channelId: string) {
  if (!channelId) {
    return null;
  }

  return client.channels.fetch(channelId).catch(() => null);
}

function getSiteLink(path = "") {
  if (!path) {
    return SITE_URL;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildLinkRow(label: string, url: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setLabel(label).setStyle(ButtonStyle.Link).setURL(url),
  );
}

type PublicTournament = {
  id: string;
  title: string;
  game: string;
  date: string;
  prize: string;
  status: string;
  description?: string;
};

async function fetchPublicTournaments() {
  const response = await fetchWithTimeout(
    `${SITE_URL}/api/tournaments`,
    {},
    API_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`Tournaments ${response.status}`);
  }

  const data = await response.json();

  if (!data?.success || !Array.isArray(data.data)) {
    return [];
  }

  return data.data as PublicTournament[];
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

function buildTournamentListDescription(tournaments: PublicTournament[]) {
  if (tournaments.length === 0) {
    return "No tournaments available right now.";
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

function buildTournamentRows(tournaments: PublicTournament[]) {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const visibleTournaments = tournaments.slice(0, 4);

  if (visibleTournaments.length > 0) {
    const row = new ActionRowBuilder<ButtonBuilder>();

    for (const tournament of visibleTournaments) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel(tournament.title.slice(0, 80))
          .setStyle(ButtonStyle.Link)
          .setURL(getSiteLink(`/tournaments/${tournament.id}`)),
      );
    }

    rows.push(row);
  }

  rows.push(buildLinkRow("Tournaments", getSiteLink("/tournaments")));

  return rows;
}

function getSlashCommands() {
  return [
    {
      name: "ascendra",
      description: "Open Ascendra.",
    },
    {
      name: "tournaments",
      description: "Open Ascendra tournaments.",
    },
    {
      name: "leaderboard",
      description: "Open the Ascendra leaderboard.",
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

function getResolvedApplicationId() {
  return APPLICATION_ID || client.application?.id || client.user?.id || "";
}

function getResolvedGuildId() {
  return GUILD_ID || client.guilds.cache.first()?.id || "";
} 

async function registerSlashCommands() {
  const applicationId = getResolvedApplicationId();
  const guildId = getResolvedGuildId();
  const botToken = DISCORD_BOT_TOKEN || "";

  if (!applicationId || !guildId || !botToken) {
    slashCommandsReady = false;
    slashCommandError = "Missing application ID, guild ID, or bot token.";

    console.warn(
      "[SlashCommands] Missing application ID, guild ID, or bot token.",
      {
        hasApplicationId: Boolean(applicationId),
        hasGuildId: Boolean(guildId),
        hasBotToken: Boolean(botToken),
      },
    );

    return;
  }

  try {
    const rest = new REST({ version: "10" }).setToken(botToken);

    await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
      body: getEnhancedSlashCommands(),
    });

    slashCommandsReady = true;
    slashCommandError = "";

    console.log("[SlashCommands] Registered.");
  } catch (error) {
    slashCommandsReady = false;
    slashCommandError = getErrorMessage(error);

    console.error("[SlashCommands] Failed:", error);
  }
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

async function handleSlashCommand(interaction: any) {
  const commandName = interaction.commandName;

  if (commandName === "ascendra") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.premium)
      .setTitle("Ascendra")
      .setDescription("Open the Ascendra platform.")
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Website", getSiteLink())],
    });

    return;
  }

  if (commandName === "tournaments") {
    const tournaments = await fetchPublicTournaments();
    const visibleTournaments = tournaments.slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(COLORS.tournament)
      .setTitle("Ascendra Tournaments")
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
      components: buildTournamentRows(visibleTournaments),
    });

    return;
  }

  if (commandName === "leaderboard") {
    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle("Leaderboard")
      .setDescription("Open the Ascendra leaderboard.")
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [
        buildLinkRow("Leaderboard", getSiteLink("/leaderboard")),
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
          value: `${Math.floor(process.uptime() / 60)}m`,
          inline: true,
        },
        {
          name: "Commands",
          value: slashCommandsReady ? "Ready" : "Check required",
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
      .setDescription(
        [
          "`/ascendra` - Website",
          "`/tournaments` - Tournaments",
          "`/leaderboard` - Leaderboard",
          "`/status` - Bot status",
          "`/help` - Commands",
        ].join("\n"),
      )
      .setTimestamp();

    await replyToCommand(interaction, {
      embeds: [embed],
      components: [buildLinkRow("Website", getSiteLink())],
    });
  }
}

async function processHealthCheck() {
  const config = await getBotConfig(true);
  const guild = await getGuild();

  const botMember = client.user?.id
    ? await guild.members.fetch(client.user.id).catch(() => null)
    : null;

  const announcementChannel = await fetchDiscordChannel(
    config.announcementChannelId,
  );
  const botLogChannel = await fetchDiscordChannel(config.botLogChannelId);
  const tournamentLogChannel = await fetchDiscordChannel(
    config.tournamentLogChannelId,
  );
  const inviteChannel = await fetchDiscordChannel(config.inviteChannelId);
  const tournamentCategory = await fetchDiscordChannel(
    config.tournamentCategoryId,
  );

  return {
    botTag: client.user?.tag || "Unknown",
    guildId: guild.id,
    guildName: guild.name,
    uptimeMs: Math.floor(process.uptime() * 1000),
    siteUrl: SITE_URL,

    announcementChannel: Boolean(
      announcementChannel && announcementChannel.isSendable?.(),
    ),
    announcementChannelPermissions: canSendToChannel(
      announcementChannel,
      botMember,
    ),

    botLogChannel: Boolean(botLogChannel && botLogChannel.isSendable?.()),
    botLogChannelPermissions: canSendToChannel(botLogChannel, botMember),

    tournamentLogChannel: Boolean(
      tournamentLogChannel && tournamentLogChannel.isSendable?.(),
    ),
    tournamentLogChannelPermissions: canSendToChannel(
      tournamentLogChannel,
      botMember,
    ),

    inviteChannel: Boolean(inviteChannel && inviteChannel.isSendable?.()),
    inviteChannelPermissions: canSendToChannel(inviteChannel, botMember),

    tournamentCategory: Boolean(
      tournamentCategory &&
      tournamentCategory.type === ChannelType.GuildCategory,
    ),

    manageRoles: Boolean(
      botMember?.permissions.has(PermissionFlagsBits.ManageRoles),
    ),
    manageChannels: Boolean(
      botMember?.permissions.has(PermissionFlagsBits.ManageChannels),
    ),

    announcementsEnabled: config.enableAnnouncements,
    discordAccessEnabled: config.enableDiscordAccess,
    slashCommandsReady,
    slashCommandError,
    applicationId: getResolvedApplicationId(),
  };
}

async function processEventOperation(event: BotEvent) {
  switch (event.type) {
    case "tournament_announcement_create":
    case "tournament_announcement_update":
      return upsertTournamentAnnouncementMessage(event);

    case "tournament_announcement_recreate":
      return recreateTournamentAnnouncementMessage(event);

    case "tournament_announcement_delete":
      return deleteTournamentAnnouncementMessage(event);

    case "team_discord_access_create":
      return processTeamAccessCreate(event);

    case "team_discord_access_remove":
      return processTeamAccessRemove(event);

    case "bot_command_health_check":
      return processHealthCheck();

    case "bot_command_refresh_config":
      botConfigCache = null;
      return getBotConfig(true);

    case "bot_command_send_message":
      return processSendMessageCommand(event);

    case "bot_command_restart":
      return {
        restart: true,
        message: "Restart requested.",
      };

    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
}

async function processEvent(event: BotEvent) {
  let shouldRestart = false;

  try {
    const result = await withTimeout(
      processEventOperation(event),
      EVENT_TIMEOUT_MS,
      `Event timeout after ${EVENT_TIMEOUT_MS / 1000}s.`,
    );

    shouldRestart =
      event.type === "bot_command_restart" &&
      Boolean((result as { restart?: boolean } | null)?.restart);

    await safeUpdateEvent(event.id, {
      status: "completed",
      result,
    });

    await sendHeartbeat();

    await sendBotLog({
      title: "Bot event completed",
      fields: [
        { name: "Type", value: event.type },
        { name: "Event ID", value: event.id, inline: false },
      ],
      color: COLORS.success,
    });

    if (isAdminActionEvent(event.type)) {
      await sendAdminActionLog({
        title: "Admin bot action completed",
        fields: [
          { name: "Action", value: event.type },
          { name: "Event ID", value: event.id, inline: false },
        ],
        color: COLORS.success,
      });
    }

    console.log(`[BotEvent] Completed ${event.type}`);

    if (shouldRestart) {
      await shutdown("Restart command completed");
    }
  } catch (error) {
    const message = getErrorMessage(error);

    console.error(`[BotEvent] Failed ${event.type}:`, error);

    await safeUpdateEvent(event.id, {
      status: "failed",
      error: message,
    });

    await sendHeartbeat();

    await sendBotErrorLog({
      title: "Bot event failed",
      description: message,
      fields: [
        { name: "Type", value: event.type },
        { name: "Event ID", value: event.id, inline: false },
      ],
      color: COLORS.error,
    });
  }
}

async function logQueueState(paused: boolean) {
  const now = Date.now();

  if (lastQueuePausedState === paused) {
    if (paused && now - lastPausedLogAt >= PAUSED_LOG_INTERVAL_MS) {
      lastPausedLogAt = now;
      console.log("[BotEvent] Queue paused.");
    }

    return;
  }

  const wasPaused = lastQueuePausedState === true;
  lastQueuePausedState = paused;

  if (paused) {
    lastPausedLogAt = now;
    console.log("[BotEvent] Queue paused.");

    await sendAdminActionLog({
      title: "Queue paused",
      description: "Bot event processing is paused.",
    });

    return;
  }

  if (wasPaused) {
    console.log("[BotEvent] Queue resumed.");

    await sendAdminActionLog({
      title: "Queue resumed",
      description: "Bot event processing resumed.",
    });
  }
}

async function pollEvents() {
  if (isShuttingDown) {
    return;
  }

  if (isPolling) {
    console.log("[BotEvent] Poll skipped.");
    return;
  }

  isPolling = true;

  try {
    const data = await fetchPendingEvents();

    if (data.paused) {
      await logQueueState(true);
      return;
    }

    await logQueueState(false);

    const events: BotEvent[] = data.events || [];

    if (events.length > 0) {
      console.log(`[BotEvent] Processing ${events.length} event(s).`);
    }

    for (const event of events) {
      if (isShuttingDown) {
        break;
      }

      await processEvent(event);
    }
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("[BotEvent] Poll failed:", error);

    await sendBotErrorLog({
      title: "Bot polling failed",
      description: message,
      color: COLORS.error,
    });
  } finally {
    isPolling = false;
  }
}

async function shutdown(reason: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`[Bot] Shutting down: ${reason}`);

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  await sendBotLog({
    title: "Bot shutting down",
    description: reason,
    color: COLORS.warning,
  });

  client.destroy();

  process.exit(0);
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot logged in as ${client.user?.tag}`);

  client.user?.setPresence({
    activities: [
      {
        name: "Ascendra tournaments",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });

  await getBotConfig(true);
  await registerSlashCommands();
  await sendHeartbeat();

  heartbeatInterval = setInterval(async () => {
    await sendHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);

  await sendBotLog({
    title: "Bot online",
    fields: [
      { name: "Bot", value: client.user?.tag || "Unknown" },
      { name: "Site", value: SITE_URL },
    ],
    color: COLORS.success,
  });

  await pollEvents();

  pollingInterval = setInterval(async () => {
    await pollEvents();
  }, POLL_INTERVAL_MS);
});

function getInteractionLocation(interaction: any) {
  if (!interaction.guildId) {
    return "Direct Message";
  }

  const channelName = interaction.channel?.name
    ? `#${interaction.channel.name}`
    : interaction.channelId || "Unknown channel";

  return channelName;
}

function getInteractionUserLabel(interaction: any) {
  const username =
    interaction.user?.tag ||
    interaction.user?.username ||
    interaction.user?.id ||
    "Unknown user";

  const userId = interaction.user?.id || "Unknown ID";

  return `${username} (${userId})`;
}

function getInteractionOptionsSnapshot(interaction: any) {
  const rawOptions = interaction.options?.data || [];

  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    return "-";
  }

  const values = rawOptions
    .map((option: any) => {
      const name = option.name || "unknown";
      const value =
        option.value ||
        option.user?.tag ||
        option.user?.username ||
        option.user?.id ||
        "-";

      return `${name}: ${value}`;
    })
    .join("\n");

  return values.slice(0, 900);
}

async function recordSlashCommandLog(params: {
  interaction: any;
  status: "completed" | "failed";
  error?: unknown;
  latencyMs?: number;
}) {
  try {
    await fetchWithTimeout(
      `${SITE_URL}/api/bot/slash-commands/log`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BOT_API_TOKEN}`,
        },
        body: JSON.stringify({
          commandName: params.interaction.commandName || "unknown",
          status: params.status,
          userId: params.interaction.user?.id || "unknown",
          userTag:
            params.interaction.user?.tag ||
            params.interaction.user?.username ||
            "Unknown user",
          guildId: params.interaction.guildId || null,
          channelId: params.interaction.channelId || null,
          location: getInteractionLocation(params.interaction),
          options: getInteractionOptionsSnapshot(params.interaction),
          error: params.error ? getErrorMessage(params.error) : "",
          latencyMs: params.latencyMs ?? null,
        }),
      },
      API_TIMEOUT_MS,
    );
  } catch (error) {
    console.error("[SlashCommands] Failed to record command log:", error);
  }
}

async function logSlashCommandUsage(interaction: any) {
  try {
    await sendBotLog({
      title: "Slash command used",
      fields: [
        {
          name: "Command",
          value: `/${interaction.commandName || "unknown"}`,
          inline: true,
        },
        {
          name: "User",
          value: getInteractionUserLabel(interaction),
          inline: false,
        },
        {
          name: "Location",
          value: getInteractionLocation(interaction),
          inline: true,
        },
        {
          name: "Options",
          value: getInteractionOptionsSnapshot(interaction),
          inline: false,
        },
      ],
      color: COLORS.info,
    });
  } catch (error) {
    console.error("[SlashCommands] Failed to log usage:", error);
  }
}

async function logSlashCommandFailure(interaction: any, error: unknown) {
  try {
    await sendBotErrorLog({
      title: "Slash command failed",
      description: getErrorMessage(error),
      fields: [
        {
          name: "Command",
          value: `/${interaction.commandName || "unknown"}`,
          inline: true,
        },
        {
          name: "User",
          value: getInteractionUserLabel(interaction),
          inline: false,
        },
        {
          name: "Location",
          value: getInteractionLocation(interaction),
          inline: true,
        },
        {
          name: "Options",
          value: getInteractionOptionsSnapshot(interaction),
          inline: false,
        },
      ],
      color: COLORS.error,
    });
  } catch (logError) {
    console.error("[SlashCommands] Failed to log failure:", logError);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  const startedAt = Date.now();

  try {
    if (interaction.isAutocomplete()) {
      await handleAutocompleteInteraction(interaction, {
        siteUrl: SITE_URL,
        apiTimeoutMs: API_TIMEOUT_MS,
      });

      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    await handleEnhancedSlashCommand(interaction, {
      siteUrl: SITE_URL,
      apiTimeoutMs: API_TIMEOUT_MS,
      slashCommandsReady,
      slashCommandError,
      uptimeMs: Math.floor(process.uptime() * 1000),
    });

    const latencyMs = Date.now() - startedAt;

    await logSlashCommandUsage(interaction);

    await recordSlashCommandLog({
      interaction,
      status: "completed",
      latencyMs,
    });
  } catch (error) {
    console.error("[SlashCommands] Interaction failed:", error);

    if (interaction.isChatInputCommand()) {
      const latencyMs = Date.now() - startedAt;

      await logSlashCommandFailure(interaction, error);

      await recordSlashCommandLog({
        interaction,
        status: "failed",
        error,
        latencyMs,
      });

      await replyToCommand(interaction, {
        content: "This command is unavailable right now.",
      }).catch(() => null);
    }
  }
});

client.on(Events.Error, (error) => {
  console.error("[Discord] Client error:", error);
  void sendBotErrorLog({
    title: "Discord client error",
    description: getErrorMessage(error),
  });
});

client.on(Events.Warn, (message) => {
  console.warn("[Discord] Warning:", message);
});

process.on("SIGINT", () => {
  void shutdown("SIGINT received");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM received");
});

process.on("unhandledRejection", async (reason) => {
  console.error("[Process] Unhandled rejection:", reason);

  await sendBotErrorLog({
    title: "Unhandled rejection",
    description: getErrorMessage(reason),
    color: COLORS.error,
  });
});

process.on("uncaughtException", async (error) => {
  console.error("[Process] Uncaught exception:", error);

  await sendBotErrorLog({
    title: "Uncaught exception",
    description: getErrorMessage(error),
    color: COLORS.error,
  });

  await shutdown("Uncaught exception");
});

client.login(DISCORD_BOT_TOKEN);

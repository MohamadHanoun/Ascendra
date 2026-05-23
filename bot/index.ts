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
} from "discord.js";

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

const CONFIG_CACHE_MS = 30000;
const HEARTBEAT_INTERVAL_MS = 60000;
const POLL_INTERVAL_MS = 15000;

const COLORS = {
  success: 0x10b981,
  error: 0xef4444,
  warning: 0xf59e0b,
  info: 0x8b5cf6,
  tournament: 0x7c3aed,
  premium: 0x6d28d9,
};

const BRAND_LOGO_URL = `${SITE_URL}/images/brand/ascendra-logo-mark.png`;
const BRAND_FOOTER_TEXT = "Ascendra • Rise Beyond Limits";

if (!BOT_API_TOKEN) {
  throw new Error("Missing BOT_API_TOKEN");
}

if (!DISCORD_BOT_TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

type BotRuntimeConfig = {
  announcementChannelId: string;
  tournamentCategoryId: string;
  tournamentStaffRoleIds: string[];
  botLogChannelId: string;
  tournamentLogChannelId: string;
  inviteChannelId: string;
  enableAnnouncements: boolean;
  enableDiscordAccess: boolean;
};

type BotEvent = {
  id: string;
  type: string;
  payload: Record<string, any>;
};

type LogField = {
  name: string;
  value: string;
  inline?: boolean;
};

type RegistrationPresentation = {
  label: string;
  badge: string;
  color: number;
  footerStatus: string;
};

let botConfigCache: {
  value: BotRuntimeConfig;
  expiresAt: number;
} | null = null;

let heartbeatInterval: NodeJS.Timeout | null = null;
let pollingInterval: NodeJS.Timeout | null = null;
let isPolling = false;
let isShuttingDown = false;

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

  return `${value} Players`;
}

function formatSlots(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${value} Teams`;
}

function formatPrize(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not announced";
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
        badge: "🟢 OPEN",
        color: COLORS.success,
        footerStatus: "Registration Open",
      };

    case "upcoming":
      return {
        label: "Upcoming",
        badge: "🟡 UPCOMING",
        color: COLORS.warning,
        footerStatus: "Registration Coming Soon",
      };

    case "closed":
      return {
        label: "Closed",
        badge: "🔴 CLOSED",
        color: COLORS.error,
        footerStatus: "Registration Closed",
      };

    default:
      return {
        label: cleanLogValue(value),
        badge: "🟣 TOURNAMENT",
        color: COLORS.premium,
        footerStatus: "Tournament Update",
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

  return "A new Ascendra tournament is now live. Review the details, register your team, and follow all upcoming updates from the tournament page.";
}

function buildTournamentButtons(tournamentUrl: string) {
  const row = new ActionRowBuilder<ButtonBuilder>();

  row.addComponents(
    new ButtonBuilder()
      .setLabel("Open Tournament")
      .setStyle(ButtonStyle.Link)
      .setURL(tournamentUrl),
  );

  if (DISCORD_INVITE_URL) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Join Discord")
        .setStyle(ButtonStyle.Link)
        .setURL(DISCORD_INVITE_URL),
    );
  }

  return row;
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
    const response = await fetch(`${SITE_URL}/api/bot/config`, {
      headers: {
        Authorization: `Bearer ${BOT_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bot config: ${response.status}`);
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
    const channel = await client.channels.fetch(params.channelId);

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

    await channel.send({
      embeds: [embed],
    });
  } catch (error) {
    console.error("[DiscordLog] Failed to send log:", error);
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
    channelId: config.botLogChannelId,
    color: params.color || COLORS.info,
    ...params,
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
    channelId: config.tournamentLogChannelId || config.botLogChannelId,
    color: params.color || COLORS.tournament,
    ...params,
  });
}

async function sendHeartbeat() {
  if (isShuttingDown) {
    return;
  }

  try {
    const response = await fetch(`${SITE_URL}/api/bot/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_API_TOKEN}`,
      },
      body: JSON.stringify({
        botTag: client.user?.tag || "Unknown",
        guildId: GUILD_ID,
        uptimeMs: Math.floor(process.uptime() * 1000),
      }),
    });

    if (!response.ok) {
      throw new Error(`Heartbeat failed: ${response.status}`);
    }
  } catch (error) {
    console.error("[Heartbeat] Failed:", error);
  }
}

async function fetchPendingEvents() {
  const response = await fetch(`${SITE_URL}/api/bot/events/pending`, {
    headers: {
      Authorization: `Bearer ${BOT_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
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
  const response = await fetch(`${SITE_URL}/api/bot/events/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BOT_API_TOKEN}`,
    },
    body: JSON.stringify({
      eventId,
      ...data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update event: ${response.status}`);
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
    console.error(`[BotEvent] Failed to update event ${eventId}:`, error);
  }
}

async function processTournamentAnnouncement(event: BotEvent) {
  const config = await getBotConfig();

  if (!config.enableAnnouncements) {
    await sendBotLog({
      title: "Tournament announcement skipped",
      description: "Announcements are disabled from admin bot settings.",
      fields: [{ name: "Event ID", value: event.id, inline: false }],
      color: COLORS.warning,
    });

    return;
  }

  if (!config.announcementChannelId) {
    throw new Error("Missing announcement channel ID");
  }

  const channel = await client.channels.fetch(config.announcementChannelId);

  if (!channel || !channel.isSendable()) {
    throw new Error("Announcement channel was not found or is not sendable.");
  }

  const payload = event.payload;

  const tournamentUrl = String(payload.websiteUrl || SITE_URL);
  const title = pickFirstNonEmpty(payload.title, "Ascendra Tournament");
  const game = cleanLogValue(payload.game);
  const date = formatTournamentDate(payload.date);
  const teamSize = formatTeamSize(payload.teamSize);
  const slots = formatSlots(payload.maxSlots);
  const prize = formatPrize(payload.prize);
  const description = buildTournamentDescription(payload);

  const heroImageUrl = pickFirstNonEmpty(
    payload.bannerImageUrl,
    payload.coverImageUrl,
    payload.imageUrl,
    payload.thumbnailUrl,
  );

  const registration = getRegistrationPresentation(payload.registrationStatus);

  const mainEmbed = new EmbedBuilder()
    .setColor(registration.color)
    .setAuthor({
      name: "Ascendra Tournaments",
      iconURL: BRAND_LOGO_URL,
      url: SITE_URL,
    })
    .setTitle(`🏆 ${title}`)
    .setURL(tournamentUrl)
    .setDescription(
      [
        `${registration.badge}`,
        "",
        description,
        "",
        `> Compete with your team, secure your slot, and follow all tournament updates through Ascendra.`,
      ].join("\n"),
    )
    .setThumbnail(BRAND_LOGO_URL)
    .addFields(
      {
        name: "🎮 Game",
        value: `**${game}**`,
        inline: true,
      },
      {
        name: "👥 Team Size",
        value: `**${teamSize}**`,
        inline: true,
      },
      {
        name: "📦 Slots",
        value: `**${slots}**`,
        inline: true,
      },
      {
        name: "🗓️ Tournament Date",
        value: date,
        inline: false,
      },
      {
        name: "💰 Prize",
        value: `**${prize}**`,
        inline: true,
      },
      {
        name: "📍 Registration",
        value: `**${registration.label}**`,
        inline: true,
      },
    )
    .setFooter({
      text: `${BRAND_FOOTER_TEXT} • ${registration.footerStatus}`,
      iconURL: BRAND_LOGO_URL,
    })
    .setTimestamp();

  if (heroImageUrl) {
    mainEmbed.setImage(heroImageUrl);
  }

  const infoEmbed = new EmbedBuilder()
    .setColor(COLORS.premium)
    .setDescription(
      [
        "**Why join this tournament?**",
        "• Structured competitive environment",
        "• Team-based participation",
        "• Organized updates and tournament flow",
        "• Community-driven Ascendra experience",
      ].join("\n"),
    )
    .setFooter({
      text: "Open the tournament page for full rules, updates, and registration details.",
    });

  const row = buildTournamentButtons(tournamentUrl);

  await channel.send({
    embeds: [mainEmbed, infoEmbed],
    components: [row],
  });

  await sendTournamentLog({
    title: "Tournament announcement sent",
    fields: [
      { name: "Tournament", value: cleanLogValue(payload.title) },
      { name: "Game", value: cleanLogValue(payload.game) },
      { name: "Event ID", value: event.id, inline: false },
    ],
    color: COLORS.success,
  });
}

async function getGuild() {
  if (!GUILD_ID) {
    throw new Error("Missing DISCORD_GUILD_ID");
  }

  return client.guilds.fetch(GUILD_ID);
}

async function findOrCreateRole(roleName: string) {
  const guild = await getGuild();
  const roles = await guild.roles.fetch();

  const existingRole = roles.find((role) => role.name === roleName);

  if (existingRole) {
    return {
      role: existingRole,
      created: false,
    };
  }

  const role = await guild.roles.create({
    name: roleName,
    mentionable: false,
    hoist: false,
    reason: "Tournament team access",
  });

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
    throw new Error("Missing tournament category ID");
  }

  const guild = await getGuild();
  const channels = await guild.channels.fetch();

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
      channel: existingChannel,
      created: false,
    };
  }

  const permissionOverwrites = [
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

  const channel = await guild.channels.create({
    name: params.channelName,
    type: ChannelType.GuildVoice,
    parent: config.tournamentCategoryId,
    permissionOverwrites,
    reason: "Tournament team voice channel",
  });

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

  for (const discordId of params.memberDiscordIds) {
    try {
      const member = await guild.members.fetch(discordId);

      await member.roles.add(params.roleId, "Tournament team access");

      assigned.push(discordId);
    } catch (error) {
      console.error(`Failed to assign role to ${discordId}`, error);
      failed.push(discordId);
    }
  }

  return {
    assigned,
    failed,
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
      const member = await guild.members.fetch(discordId);

      await member.roles.remove(
        params.roleId,
        "Tournament team access removed",
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

async function findTeamVoiceChannel(params: {
  channelId?: string | null;
  channelName?: string | null;
}) {
  const guild = await getGuild();

  if (params.channelId) {
    const channel = await guild.channels
      .fetch(params.channelId)
      .catch(() => null);

    if (channel && channel.type === ChannelType.GuildVoice) {
      return channel;
    }
  }

  if (!params.channelName) {
    return null;
  }

  const channels = await guild.channels.fetch();

  return (
    channels.find((item) => {
      if (!item) {
        return false;
      }

      return (
        item.name === params.channelName && item.type === ChannelType.GuildVoice
      );
    }) || null
  );
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

  await channel.delete("Tournament team access removed");

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
    role = await guild.roles.fetch(params.roleId).catch(() => null);
  }

  if (!role && params.roleName) {
    const roles = await guild.roles.fetch();

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

  await role.delete("Tournament team access removed");

  return {
    deleted: true,
    roleId,
  };
}

async function processTeamAccessCreate(event: BotEvent) {
  const payload = event.payload;
  const config = await getBotConfig();

  if (!config.enableDiscordAccess) {
    throw new Error(
      "Discord access automation is disabled from admin settings.",
    );
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

  await sendTournamentLog({
    title: "Team Discord access created",
    fields: [
      { name: "Team", value: cleanLogValue(payload.teamName) },
      { name: "Game", value: cleanLogValue(payload.game) },
      { name: "Role", value: cleanLogValue(payload.roleName) },
      { name: "Role Created", value: roleResult.created ? "Yes" : "No" },
      { name: "Voice Room", value: cleanLogValue(payload.channelName) },
      { name: "Room Created", value: channelResult.created ? "Yes" : "No" },
      {
        name: "Assigned Members",
        value: String(roleAssignments.assigned.length),
      },
      {
        name: "Failed Assignments",
        value: String(roleAssignments.failed.length),
      },
      { name: "Event ID", value: event.id, inline: false },
    ],
    color: roleAssignments.failed.length > 0 ? COLORS.warning : COLORS.success,
  });

  return {
    roleId: roleResult.role.id,
    channelId: channelResult.channel.id,
    roleCreated: roleResult.created,
    channelCreated: channelResult.created,
    assigned: roleAssignments.assigned,
    failed: roleAssignments.failed,
  };
}

async function processTeamAccessRemove(event: BotEvent) {
  const payload = event.payload;
  const config = await getBotConfig();

  if (!config.enableDiscordAccess) {
    throw new Error(
      "Discord access automation is disabled from admin settings.",
    );
  }

  const roleRemoval = await removeRoleFromMembers({
    roleId: payload.roleId,
    memberDiscordIds: payload.memberDiscordIds || [],
  });

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
      { name: "Room Deleted", value: channelDeletion.deleted ? "Yes" : "No" },
      { name: "Role Deleted", value: roleDeletion.deleted ? "Yes" : "No" },
      { name: "Event ID", value: event.id, inline: false },
    ],
    color: roleRemoval.failed.length > 0 ? COLORS.warning : COLORS.success,
  });

  return {
    roleId: payload.roleId,
    channelId: payload.channelId,
    removed: roleRemoval.removed,
    failed: roleRemoval.failed,
    channelDeleted: channelDeletion.deleted,
    deletedChannelId: channelDeletion.channelId,
    roleDeleted: roleDeletion.deleted,
    deletedRoleId: roleDeletion.roleId,
  };
}

async function processEvent(event: BotEvent) {
  try {
    let result: unknown = null;

    switch (event.type) {
      case "tournament_announcement_create":
        await processTournamentAnnouncement(event);
        break;

      case "team_discord_access_create":
        result = await processTeamAccessCreate(event);
        break;

      case "team_discord_access_remove":
        result = await processTeamAccessRemove(event);
        break;

      default:
        throw new Error(`Unsupported event type: ${event.type}`);
    }

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

    console.log(`[BotEvent] Completed ${event.type}`);
  } catch (error) {
    const message = getErrorMessage(error);

    console.error(`[BotEvent] Failed ${event.type}:`, error);

    await safeUpdateEvent(event.id, {
      status: "failed",
      error: message,
    });

    await sendHeartbeat();

    await sendBotLog({
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

async function pollEvents() {
  if (isShuttingDown) {
    return;
  }

  if (isPolling) {
    console.log(
      "[BotEvent] Poll skipped because previous poll is still running.",
    );
    return;
  }

  isPolling = true;

  try {
    const data = await fetchPendingEvents();
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

    await sendBotLog({
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

client.on(Events.Error, (error) => {
  console.error("[Discord] Client error:", error);
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

  await sendBotLog({
    title: "Unhandled rejection",
    description: getErrorMessage(reason),
    color: COLORS.error,
  });
});

process.on("uncaughtException", async (error) => {
  console.error("[Process] Uncaught exception:", error);

  await sendBotLog({
    title: "Uncaught exception",
    description: getErrorMessage(error),
    color: COLORS.error,
  });

  await shutdown("Uncaught exception");
});

client.login(DISCORD_BOT_TOKEN);

import { loadEnvConfig } from "@next/env";
import {
  ActionRowBuilder,
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
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

const BOT_API_TOKEN = process.env.BOT_API_TOKEN;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const GUILD_ID = process.env.DISCORD_GUILD_ID;

const ANNOUNCEMENT_CHANNEL_ID = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;
const TOURNAMENT_CATEGORY_ID = process.env.DISCORD_TOURNAMENT_CATEGORY_ID;

const BOT_LOG_CHANNEL_ID = process.env.DISCORD_BOT_LOG_CHANNEL_ID;
const TOURNAMENT_LOG_CHANNEL_ID = process.env.DISCORD_TOURNAMENT_LOG_CHANNEL_ID;

const STAFF_ROLE_IDS =
  process.env.DISCORD_TOURNAMENT_STAFF_ROLE_IDS?.split(",")
    .map((id) => id.trim())
    .filter(Boolean) || [];

if (!BOT_API_TOKEN) {
  throw new Error("Missing BOT_API_TOKEN");
}

if (!DISCORD_BOT_TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

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

function cleanLogValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value).slice(0, 900);
}

async function sendDiscordLog(params: {
  channelId?: string;
  title: string;
  description?: string;
  fields?: LogField[];
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
      .setTitle(params.title)
      .setDescription(params.description || null)
      .setTimestamp();

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
}) {
  await sendDiscordLog({
    channelId: BOT_LOG_CHANNEL_ID,
    ...params,
  });
}

async function sendTournamentLog(params: {
  title: string;
  description?: string;
  fields?: LogField[];
}) {
  await sendDiscordLog({
    channelId: TOURNAMENT_LOG_CHANNEL_ID || BOT_LOG_CHANNEL_ID,
    ...params,
  });
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

async function processTournamentAnnouncement(event: BotEvent) {
  if (!ANNOUNCEMENT_CHANNEL_ID) {
    throw new Error("Missing DISCORD_ANNOUNCEMENT_CHANNEL_ID");
  }

  const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);

  if (!channel || !channel.isSendable()) {
    throw new Error("Announcement channel was not found or is not sendable.");
  }

  const payload = event.payload;

  const embed = new EmbedBuilder()
    .setTitle("New Tournament")
    .setDescription(payload.title || "Tournament")
    .addFields(
      {
        name: "Game",
        value: payload.game || "-",
        inline: true,
      },
      {
        name: "Date",
        value: payload.date || "-",
        inline: true,
      },
      {
        name: "Team Size",
        value: String(payload.teamSize || "-"),
        inline: true,
      },
      {
        name: "Slots",
        value: String(payload.maxSlots || "-"),
        inline: true,
      },
      {
        name: "Prize",
        value: payload.prize || "-",
        inline: true,
      },
      {
        name: "Registration",
        value: payload.registrationStatus || "-",
        inline: true,
      },
    )
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("View Tournament")
      .setStyle(ButtonStyle.Link)
      .setURL(payload.websiteUrl || SITE_URL),
  );

  await channel.send({
    embeds: [embed],
    components: [row],
  });

  await sendTournamentLog({
    title: "Tournament announcement sent",
    fields: [
      { name: "Tournament", value: payload.title },
      { name: "Game", value: payload.game },
      { name: "Event ID", value: event.id, inline: false },
    ],
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
  if (!TOURNAMENT_CATEGORY_ID) {
    throw new Error("Missing DISCORD_TOURNAMENT_CATEGORY_ID");
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

  for (const roleId of STAFF_ROLE_IDS) {
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
    parent: TOURNAMENT_CATEGORY_ID,
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
      { name: "Team", value: payload.teamName },
      { name: "Game", value: payload.game },
      { name: "Role", value: payload.roleName },
      { name: "Role Created", value: roleResult.created ? "Yes" : "No" },
      { name: "Voice Room", value: payload.channelName },
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
      { name: "Team", value: payload.teamName },
      { name: "Action", value: payload.action || "removed" },
      {
        name: "Reason",
        value: payload.rejectionReason || "-",
        inline: false,
      },
      { name: "Role", value: payload.roleName || payload.roleId },
      { name: "Voice Room", value: payload.channelName || payload.channelId },
      { name: "Members Removed", value: String(roleRemoval.removed.length) },
      { name: "Failed Removals", value: String(roleRemoval.failed.length) },
      { name: "Room Deleted", value: channelDeletion.deleted ? "Yes" : "No" },
      { name: "Role Deleted", value: roleDeletion.deleted ? "Yes" : "No" },
      { name: "Event ID", value: event.id, inline: false },
    ],
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

    await updateEvent(event.id, {
      status: "completed",
      result,
    });

    await sendBotLog({
      title: "Bot event completed",
      fields: [
        { name: "Type", value: event.type },
        { name: "Event ID", value: event.id, inline: false },
      ],
    });

    console.log(`[BotEvent] Completed ${event.type}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown bot operation error";

    console.error(`[BotEvent] Failed ${event.type}:`, error);

    await updateEvent(event.id, {
      status: "failed",
      error: message,
    });

    await sendBotLog({
      title: "Bot event failed",
      description: message,
      fields: [
        { name: "Type", value: event.type },
        { name: "Event ID", value: event.id, inline: false },
      ],
    });
  }
}

async function pollEvents() {
  try {
    const data = await fetchPendingEvents();
    const events: BotEvent[] = data.events || [];

    for (const event of events) {
      await processEvent(event);
    }
  } catch (error) {
    console.error("[BotEvent] Poll failed:", error);

    await sendBotLog({
      title: "Bot polling failed",
      description:
        error instanceof Error ? error.message : "Unknown polling error",
    });
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot logged in as ${client.user?.tag}`);

  await sendBotLog({
    title: "Bot online",
    fields: [
      { name: "Bot", value: client.user?.tag || "Unknown" },
      { name: "Site", value: SITE_URL },
    ],
  });

  await pollEvents();

  setInterval(async () => {
    await pollEvents();
  }, 15000);
});

client.login(DISCORD_BOT_TOKEN);

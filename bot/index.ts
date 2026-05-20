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

  if (!channel || !("send" in channel)) {
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
    return existingRole;
  }

  return guild.roles.create({
    name: roleName,
    mentionable: false,
    reason: "Tournament team access",
  });
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
      channel.type === ChannelType.GuildText
    );
  });

  if (existingChannel) {
    return existingChannel;
  }

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: params.roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  for (const roleId of STAFF_ROLE_IDS) {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  if (client.user?.id) {
    permissionOverwrites.push({
      id: client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles,
      ],
    });
  }

  return guild.channels.create({
    name: params.channelName,
    type: ChannelType.GuildText,
    parent: TOURNAMENT_CATEGORY_ID,
    permissionOverwrites,
    reason: "Tournament team private channel",
  });
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

async function lockTeamChannel(params: {
  channelId?: string | null;
  channelName?: string | null;
  roleId?: string | null;
}) {
  if (!params.roleId) {
    return {
      locked: false,
    };
  }

  const guild = await getGuild();

  let channel = null;

  if (params.channelId) {
    channel = await guild.channels.fetch(params.channelId);
  }

  if (!channel && params.channelName) {
    const channels = await guild.channels.fetch();

    channel =
      channels.find((item) => {
        if (!item) {
          return false;
        }

        return (
          item.name === params.channelName &&
          item.type === ChannelType.GuildText
        );
      }) || null;
  }

  if (!channel || channel.type !== ChannelType.GuildText) {
    return {
      locked: false,
    };
  }

  await channel.permissionOverwrites.edit(params.roleId, {
    ViewChannel: false,
    SendMessages: false,
  });

  return {
    locked: true,
    channelId: channel.id,
  };
}

async function processTeamAccessCreate(event: BotEvent) {
  const payload = event.payload;

  const role = await findOrCreateRole(payload.roleName);

  const channel = await findOrCreateTeamChannel({
    channelName: payload.channelName,
    roleId: role.id,
  });

  const roleAssignments = await assignRoleToMembers({
    roleId: role.id,
    memberDiscordIds: payload.memberDiscordIds || [],
  });

  return {
    roleId: role.id,
    channelId: channel.id,
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

  const channelLock = await lockTeamChannel({
    channelId: payload.channelId,
    channelName: payload.channelName,
    roleId: payload.roleId,
  });

  return {
    roleId: payload.roleId,
    channelId: payload.channelId,
    removed: roleRemoval.removed,
    failed: roleRemoval.failed,
    channelLocked: channelLock.locked,
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

    console.log(`[BotEvent] Completed ${event.type}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown bot operation error";

    console.error(`[BotEvent] Failed ${event.type}:`, error);

    await updateEvent(event.id, {
      status: "failed",
      error: message,
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
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot logged in as ${client.user?.tag}`);

  await pollEvents();

  setInterval(async () => {
    await pollEvents();
  }, 15000);
});

client.login(DISCORD_BOT_TOKEN);

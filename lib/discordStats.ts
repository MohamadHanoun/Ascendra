import { prisma } from "@/lib/prisma";

export type DiscordBotStatus = "online" | "stale" | "offline";

export type DiscordRoleCount = {
  key: string;
  label: string;
  roleId: string;
  count: number;
  group: "staff" | "community";
};

export type DiscordSlashCommandOption = {
  name: string;
  description: string;
  required: boolean;
  type: string;
};

export type DiscordSlashCommand = {
  name: string;
  description: string;
  options: DiscordSlashCommandOption[];
};

export type DiscordStats = {
  inviteUrl: string | null;
  botStatus: DiscordBotStatus;
  botStatusLabel: string;
  botTag: string | null;
  guildId: string | null;
  uptimeMs: number | null;
  memberCount: number | null;
  onlineCount: number | null;
  roleCounts: DiscordRoleCount[];
  slashCommands: DiscordSlashCommand[];
  lastHeartbeatAt: Date | null;
  lastSyncedAt: Date | null;
};

const heartbeatFreshMs = 90_000;

export const discordRoleDefinitions = [
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
    roleId: process.env.DISCORD_TEAM_CAPTAIN_ROLE_ID || "1506789979190460446",
    group: "community",
  },
] as const;

const settingKeys = [
  "bot.lastHeartbeatAt",
  "bot.tag",
  "bot.guildId",
  "bot.uptimeMs",
  "discord.memberCount",
  "discord.onlineCount",
  "discord.roleCounts",
  "discord.slashCommands",
  "discord.lastSyncedAt",
] as const;

function parseNumber(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseJsonArray(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeRoleCounts(value: string | null | undefined) {
  const roleCounts = parseJsonArray(value);

  return roleCounts
    .map((item): DiscordRoleCount | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const roleId = typeof record.roleId === "string" ? record.roleId : "";
      const definition = discordRoleDefinitions.find(
        (role) => role.roleId === roleId || role.key === record.key,
      );

      if (!definition) {
        return null;
      }

      const count = Number(record.count);

      if (!Number.isFinite(count) || count < 0) {
        return null;
      }

      return {
        key: definition.key,
        label: definition.label,
        roleId: definition.roleId,
        count,
        group: definition.group,
      };
    })
    .filter((item): item is DiscordRoleCount => Boolean(item));
}

function normalizeSlashCommands(value: string | null | undefined) {
  const commands = parseJsonArray(value);

  return commands
    .map((item): DiscordSlashCommand | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const description =
        typeof record.description === "string"
          ? record.description.trim()
          : "";

      if (!name || !description) {
        return null;
      }

      const options = Array.isArray(record.options)
        ? record.options
            .map((option): DiscordSlashCommandOption | null => {
              if (
                !option ||
                typeof option !== "object" ||
                Array.isArray(option)
              ) {
                return null;
              }

              const optionRecord = option as Record<string, unknown>;
              const optionName =
                typeof optionRecord.name === "string"
                  ? optionRecord.name.trim()
                  : "";

              if (!optionName) {
                return null;
              }

              return {
                name: optionName,
                description:
                  typeof optionRecord.description === "string"
                    ? optionRecord.description.trim()
                    : "",
                required: optionRecord.required === true,
                type:
                  typeof optionRecord.type === "string"
                    ? optionRecord.type
                    : "option",
              };
            })
            .filter((option): option is DiscordSlashCommandOption =>
              Boolean(option),
            )
        : [];

      return {
        name,
        description,
        options,
      };
    })
    .filter((item): item is DiscordSlashCommand => Boolean(item));
}

function getBotStatus(lastHeartbeatAt: Date | null): DiscordBotStatus {
  if (!lastHeartbeatAt) {
    return "offline";
  }

  const ageMs = Date.now() - lastHeartbeatAt.getTime();

  return ageMs <= heartbeatFreshMs ? "online" : "stale";
}

function getBotStatusLabel(status: DiscordBotStatus) {
  if (status === "online") {
    return "Online";
  }

  if (status === "stale") {
    return "Stale";
  }

  return "Offline";
}

export async function getDiscordStats(): Promise<DiscordStats> {
  const settings = await prisma.serverSetting.findMany({
    where: {
      key: {
        in: [...settingKeys],
      },
    },
    select: {
      key: true,
      value: true,
    },
  });

  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  const lastHeartbeatAt = parseDate(map.get("bot.lastHeartbeatAt"));
  const botStatus = getBotStatus(lastHeartbeatAt);
  const inviteUrl =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() || null;

  return {
    inviteUrl,
    botStatus,
    botStatusLabel: getBotStatusLabel(botStatus),
    botTag: map.get("bot.tag") || null,
    guildId: map.get("bot.guildId") || null,
    uptimeMs: parseNumber(map.get("bot.uptimeMs")),
    memberCount: parseNumber(map.get("discord.memberCount")),
    onlineCount: parseNumber(map.get("discord.onlineCount")),
    roleCounts: normalizeRoleCounts(map.get("discord.roleCounts")),
    slashCommands: normalizeSlashCommands(map.get("discord.slashCommands")),
    lastHeartbeatAt,
    lastSyncedAt: parseDate(map.get("discord.lastSyncedAt")) ?? lastHeartbeatAt,
  };
}

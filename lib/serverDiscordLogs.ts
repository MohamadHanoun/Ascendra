import "server-only";

import { prisma } from "@/lib/prisma";

const DISCORD_API = "https://discord.com/api/v10";

const ADMIN_ACTION_COLOR = 0xb88746;
const BOT_ERROR_COLOR = 0xb23a48;
const TOURNAMENT_LOG_COLOR = 0xb88746;

type ServerDiscordLogField = {
  name: string;
  value: string | number | null | undefined;
  inline?: boolean;
};

type ServerDiscordLogInput = {
  title: string;
  description?: string;
  fields?: ServerDiscordLogField[];
};

function cleanLogValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value).slice(0, 900);
}

export function getServerLogErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server action error.";
}

async function getLogChannelId(kind: "admin" | "error" | "tournament") {
  const settings = await prisma.serverSetting.findMany({
    where: {
      key: {
        in: [
          "bot.adminActionsLogChannelId",
          "bot.errorLogChannelId",
          "bot.config.botLogChannelId",
          "bot.config.tournamentLogChannelId",
        ],
      },
    },
  });

  const getValue = (key: string) =>
    settings.find((setting) => setting.key === key)?.value.trim() || "";

  if (kind === "admin") {
    return getValue("bot.adminActionsLogChannelId") || getValue("bot.config.botLogChannelId");
  }

  if (kind === "tournament") {
    return getValue("bot.config.tournamentLogChannelId") || getValue("bot.config.botLogChannelId");
  }

  return getValue("bot.errorLogChannelId") || getValue("bot.config.botLogChannelId");
}

async function sendServerDiscordLog(
  kind: "admin" | "error" | "tournament",
  input: ServerDiscordLogInput,
) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN?.trim();

    if (!token) {
      return;
    }

    const channelId = await getLogChannelId(kind);

    if (!channelId) {
      return;
    }

    const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            color:
              kind === "error"
                ? BOT_ERROR_COLOR
                : kind === "tournament"
                  ? TOURNAMENT_LOG_COLOR
                  : ADMIN_ACTION_COLOR,
            title: input.title.slice(0, 256),
            description: input.description?.slice(0, 3900) || undefined,
            fields: input.fields?.slice(0, 12).map((field) => ({
              name: field.name.slice(0, 256),
              value: cleanLogValue(field.value),
              inline: field.inline ?? true,
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[ServerDiscordLog] Discord log send failed:", response.status);
    }
  } catch (error) {
    console.error("[ServerDiscordLog] Failed:", error);
  }
}

export async function logServerAdminAction(input: ServerDiscordLogInput) {
  await sendServerDiscordLog("admin", input);
}

export async function logServerBotError(input: ServerDiscordLogInput) {
  await sendServerDiscordLog("error", input);
}

export async function logServerTournamentAction(input: ServerDiscordLogInput) {
  await sendServerDiscordLog("tournament", input);
}

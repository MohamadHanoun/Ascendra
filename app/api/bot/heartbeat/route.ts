import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { cleanupOldRealtimeEvents, createRealtimeEvent } from "@/lib/realtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");

  return token === process.env.BOT_API_TOKEN;
}

async function upsertSetting(key: string, value: string, description: string) {
  await prisma.serverSetting.upsert({
    where: {
      key,
    },
    update: {
      value,
      description,
    },
    create: {
      key,
      value,
      description,
    },
  });
}

function getSafeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}

function getDiscordPayload(body: Record<string, unknown>) {
  const discord = body.discord;

  if (!discord || typeof discord !== "object" || Array.isArray(discord)) {
    return {};
  }

  return discord as Record<string, unknown>;
}

function getSafeRoleCounts(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const count = getSafeNumber(record.count);
      const roleId = String(record.roleId || "").trim();
      const key = String(record.key || "").trim();
      const label = String(record.label || "").trim();
      const group = String(record.group || "").trim();

      if (count === null || !roleId || !key || !label) {
        return null;
      }

      return {
        key,
        label,
        roleId,
        group,
        count,
      };
    })
    .filter(Boolean);
}

function getSafeSlashCommands(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = String(record.name || "").trim();
      const description = String(record.description || "").trim();

      if (!name || !description) {
        return null;
      }

      const options = Array.isArray(record.options)
        ? record.options
            .map((option) => {
              if (
                !option ||
                typeof option !== "object" ||
                Array.isArray(option)
              ) {
                return null;
              }

              const optionRecord = option as Record<string, unknown>;
              const optionName = String(optionRecord.name || "").trim();

              if (!optionName) {
                return null;
              }

              return {
                name: optionName,
                description: String(optionRecord.description || "").trim(),
                required: optionRecord.required === true,
                type: String(optionRecord.type || "option").trim(),
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

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const discord = getDiscordPayload(body);
  const memberCount = getSafeNumber(discord.memberCount);
  const onlineCount = getSafeNumber(discord.onlineCount);
  const roleCounts = getSafeRoleCounts(discord.roleCounts);
  const slashCommands = getSafeSlashCommands(discord.slashCommands);

  const now = new Date();

  await cleanupOldRealtimeEvents();

  const settings = [
    upsertSetting(
      "bot.lastHeartbeatAt",
      now.toISOString(),
      "Last time the Discord bot reported it was online.",
    ),
    upsertSetting(
      "bot.tag",
      String(body.botTag || "Unknown"),
      "Discord bot username and discriminator.",
    ),
    upsertSetting(
      "bot.guildId",
      String(body.guildId || process.env.DISCORD_GUILD_ID || ""),
      "Discord guild currently used by the bot.",
    ),
    upsertSetting(
      "bot.uptimeMs",
      String(body.uptimeMs || 0),
      "Current bot process uptime in milliseconds.",
    ),
    upsertSetting(
      "discord.lastSyncedAt",
      now.toISOString(),
      "Last time Discord public stats were synced from the bot.",
    ),
    upsertSetting(
      "discord.roleCounts",
      JSON.stringify(roleCounts),
      "Public-safe Discord role member counts from the bot.",
    ),
    upsertSetting(
      "discord.slashCommands",
      JSON.stringify(slashCommands),
      "Public-safe Discord slash command list from the bot.",
    ),
  ];

  settings.push(
    upsertSetting(
      "discord.memberCount",
      memberCount === null ? "" : String(memberCount),
      "Discord guild member count from the bot when available.",
    ),
    upsertSetting(
      "discord.onlineCount",
      onlineCount === null ? "" : String(onlineCount),
      "Discord online member count from the bot when available.",
    ),
  );

  await Promise.all(settings);

  await createRealtimeEvent({
    type: "bot.heartbeat",
    audience: "admin",
    entityType: "bot",
    entityId: "discord-bot",
    payload: {
      botTag: String(body.botTag || "Unknown"),
      guildId: String(body.guildId || process.env.DISCORD_GUILD_ID || ""),
      uptimeMs: String(body.uptimeMs || 0),
      heartbeatAt: now.toISOString(),
      discordSyncedAt: now.toISOString(),
    },
  });

  return NextResponse.json({
    ok: true,
    heartbeatAt: now.toISOString(),
  });
}

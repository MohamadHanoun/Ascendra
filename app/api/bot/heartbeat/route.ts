import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

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

  const body = await request.json().catch(() => ({}));

  const now = new Date();

  await Promise.all([
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
  ]);

  return NextResponse.json({
    ok: true,
    heartbeatAt: now.toISOString(),
  });
}

import { NextRequest, NextResponse } from "next/server";

import { isBotAuthorized } from "@/lib/botAuth";
import { createRealtimeEvent } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SlashCommandLogBody = {
  commandName?: string;
  status?: "completed" | "failed";
  userId?: string;
  userTag?: string;
  guildId?: string | null;
  channelId?: string | null;
  location?: string;
  options?: string;
  error?: string;
  latencyMs?: number;
};


function cleanValue(value: unknown, fallback = "-") {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, 900);
}

function cleanCommandName(value: unknown) {
  const normalized = String(value || "")
    .trim()
    .replace(/^\//, "");

  if (!normalized) {
    return "unknown";
  }

  return normalized.slice(0, 80);
}

function cleanStatus(value: unknown): "completed" | "failed" {
  return value === "failed" ? "failed" : "completed";
}

export async function POST(request: NextRequest) {
  if (!isBotAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const body = (await request.json().catch(() => ({}))) as SlashCommandLogBody;

  const commandName = cleanCommandName(body.commandName);
  const status = cleanStatus(body.status);
  const userId = cleanValue(body.userId, "unknown");
  const userTag = cleanValue(body.userTag, "Unknown user");
  const guildId = body.guildId ? cleanValue(body.guildId) : null;
  const channelId = body.channelId ? cleanValue(body.channelId) : null;
  const location = cleanValue(body.location);
  const options = cleanValue(body.options);
  const error =
    status === "failed" ? cleanValue(body.error, "Unknown error") : null;
  const latencyMs = Number.isFinite(Number(body.latencyMs))
    ? Math.max(0, Math.floor(Number(body.latencyMs)))
    : null;

  const event = await prisma.botEvent.create({
    data: {
      type: status === "failed" ? "slash_command_failed" : "slash_command_used",
      status,
      priority: 0,
      attempts: 0,
      maxAttempts: 1,
      entityType: "slash_command",
      entityId: commandName,
      payload: {
        commandName,
        userId,
        userTag,
        guildId,
        channelId,
        location,
        options,
      },
      result: {
        latencyMs,
      },
      error,
      processedAt: new Date(),
    },
  });

  await createRealtimeEvent({
    type: status === "failed" ? "slashCommand.failed" : "slashCommand.used",
    audience: "admin",
    entityType: "botEvent",
    entityId: event.id,
    payload: {
      id: event.id,
      commandName,
      status,
      userId,
      userTag,
      location,
      latencyMs,
    },
  });

  return NextResponse.json({
    success: true,
    eventId: event.id,
  });
}

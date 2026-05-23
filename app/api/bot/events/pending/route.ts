import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createRealtimeEvent } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 3;
const EVENTS_PER_POLL = 3;
const STALE_PROCESSING_SECONDS = 45;

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");

  return token === process.env.BOT_API_TOKEN;
}

function getStaleProcessingDate() {
  const date = new Date();

  date.setSeconds(date.getSeconds() - STALE_PROCESSING_SECONDS);

  return date;
}

async function isQueuePaused() {
  const setting = await prisma.serverSetting.findUnique({
    where: {
      key: "bot.queue.paused",
    },
  });

  return setting?.value === "true";
}

async function publishQueueUpdate(type: string, count: number) {
  if (count <= 0) {
    return;
  }

  await createRealtimeEvent({
    type,
    audience: "admin",
    entityType: "botEvent",
    entityId: "queue",
    payload: {
      count,
    },
  });
}

async function recoverStaleProcessingEvents() {
  const staleDate = getStaleProcessingDate();

  const recovered = await prisma.botEvent.updateMany({
    where: {
      status: "processing",
      lockedAt: {
        lt: staleDate,
      },
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
    data: {
      status: "queued",
      lockedAt: null,
      processedAt: null,
      error: "Recovered from stale processing state.",
    },
  });

  const failed = await prisma.botEvent.updateMany({
    where: {
      status: "processing",
      lockedAt: {
        lt: staleDate,
      },
      attempts: {
        gte: MAX_ATTEMPTS,
      },
    },
    data: {
      status: "failed",
      lockedAt: null,
      processedAt: new Date(),
      error: "Failed after repeated processing timeouts.",
    },
  });

  await publishQueueUpdate("bot.events.recovered", recovered.count);
  await publishQueueUpdate("bot.events.failed", failed.count);
}

export async function GET(request: Request) {
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

  if (await isQueuePaused()) {
    return NextResponse.json({
      ok: true,
      paused: true,
      count: 0,
      events: [],
    });
  }

  await recoverStaleProcessingEvents();

  const events = await prisma.botEvent.findMany({
    where: {
      status: {
        in: ["queued", "failed"],
      },
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
    orderBy: [
      {
        priority: "desc",
      },
      {
        createdAt: "asc",
      },
    ],
    take: EVENTS_PER_POLL,
  });

  if (events.length === 0) {
    return NextResponse.json({
      ok: true,
      paused: false,
      count: 0,
      events: [],
    });
  }

  const eventIds = events.map((event) => event.id);

  await prisma.botEvent.updateMany({
    where: {
      id: {
        in: eventIds,
      },
      status: {
        in: ["queued", "failed"],
      },
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
    data: {
      status: "processing",
      lockedAt: new Date(),
      attempts: {
        increment: 1,
      },
      error: null,
    },
  });

  const lockedEvents = await prisma.botEvent.findMany({
    where: {
      id: {
        in: eventIds,
      },
      status: "processing",
    },
    orderBy: [
      {
        priority: "desc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  await createRealtimeEvent({
    type: "bot.events.locked",
    audience: "admin",
    entityType: "botEvent",
    entityId: "queue",
    payload: {
      count: lockedEvents.length,
    },
  });

  return NextResponse.json({
    ok: true,
    paused: false,
    count: lockedEvents.length,
    events: lockedEvents,
  });
}

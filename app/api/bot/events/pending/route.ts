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

  const events = await prisma.botEvent.findMany({
    where: {
      status: {
        in: ["queued", "failed"],
      },
      attempts: {
        lt: 3,
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
    take: 5,
  });

  if (events.length === 0) {
    return NextResponse.json({
      ok: true,
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

  return NextResponse.json({
    ok: true,
    count: lockedEvents.length,
    events: lockedEvents,
  });
}

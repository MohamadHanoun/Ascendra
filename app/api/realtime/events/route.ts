import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter(30, 60_000);

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeAudience(value: string | null) {
  if (value === "admin") {
    return "admin";
  }

  return "public";
}

export async function GET(request: Request) {
  const limited = rateLimiter(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);

  const audience = normalizeAudience(searchParams.get("audience"));
  const after = parseDate(searchParams.get("after"));

  if (audience === "admin") {
    const session = await auth();

    if (!session?.user?.isAdmin) {
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
  }

  const events = await prisma.realtimeEvent.findMany({
    where: {
      audience,
      ...(after
        ? {
            createdAt: {
              gt: after,
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 50,
  });

  const latestEvent = events.at(-1);

  return NextResponse.json({
    ok: true,
    count: events.length,
    cursor:
      latestEvent?.createdAt.toISOString() ||
      after?.toISOString() ||
      new Date().toISOString(),
    events,
  });
}

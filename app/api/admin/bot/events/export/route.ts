import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedBotStatuses = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

type BotStatusFilter = (typeof allowedBotStatuses)[number] | "all";

function normalizeStatusFilter(value?: string | null): BotStatusFilter {
  if (
    value &&
    allowedBotStatuses.includes(value as (typeof allowedBotStatuses)[number])
  ) {
    return value as BotStatusFilter;
  }

  return "all";
}

function normalizeTypeFilter(value?: string | null) {
  return value && value !== "all" ? value.slice(0, 120) : "all";
}

function buildEventWhere(params: {
  statusFilter: BotStatusFilter;
  typeFilter: string;
}): Prisma.BotEventWhereInput {
  return {
    ...(params.typeFilter !== "all"
      ? {
          type: params.typeFilter,
        }
      : {}),
    ...(params.statusFilter !== "all"
      ? {
          status: params.statusFilter,
        }
      : {}),
  };
}

function csvEscape(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n|\r/g, " ");
  const escaped = text.replace(/"/g, '""');

  return `"${escaped}"`;
}

function formatJson(value: unknown) {
  if (!value) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function formatDate(value: Date | null) {
  return value ? value.toISOString() : "";
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
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

  const statusFilter = normalizeStatusFilter(
    request.nextUrl.searchParams.get("botStatus"),
  );
  const typeFilter = normalizeTypeFilter(
    request.nextUrl.searchParams.get("botType"),
  );

  const events = await prisma.botEvent.findMany({
    where: buildEventWhere({
      statusFilter,
      typeFilter,
    }),
    orderBy: {
      createdAt: "desc",
    },
    take: 1000,
  });

  const headers = [
    "id",
    "createdAt",
    "updatedAt",
    "processedAt",
    "lockedAt",
    "type",
    "status",
    "priority",
    "attempts",
    "maxAttempts",
    "entityType",
    "entityId",
    "error",
    "payload",
    "result",
  ];

  const rows = events.map((event) =>
    [
      event.id,
      formatDate(event.createdAt),
      formatDate(event.updatedAt),
      formatDate(event.processedAt),
      formatDate(event.lockedAt),
      event.type,
      event.status,
      event.priority,
      event.attempts,
      event.maxAttempts,
      event.entityType || "",
      event.entityId || "",
      event.error || "",
      formatJson(event.payload),
      formatJson(event.result),
    ].map(csvEscape),
  );

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const fileName = `ascendra-bot-events-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

const commandLogWhere: Prisma.BotEventWhereInput = {
  OR: [
    {
      type: "slash_command_used",
    },
    {
      type: "slash_command_failed",
    },
    {
      entityType: "slash_command",
    },
  ],
};

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
}

function getStringValue(record: JsonRecord, key: string, fallback = "-") {
  const value = record[key];

  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();

  return normalized || fallback;
}

function getNumberValue(record: JsonRecord, key: string) {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function normalizeStatusFilter(value?: string | null) {
  if (value === "completed" || value === "failed") {
    return value;
  }

  return "all";
}

function normalizeTextFilter(value?: string | null) {
  return String(value || "")
    .trim()
    .slice(0, 80);
}

function buildWhere(params: {
  statusFilter: string;
  commandFilter: string;
}): Prisma.BotEventWhereInput {
  const filters: Prisma.BotEventWhereInput[] = [commandLogWhere];

  if (params.statusFilter !== "all") {
    filters.push({
      status: params.statusFilter,
    });
  }

  if (params.commandFilter) {
    filters.push({
      entityId: {
        contains: params.commandFilter.replace(/^\//, ""),
        mode: "insensitive",
      },
    });
  }

  return {
    AND: filters,
  };
}

function matchesUserFilter(
  log: {
    payload: Prisma.JsonValue;
  },
  userFilter: string,
) {
  if (!userFilter) {
    return true;
  }

  const payload = asRecord(log.payload);
  const search = userFilter.toLowerCase();

  const userTag = getStringValue(payload, "userTag").toLowerCase();
  const userId = getStringValue(payload, "userId").toLowerCase();
  const location = getStringValue(payload, "location").toLowerCase();

  return (
    userTag.includes(search) ||
    userId.includes(search) ||
    location.includes(search)
  );
}

function csvEscape(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n|\r/g, " ");
  const escaped = text.replace(/"/g, '""');

  return `"${escaped}"`;
}

function formatDate(value: Date) {
  return value.toISOString();
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
    request.nextUrl.searchParams.get("commandStatus"),
  );
  const commandFilter = normalizeTextFilter(
    request.nextUrl.searchParams.get("commandName"),
  );
  const userFilter = normalizeTextFilter(
    request.nextUrl.searchParams.get("commandUser"),
  );

  const logs = await prisma.botEvent.findMany({
    where: buildWhere({
      statusFilter,
      commandFilter,
    }),
    orderBy: {
      createdAt: "desc",
    },
    take: 1000,
  });

  const filteredLogs = logs.filter((log) => matchesUserFilter(log, userFilter));

  const headers = [
    "createdAt",
    "commandName",
    "status",
    "userTag",
    "userId",
    "guildId",
    "channelId",
    "location",
    "options",
    "latencyMs",
    "error",
  ];

  const rows = filteredLogs.map((log) => {
    const payload = asRecord(log.payload);
    const result = asRecord(log.result);

    const commandName =
      getStringValue(payload, "commandName", log.entityId || "-") || "-";
    const latencyMs = getNumberValue(result, "latencyMs");

    return [
      formatDate(log.createdAt),
      commandName,
      log.status,
      getStringValue(payload, "userTag"),
      getStringValue(payload, "userId"),
      getStringValue(payload, "guildId"),
      getStringValue(payload, "channelId"),
      getStringValue(payload, "location"),
      getStringValue(payload, "options"),
      latencyMs ?? "",
      log.error || "",
    ].map(csvEscape);
  });

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const fileName = `ascendra-command-logs-${new Date()
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

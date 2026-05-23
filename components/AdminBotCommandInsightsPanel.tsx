import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type JsonRecord = Record<string, unknown>;

type CommandStat = {
  commandName: string;
  total: number;
  failed: number;
  completed: number;
  averageLatencyMs: number | null;
};

type SlowCommand = {
  id: string;
  commandName: string;
  userTag: string;
  location: string;
  latencyMs: number;
  createdAt: Date;
};

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatLatency(value: number | null) {
  if (value === null) {
    return "-";
  }

  if (value < 1000) {
    return `${value}ms`;
  }

  return `${(value / 1000).toFixed(2)}s`;
}

function getCommandName(log: {
  entityId: string | null;
  payload: Prisma.JsonValue;
}) {
  const payload = asRecord(log.payload);
  const commandName = getStringValue(
    payload,
    "commandName",
    log.entityId || "-",
  );

  return commandName.replace(/^\//, "") || "-";
}

function getAverageLatency(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return Math.round(total / values.length);
}

function buildCommandStats(
  logs: Array<{
    status: string;
    entityId: string | null;
    payload: Prisma.JsonValue;
    result: Prisma.JsonValue | null;
  }>,
) {
  const map = new Map<
    string,
    {
      total: number;
      failed: number;
      completed: number;
      latencies: number[];
    }
  >();

  for (const log of logs) {
    const commandName = getCommandName(log);
    const result = asRecord(log.result);
    const latencyMs = getNumberValue(result, "latencyMs");

    const current = map.get(commandName) || {
      total: 0,
      failed: 0,
      completed: 0,
      latencies: [],
    };

    current.total += 1;

    if (log.status === "failed") {
      current.failed += 1;
    } else {
      current.completed += 1;
    }

    if (latencyMs !== null) {
      current.latencies.push(latencyMs);
    }

    map.set(commandName, current);
  }

  const stats: CommandStat[] = Array.from(map.entries()).map(
    ([commandName, value]) => ({
      commandName,
      total: value.total,
      failed: value.failed,
      completed: value.completed,
      averageLatencyMs: getAverageLatency(value.latencies),
    }),
  );

  return stats;
}

function buildSlowCommands(
  logs: Array<{
    id: string;
    entityId: string | null;
    payload: Prisma.JsonValue;
    result: Prisma.JsonValue | null;
    createdAt: Date;
  }>,
) {
  const slowCommands: SlowCommand[] = [];

  for (const log of logs) {
    const payload = asRecord(log.payload);
    const result = asRecord(log.result);
    const latencyMs = getNumberValue(result, "latencyMs");

    if (latencyMs === null) {
      continue;
    }

    slowCommands.push({
      id: log.id,
      commandName: getCommandName(log),
      userTag: getStringValue(payload, "userTag"),
      location: getStringValue(payload, "location"),
      latencyMs,
      createdAt: log.createdAt,
    });
  }

  return slowCommands.sort((a, b) => b.latencyMs - a.latencyMs).slice(0, 8);
}

function getFailureRate(total: number, failed: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((failed / total) * 100)}%`;
}

export default async function AdminBotCommandInsightsPanel() {
  const now = new Date();
  const last24Hours = new Date(now);
  const last7Days = new Date(now);

  last24Hours.setHours(last24Hours.getHours() - 24);
  last7Days.setDate(last7Days.getDate() - 7);

  const [
    recentLogs,
    last24HoursCount,
    last7DaysCount,
    last24HoursFailedCount,
    last7DaysFailedCount,
  ] = await Promise.all([
    prisma.botEvent.findMany({
      where: commandLogWhere,
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
      select: {
        id: true,
        status: true,
        entityId: true,
        payload: true,
        result: true,
        createdAt: true,
      },
    }),
    prisma.botEvent.count({
      where: {
        AND: [
          commandLogWhere,
          {
            createdAt: {
              gte: last24Hours,
            },
          },
        ],
      },
    }),
    prisma.botEvent.count({
      where: {
        AND: [
          commandLogWhere,
          {
            createdAt: {
              gte: last7Days,
            },
          },
        ],
      },
    }),
    prisma.botEvent.count({
      where: {
        AND: [
          commandLogWhere,
          {
            status: "failed",
          },
          {
            createdAt: {
              gte: last24Hours,
            },
          },
        ],
      },
    }),
    prisma.botEvent.count({
      where: {
        AND: [
          commandLogWhere,
          {
            status: "failed",
          },
          {
            createdAt: {
              gte: last7Days,
            },
          },
        ],
      },
    }),
  ]);

  const commandStats = buildCommandStats(recentLogs);
  const topCommands = [...commandStats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const failingCommands = [...commandStats]
    .filter((command) => command.failed > 0)
    .sort((a, b) => b.failed - a.failed)
    .slice(0, 8);

  const slowCommands = buildSlowCommands(recentLogs);

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
            Command Insights
          </p>

          <h2 className="text-3xl font-black text-white">
            Slash Command Analytics
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Monitor command activity, failures, and slow responses based on the
            latest stored Discord slash command logs.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-bold text-gray-400">Last 24 Hours</p>
            <p className="mt-2 text-3xl font-black text-white">
              {last24HoursCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
            <p className="text-sm font-bold text-red-200">Failed 24 Hours</p>
            <p className="mt-2 text-3xl font-black text-white">
              {last24HoursFailedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5">
            <p className="text-sm font-bold text-violet-200">Last 7 Days</p>
            <p className="mt-2 text-3xl font-black text-white">
              {last7DaysCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
            <p className="text-sm font-bold text-red-200">Failed 7 Days</p>
            <p className="mt-2 text-3xl font-black text-white">
              {last7DaysFailedCount}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <div className="mb-5">
            <h3 className="text-xl font-black text-white">Top Commands</h3>
            <p className="mt-1 text-sm text-gray-400">
              Most used commands from the latest {recentLogs.length} logs.
            </p>
          </div>

          {topCommands.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-400">
              No command usage found yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {topCommands.map((command, index) => (
                <div
                  key={command.commandName}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-violet-200">
                        #{index + 1} /{command.commandName}
                      </p>
                      <p className="mt-1 text-xs font-bold text-gray-500">
                        Failure rate:{" "}
                        {getFailureRate(command.total, command.failed)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-white">
                        {command.total}
                      </p>
                      <p className="text-xs font-bold text-gray-500">
                        Avg {formatLatency(command.averageLatencyMs)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <div className="mb-5">
            <h3 className="text-xl font-black text-white">Failing Commands</h3>
            <p className="mt-1 text-sm text-gray-400">
              Commands with the highest number of failures.
            </p>
          </div>

          {failingCommands.length === 0 ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-200">
              No failing commands found.
            </div>
          ) : (
            <div className="grid gap-3">
              {failingCommands.map((command) => (
                <div
                  key={command.commandName}
                  className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-red-100">
                        /{command.commandName}
                      </p>
                      <p className="mt-1 text-xs font-bold text-red-200/80">
                        {command.completed} completed · {command.failed} failed
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-white">
                        {command.failed}
                      </p>
                      <p className="text-xs font-bold text-red-200/80">
                        {getFailureRate(command.total, command.failed)} failed
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
        <div className="mb-5">
          <h3 className="text-xl font-black text-white">Slowest Commands</h3>
          <p className="mt-1 text-sm text-gray-400">
            Highest response times from recent command logs.
          </p>
        </div>

        {slowCommands.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-400">
            No latency data available yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {slowCommands.map((command) => (
              <div
                key={command.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
                  <div>
                    <p className="text-sm font-black text-violet-200">
                      /{command.commandName}
                    </p>
                    <p className="mt-1 text-xs font-bold text-gray-500">
                      {formatDate(command.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                      User
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-gray-300">
                      {command.userTag}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                      Location
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-gray-300">
                      {command.location}
                    </p>
                  </div>

                  <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-right">
                    <p className="text-sm font-black text-white">
                      {formatLatency(command.latencyMs)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

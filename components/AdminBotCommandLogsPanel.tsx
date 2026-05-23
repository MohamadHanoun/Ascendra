import type { Prisma } from "@prisma/client";
import Link from "next/link";
import AdminConfirmSubmitButton from "@/components/AdminConfirmSubmitButton";
import {
  deleteFailedSlashCommandLogsInline,
  deleteOldSlashCommandLogsInline,
} from "@/actions/adminBotCommandLogActions";
import { prisma } from "@/lib/prisma";

type AdminBotCommandLogsPanelProps = {
  statusFilter?: string;
  commandFilter?: string;
  userFilter?: string;
};

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function normalizeStatusFilter(value?: string) {
  if (value === "completed" || value === "failed") {
    return value;
  }

  return "all";
}

function normalizeTextFilter(value?: string) {
  return String(value || "")
    .trim()
    .slice(0, 80);
}

function getStatusClass(status: string) {
  if (status === "failed") {
    return "border-red-400/25 bg-red-500/10 text-red-200";
  }

  return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
}

function getStatusLabel(status: string) {
  if (status === "failed") {
    return "Failed";
  }

  return "Completed";
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

export default async function AdminBotCommandLogsPanel({
  statusFilter,
  commandFilter,
  userFilter,
}: AdminBotCommandLogsPanelProps) {
  const normalizedStatus = normalizeStatusFilter(statusFilter);
  const normalizedCommand = normalizeTextFilter(commandFilter);
  const normalizedUser = normalizeTextFilter(userFilter);

  const filteredWhere = buildWhere({
    statusFilter: normalizedStatus,
    commandFilter: normalizedCommand,
  });

  const [rawLogs, totalCount, completedCount, failedCount] = await Promise.all([
    prisma.botEvent.findMany({
      where: filteredWhere,
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
    prisma.botEvent.count({
      where: commandLogWhere,
    }),
    prisma.botEvent.count({
      where: {
        AND: [
          commandLogWhere,
          {
            status: "completed",
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
        ],
      },
    }),
  ]);

  const filteredLogs = rawLogs.filter((log) =>
    matchesUserFilter(log, normalizedUser),
  );

  const logs = filteredLogs.slice(0, 25);

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Discord Commands
            </p>

            <h2 className="text-3xl font-black text-white">
              Slash Command Logs
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              Review command usage, failures, location, options, and response
              time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <form action={deleteOldSlashCommandLogsInline}>
              <input type="hidden" name="days" value="30" />

              <AdminConfirmSubmitButton
                label="Clean 30+ days"
                confirmTitle="Clean old command logs?"
                confirmDescription="This will permanently delete command logs older than 30 days. Recent logs will remain available."
                confirmLabel="Clean"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
              />
            </form>

            <form action={deleteFailedSlashCommandLogsInline}>
              <AdminConfirmSubmitButton
                label="Delete failed logs"
                danger
                confirmTitle="Delete failed command logs?"
                confirmDescription="This will permanently delete all failed command logs. Use this only if you already reviewed the errors."
                confirmLabel="Delete"
                className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/15 hover:text-white"
              />
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-bold text-gray-400">Total Logs</p>
            <p className="mt-2 text-3xl font-black text-white">{totalCount}</p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <p className="text-sm font-bold text-emerald-200">Completed</p>
            <p className="mt-2 text-3xl font-black text-white">
              {completedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
            <p className="text-sm font-bold text-red-200">Failed</p>
            <p className="mt-2 text-3xl font-black text-white">{failedCount}</p>
          </div>

          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5">
            <p className="text-sm font-bold text-violet-200">Filtered</p>
            <p className="mt-2 text-3xl font-black text-white">
              {filteredLogs.length}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
        <div className="mb-5">
          <h3 className="text-xl font-black text-white">Filters</h3>
          <p className="mt-1 text-sm text-gray-400">
            Filter command logs by status, command name, user, user ID, or
            channel.
          </p>
        </div>

        <form
          className="grid gap-4 lg:grid-cols-[180px_1fr_1fr_auto_auto]"
          action="/admin/bot"
        >
          <input type="hidden" name="botSection" value="commands" />

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
              Status
            </span>

            <select
              name="commandStatus"
              defaultValue={normalizedStatus}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-violet-400"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
              Command
            </span>

            <input
              name="commandName"
              defaultValue={normalizedCommand}
              placeholder="ping, tournaments, team..."
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
              User / Channel
            </span>

            <input
              name="commandUser"
              defaultValue={normalizedUser}
              placeholder="username, user ID, channel..."
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
            >
              Apply
            </button>
          </div>

          <div className="flex items-end">
            <Link
              href="/admin/bot?botSection=commands"
              className="w-full rounded-2xl border border-white/10 px-5 py-3 text-center text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-white">Latest Commands</h3>
            <p className="mt-1 text-sm text-gray-400">
              Showing latest {logs.length} command logs.
            </p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-gray-400">
            No slash command logs found.
          </div>
        ) : (
          <div className="grid gap-4">
            {logs.map((log) => {
              const payload = asRecord(log.payload);
              const result = asRecord(log.result);

              const commandName =
                getStringValue(payload, "commandName", log.entityId || "-") ||
                "-";
              const userTag = getStringValue(payload, "userTag");
              const userId = getStringValue(payload, "userId");
              const location = getStringValue(payload, "location");
              const options = getStringValue(payload, "options");
              const latencyMs = getNumberValue(result, "latencyMs");

              return (
                <article
                  key={log.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-xl bg-violet-500/15 px-3 py-1 text-sm font-black text-violet-200">
                        /{commandName}
                      </span>

                      <span
                        className={`rounded-xl border px-3 py-1 text-xs font-black ${getStatusClass(
                          log.status,
                        )}`}
                      >
                        {getStatusLabel(log.status)}
                      </span>

                      <span className="text-xs font-bold text-gray-500">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="font-black text-gray-500">User</p>
                        <p className="mt-1 break-words text-gray-200">
                          {userTag}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-gray-500">User ID</p>
                        <p className="mt-1 break-words text-gray-300">
                          {userId}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-gray-500">Location</p>
                        <p className="mt-1 break-words text-gray-300">
                          {location}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-gray-500">Latency</p>
                        <p className="mt-1 text-gray-300">
                          {formatLatency(latencyMs)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-gray-500">
                        Options
                      </p>
                      <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-300">
                        {options}
                      </pre>
                    </div>

                    {log.error && (
                      <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-red-200">
                          Error
                        </p>
                        <p className="break-words text-sm leading-6 text-red-100">
                          {log.error}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

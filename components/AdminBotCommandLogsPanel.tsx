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
  page?: string;
};

type JsonRecord = Record<string, unknown>;

const commandLogWhere: Prisma.BotEventWhereInput = {
  OR: [
    { type: "slash_command_used" },
    { type: "slash_command_failed" },
    { entityType: "slash_command" },
  ],
};

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function getStringValue(record: JsonRecord, key: string, fallback = "-") {
  const value = record[key];
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
}

function getNumberValue(record: JsonRecord, key: string) {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function normalizeStatusFilter(value?: string) {
  if (value === "completed" || value === "failed") return value;
  return "all";
}

function normalizeTextFilter(value?: string) {
  return String(value || "").trim().slice(0, 80);
}

function getStatusStyle(status: string): React.CSSProperties {
  if (status === "failed") return { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" };
  return { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" };
}

function getStatusLabel(status: string) {
  return status === "failed" ? "Failed" : "Completed";
}

function formatLatency(value: number | null) {
  if (value === null) return "-";
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(2)}s`;
}

function buildWhere(params: { statusFilter: string; commandFilter: string }): Prisma.BotEventWhereInput {
  const filters: Prisma.BotEventWhereInput[] = [commandLogWhere];
  if (params.statusFilter !== "all") filters.push({ status: params.statusFilter });
  if (params.commandFilter) filters.push({ entityId: { contains: params.commandFilter.replace(/^\//, ""), mode: "insensitive" } });
  return { AND: filters };
}

function matchesUserFilter(log: { payload: Prisma.JsonValue }, userFilter: string) {
  if (!userFilter) return true;
  const payload = asRecord(log.payload);
  const search = userFilter.toLowerCase();
  return (
    getStringValue(payload, "userTag").toLowerCase().includes(search) ||
    getStringValue(payload, "userId").toLowerCase().includes(search) ||
    getStringValue(payload, "location").toLowerCase().includes(search)
  );
}

function buildExportHref(params: { statusFilter: string; commandFilter: string; userFilter: string }) {
  const searchParams = new URLSearchParams();
  if (params.statusFilter !== "all") searchParams.set("commandStatus", params.statusFilter);
  if (params.commandFilter) searchParams.set("commandName", params.commandFilter);
  if (params.userFilter) searchParams.set("commandUser", params.userFilter);
  const query = searchParams.toString();
  return query ? `/api/admin/bot/command-logs/export?${query}` : "/api/admin/bot/command-logs/export";
}

function normalizePage(value?: string) {
  const page = Number(value || 1);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function buildCommandLogsHref(params: { statusFilter: string; commandFilter: string; userFilter: string; page: number }) {
  const searchParams = new URLSearchParams({ botSection: "commands" });
  if (params.statusFilter !== "all") searchParams.set("commandStatus", params.statusFilter);
  if (params.commandFilter) searchParams.set("commandName", params.commandFilter);
  if (params.userFilter) searchParams.set("commandUser", params.userFilter);
  if (params.page > 1) searchParams.set("commandPage", String(params.page));
  return `/admin/bot?${searchParams.toString()}`;
}

const inputStyle: React.CSSProperties = { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" };

export default async function AdminBotCommandLogsPanel({ statusFilter, commandFilter, userFilter, page }: AdminBotCommandLogsPanelProps) {
  const normalizedStatus = normalizeStatusFilter(statusFilter);
  const normalizedCommand = normalizeTextFilter(commandFilter);
  const normalizedUser = normalizeTextFilter(userFilter);
  const currentPage = normalizePage(page);
  const pageSize = 25;

  const filteredWhere = buildWhere({ statusFilter: normalizedStatus, commandFilter: normalizedCommand });

  const [rawLogs, totalCount, completedCount, failedCount] = await Promise.all([
    prisma.botEvent.findMany({ where: filteredWhere, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.botEvent.count({ where: commandLogWhere }),
    prisma.botEvent.count({ where: { AND: [commandLogWhere, { status: "completed" }] } }),
    prisma.botEvent.count({ where: { AND: [commandLogWhere, { status: "failed" }] } }),
  ]);

  const filteredLogs = rawLogs.filter((log) => matchesUserFilter(log, normalizedUser));
  const totalFilteredPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalFilteredPages);
  const safeOffset = (safeCurrentPage - 1) * pageSize;
  const logs = filteredLogs.slice(safeOffset, safeOffset + pageSize);
  const hasPreviousPage = safeCurrentPage > 1;
  const hasNextPage = safeCurrentPage < totalFilteredPages;

  return (
    <section className="grid gap-6">
      <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>Discord Commands</p>
            <h2 className="text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Slash Command Logs</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>Review command usage, failures, location, options, and response time.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildExportHref({ statusFilter: normalizedStatus, commandFilter: normalizedCommand, userFilter: normalizedUser })}
              className="border px-4 py-3 text-sm font-black transition hover:opacity-90"
              style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
            >
              Export CSV
            </Link>
            <form action={deleteOldSlashCommandLogsInline}>
              <input type="hidden" name="days" value="30" />
              <AdminConfirmSubmitButton
                label="Clean 30+ days"
                confirmTitle="Clean old command logs?"
                confirmDescription="This will permanently delete command logs older than 30 days. Recent logs will remain available."
                confirmLabel="Clean"
                className="border px-4 py-3 text-sm font-black transition hover:opacity-90"
                style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" } as React.CSSProperties}
              />
            </form>
            <form action={deleteFailedSlashCommandLogsInline}>
              <AdminConfirmSubmitButton
                label="Delete failed logs"
                danger
                confirmTitle="Delete failed command logs?"
                confirmDescription="This will permanently delete all failed command logs. Use this only if you already reviewed the errors."
                confirmLabel="Delete"
                className="border px-4 py-3 text-sm font-black transition hover:opacity-90"
                style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" } as React.CSSProperties}
              />
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--asc-fg-3)" }}>Total Logs</p>
            <p className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>{totalCount}</p>
          </div>
          <div className="border p-5" style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--asc-green)" }}>Completed</p>
            <p className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>{completedCount}</p>
          </div>
          <div className="border p-5" style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--asc-live)" }}>Failed</p>
            <p className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>{failedCount}</p>
          </div>
          <div className="border p-5" style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--asc-accent)" }}>Filtered</p>
            <p className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>{filteredLogs.length}</p>
          </div>
        </div>
      </div>

      <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="mb-5">
          <h3 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Filters</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>Filter command logs by status, command name, user, user ID, or channel.</p>
        </div>
        <form className="grid gap-4 lg:grid-cols-[180px_1fr_1fr_auto_auto]" action="/admin/bot">
          <input type="hidden" name="botSection" value="commands" />
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>Status</span>
            <select name="commandStatus" defaultValue={normalizedStatus} className="border px-4 py-3 text-sm font-bold outline-none transition" style={inputStyle}>
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>Command</span>
            <input name="commandName" defaultValue={normalizedCommand} placeholder="ping, tournaments, team..." className="border px-4 py-3 text-sm font-bold outline-none transition" style={inputStyle} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>User / Channel</span>
            <input name="commandUser" defaultValue={normalizedUser} placeholder="username, user ID, channel..." className="border px-4 py-3 text-sm font-bold outline-none transition" style={inputStyle} />
          </label>
          <div className="flex items-end">
            <button type="submit" className="w-full px-5 py-3 text-sm font-black text-white transition hover:opacity-90" style={{ background: "var(--asc-accent-2)" }}>Apply</button>
          </div>
          <div className="flex items-end">
            <Link href="/admin/bot?botSection=commands" className="w-full border px-5 py-3 text-center text-sm font-black transition hover:opacity-90" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>Reset</Link>
          </div>
        </form>
      </div>

      <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Latest Commands</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
              Showing {logs.length} command logs on page {safeCurrentPage} of {totalFilteredPages}.
            </p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="border p-6 text-sm" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>No slash command logs found.</div>
        ) : (
          <div className="grid gap-4">
            {logs.map((log) => {
              const payload = asRecord(log.payload);
              const result = asRecord(log.result);
              const commandName = getStringValue(payload, "commandName", log.entityId || "-") || "-";
              const userTag = getStringValue(payload, "userTag");
              const userId = getStringValue(payload, "userId");
              const location = getStringValue(payload, "location");
              const options = getStringValue(payload, "options");
              const latencyMs = getNumberValue(result, "latencyMs");

              return (
                <article key={log.id} className="border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="border px-3 py-1 text-sm font-black" style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}>/{commandName}</span>
                      <span className="border px-3 py-1 text-xs font-black" style={getStatusStyle(log.status)}>{getStatusLabel(log.status)}</span>
                      <span className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>{formatDate(log.createdAt)}</span>
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="font-black" style={{ color: "var(--asc-fg-3)" }}>User</p>
                        <p className="mt-1 break-words" style={{ color: "var(--asc-fg-0)" }}>{userTag}</p>
                      </div>
                      <div>
                        <p className="font-black" style={{ color: "var(--asc-fg-3)" }}>User ID</p>
                        <p className="mt-1 break-words" style={{ color: "var(--asc-fg-0)" }}>{userId}</p>
                      </div>
                      <div>
                        <p className="font-black" style={{ color: "var(--asc-fg-3)" }}>Location</p>
                        <p className="mt-1 break-words" style={{ color: "var(--asc-fg-0)" }}>{location}</p>
                      </div>
                      <div>
                        <p className="font-black" style={{ color: "var(--asc-fg-3)" }}>Latency</p>
                        <p className="mt-1" style={{ color: "var(--asc-fg-0)" }}>{formatLatency(latencyMs)}</p>
                      </div>
                    </div>

                    <div className="mt-4 border p-4" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287 / 0.5)" }}>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>Options</p>
                      <pre className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: "var(--asc-fg-0)" }}>{options}</pre>
                    </div>

                    {log.error && (
                      <div className="mt-4 border p-4" style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }}>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-live)" }}>Error</p>
                        <p className="break-words text-sm leading-6" style={{ color: "var(--asc-live)" }}>{log.error}</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {filteredLogs.length > pageSize && (
              <div className="mt-6 flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--asc-fg-3)" }}>
                  Page {safeCurrentPage} of {totalFilteredPages} · {filteredLogs.length} filtered logs
                </p>
                <div className="flex flex-wrap gap-3">
                  {hasPreviousPage ? (
                    <Link
                      href={buildCommandLogsHref({ statusFilter: normalizedStatus, commandFilter: normalizedCommand, userFilter: normalizedUser, page: safeCurrentPage - 1 })}
                      className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
                      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="border px-4 py-2 text-sm font-black" style={{ borderColor: "var(--asc-line-soft)", background: "transparent", color: "oklch(0.30 0.04 285)" }}>Previous</span>
                  )}
                  {hasNextPage ? (
                    <Link
                      href={buildCommandLogsHref({ statusFilter: normalizedStatus, commandFilter: normalizedCommand, userFilter: normalizedUser, page: safeCurrentPage + 1 })}
                      className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
                      style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="border px-4 py-2 text-sm font-black" style={{ borderColor: "var(--asc-line-soft)", background: "transparent", color: "oklch(0.30 0.04 285)" }}>Next</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

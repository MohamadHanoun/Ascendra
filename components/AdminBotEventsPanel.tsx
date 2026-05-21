import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { retryBotEventInline } from "@/actions/adminBotEventInlineActions";
import AdminBotAutoRefresh from "@/components/AdminBotAutoRefresh";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";

type BotEventStatus = "queued" | "processing" | "completed" | "failed";

type AdminBotEventsPanelProps = {
  statusFilter?: string;
  eventTypeFilter?: string;
};

type LogField = {
  name: string;
  value: string;
  inline?: boolean;
};

const allowedBotStatuses = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

type BotStatusFilter = (typeof allowedBotStatuses)[number] | "all";

const statusStyles: Record<string, string> = {
  queued: "border-yellow-400/30 bg-yellow-500/10 text-yellow-200",
  processing: "border-blue-400/30 bg-blue-500/10 text-blue-200",
  completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  failed: "border-red-400/30 bg-red-500/10 text-red-200",
  cancelled: "border-gray-400/30 bg-gray-500/10 text-gray-200",
};

function normalizeStatusFilter(value?: string): BotStatusFilter {
  if (
    value &&
    allowedBotStatuses.includes(value as (typeof allowedBotStatuses)[number])
  ) {
    return value as BotStatusFilter;
  }

  return "all";
}

function normalizeTypeFilter(value?: string) {
  return value && value !== "all" ? value : "all";
}

function buildBotFilterHref(status: string, botType: string) {
  const params = new URLSearchParams({
    tab: "bot",
  });

  if (status !== "all") {
    params.set("botStatus", status);
  }

  if (botType !== "all") {
    params.set("botType", botType);
  }

  return `/admin?${params.toString()}`;
}

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatUptime(value: string | undefined) {
  const uptimeMs = Number(value || 0);

  if (!Number.isFinite(uptimeMs) || uptimeMs <= 0) {
    return "-";
  }

  const totalSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatJsonPreview(value: unknown) {
  if (!value) {
    return "-";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Unable to display data.";
  }
}

function shortenId(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getSettingValue(
  settings: Array<{
    key: string;
    value: string;
  }>,
  key: string,
) {
  return settings.find((setting) => setting.key === key)?.value;
}

function getBotStatus(lastHeartbeatAt?: string) {
  if (!lastHeartbeatAt) {
    return {
      label: "Offline",
      description: "No heartbeat received yet.",
      online: false,
      date: null as Date | null,
    };
  }

  const heartbeatDate = new Date(lastHeartbeatAt);

  if (Number.isNaN(heartbeatDate.getTime())) {
    return {
      label: "Offline",
      description: "Invalid heartbeat timestamp.",
      online: false,
      date: null as Date | null,
    };
  }

  const diffMs = Date.now() - heartbeatDate.getTime();
  const online = diffMs <= 120000;

  return {
    label: online ? "Online" : "Offline",
    description: online
      ? "Heartbeat received within the last 2 minutes."
      : "No recent heartbeat from the bot.",
    online,
    date: heartbeatDate,
  };
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
        statusStyles[status] || "border-white/10 bg-white/10 text-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
        active
          ? "border-violet-400/35 bg-violet-500/15 text-white"
          : "border-white/10 bg-black/25 text-gray-400 hover:border-violet-400/30 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function MiniMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-black text-white">{value}</p>

      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
    </div>
  );
}

function EventCountCard({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: BotEventStatus;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
          {label}
        </p>

        <StatusBadge status={status} />
      </div>

      <p className="mt-4 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

async function retryBotEventFormAction(formData: FormData) {
  "use server";

  await retryBotEventInline(formData);
}

function RetryButton({ eventId, status }: { eventId: string; status: string }) {
  if (status !== "failed") {
    return null;
  }

  return (
    <form action={retryBotEventFormAction}>
      <input type="hidden" name="eventId" value={eventId} />

      <button
        type="submit"
        className="rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/25"
      >
        Retry
      </button>
    </form>
  );
}

export default async function AdminBotEventsPanel({
  statusFilter,
  eventTypeFilter,
}: AdminBotEventsPanelProps) {
  const activeStatusFilter = normalizeStatusFilter(statusFilter);
  const activeTypeFilter = normalizeTypeFilter(eventTypeFilter);

  const typeWhere: Prisma.BotEventWhereInput =
    activeTypeFilter !== "all"
      ? {
          type: activeTypeFilter,
        }
      : {};

  const eventWhere: Prisma.BotEventWhereInput = {
    ...typeWhere,
    ...(activeStatusFilter !== "all"
      ? {
          status: activeStatusFilter,
        }
      : {}),
  };

  const [
    queuedCount,
    processingCount,
    completedCount,
    failedCount,
    events,
    settings,
    lastProcessedEvent,
    eventTypes,
  ] = await Promise.all([
    prisma.botEvent.count({
      where: {
        ...typeWhere,
        status: "queued",
      },
    }),
    prisma.botEvent.count({
      where: {
        ...typeWhere,
        status: "processing",
      },
    }),
    prisma.botEvent.count({
      where: {
        ...typeWhere,
        status: "completed",
      },
    }),
    prisma.botEvent.count({
      where: {
        ...typeWhere,
        status: "failed",
      },
    }),
    prisma.botEvent.findMany({
      where: eventWhere,
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    }),
    prisma.serverSetting.findMany({
      where: {
        key: {
          in: ["bot.lastHeartbeatAt", "bot.tag", "bot.guildId", "bot.uptimeMs"],
        },
      },
    }),
    prisma.botEvent.findFirst({
      where: {
        processedAt: {
          not: null,
        },
      },
      orderBy: {
        processedAt: "desc",
      },
    }),
    prisma.botEvent.findMany({
      select: {
        type: true,
      },
      distinct: ["type"],
      orderBy: {
        type: "asc",
      },
    }),
  ]);

  const botTag = getSettingValue(settings, "bot.tag") || "Unknown";
  const guildId = getSettingValue(settings, "bot.guildId") || "-";
  const uptime = formatUptime(getSettingValue(settings, "bot.uptimeMs"));
  const lastHeartbeatAt = getSettingValue(settings, "bot.lastHeartbeatAt");
  const botStatus = getBotStatus(lastHeartbeatAt);

  return (
    <div className="grid gap-8">
      <AdminBotAutoRefresh />

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
              Bot control
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">Bot events</h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
              Track Discord operations, bot status, and failed work from one
              admin view.
            </p>
          </div>

          <div
            className={`rounded-2xl border px-5 py-4 ${
              botStatus.online
                ? "border-emerald-400/25 bg-emerald-500/10"
                : "border-red-400/25 bg-red-500/10"
            }`}
          >
            <p
              className={`text-xs font-black uppercase tracking-[0.16em] ${
                botStatus.online ? "text-emerald-300" : "text-red-300"
              }`}
            >
              Bot status
            </p>

            <p className="mt-2 text-2xl font-black text-white">
              {botStatus.label}
            </p>

            <p className="mt-1 max-w-sm text-sm leading-6 text-gray-400">
              {botStatus.description}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric
            label="Bot account"
            value={botTag}
            description={`Guild: ${guildId}`}
          />

          <MiniMetric
            label="Last heartbeat"
            value={formatDate(botStatus.date)}
            description={`Process uptime: ${uptime}`}
          />

          <MiniMetric
            label="Last processed"
            value={lastProcessedEvent?.type || "-"}
            description={
              lastProcessedEvent?.processedAt
                ? formatDate(lastProcessedEvent.processedAt)
                : "No processed event yet."
            }
          />

          <MiniMetric
            label="Last event ID"
            value={shortenId(lastProcessedEvent?.id)}
            description="Most recent completed or failed operation."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EventCountCard label="Queued" value={queuedCount} status="queued" />
        <EventCountCard
          label="Processing"
          value={processingCount}
          status="processing"
        />
        <EventCountCard
          label="Completed"
          value={completedCount}
          status="completed"
        />
        <EventCountCard label="Failed" value={failedCount} status="failed" />
      </div>

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Filters
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            Bot event filters
          </h3>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {["all", ...allowedBotStatuses].map((status) => (
              <FilterPill
                key={status}
                href={buildBotFilterHref(status, activeTypeFilter)}
                label={status}
                active={activeStatusFilter === status}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill
              href={buildBotFilterHref(activeStatusFilter, "all")}
              label="All types"
              active={activeTypeFilter === "all"}
            />

            {eventTypes.map((eventType) => (
              <FilterPill
                key={eventType.type}
                href={buildBotFilterHref(activeStatusFilter, eventType.type)}
                label={eventType.type}
                active={activeTypeFilter === eventType.type}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Recent operations
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            Latest bot events
          </h3>
        </div>

        <p className="text-sm text-gray-500">
          Showing latest {events.length} event{events.length === 1 ? "" : "s"}
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No bot events found."
          description="Change or clear the filters to see more bot events."
        />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20"
            >
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <StatusBadge status={event.status} />

                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-gray-300">
                      {event.type}
                    </span>
                  </div>

                  <h3 className="break-words text-xl font-black text-white">
                    {event.entityType || "event"} · {shortenId(event.entityId)}
                  </h3>

                  <div className="mt-3 grid gap-2 text-sm text-gray-400 md:grid-cols-2 xl:grid-cols-4">
                    <p>
                      <span className="font-bold text-gray-300">Created:</span>{" "}
                      {formatDate(event.createdAt)}
                    </p>

                    <p>
                      <span className="font-bold text-gray-300">Updated:</span>{" "}
                      {formatDate(event.updatedAt)}
                    </p>

                    <p>
                      <span className="font-bold text-gray-300">Attempts:</span>{" "}
                      {event.attempts}/{event.maxAttempts}
                    </p>

                    <p>
                      <span className="font-bold text-gray-300">
                        Processed:
                      </span>{" "}
                      {formatDate(event.processedAt)}
                    </p>
                  </div>

                  {event.error && (
                    <div className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                      {event.error}
                    </div>
                  )}
                </div>

                <RetryButton eventId={event.id} status={event.status} />
              </div>

              <div className="mt-5 grid gap-3">
                <details className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em] text-gray-300">
                    Payload
                  </summary>

                  <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-300">
                    {formatJsonPreview(event.payload)}
                  </pre>
                </details>

                {event.result && (
                  <details className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em] text-gray-300">
                      Result
                    </summary>

                    <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-300">
                      {formatJsonPreview(event.result)}
                    </pre>
                  </details>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

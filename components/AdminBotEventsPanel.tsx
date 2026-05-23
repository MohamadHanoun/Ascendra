import type { Prisma } from "@prisma/client";
import Link from "next/link";

import {
  cancelBotEventInline,
  cancelPendingBotEventsInline,
  cleanupCompletedBotEventsInline,
  resetProcessingBotEventsInline,
  retryBotEventInline,
} from "@/actions/adminBotEventInlineActions";
import AdminConfirmSubmitButton from "@/components/AdminConfirmSubmitButton";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";

type AdminBotEventsPanelProps = {
  statusFilter?: string;
  eventTypeFilter?: string;
  page?: string;
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
  queued: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  processing: "border-blue-400/25 bg-blue-500/10 text-blue-300",
  completed: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  failed: "border-red-400/25 bg-red-500/10 text-red-300",
  cancelled: "border-white/10 bg-white/5 text-gray-300",
  online: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  offline: "border-red-400/25 bg-red-500/10 text-red-300",
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

function normalizePage(value?: string) {
  const page = Number(value || 1);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function buildBotFilterHref(status: string, botType: string) {
  const params = new URLSearchParams();

  params.set("botSection", "events");

  if (status !== "all") {
    params.set("botStatus", status);
  }

  if (botType !== "all") {
    params.set("botType", botType);
  }

  return `/admin/bot?${params.toString()}`;
}

function buildBotEventsPageHref(params: {
  statusFilter: string;
  typeFilter: string;
  page: number;
}) {
  const searchParams = new URLSearchParams();

  searchParams.set("botSection", "events");

  if (params.statusFilter !== "all") {
    searchParams.set("botStatus", params.statusFilter);
  }

  if (params.typeFilter !== "all") {
    searchParams.set("botType", params.typeFilter);
  }

  if (params.page > 1) {
    searchParams.set("botEventPage", String(params.page));
  }

  return `/admin/bot?${searchParams.toString()}`;
}

function buildBotEventsExportHref(params: {
  statusFilter: string;
  typeFilter: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.statusFilter !== "all") {
    searchParams.set("botStatus", params.statusFilter);
  }

  if (params.typeFilter !== "all") {
    searchParams.set("botType", params.typeFilter);
  }

  const query = searchParams.toString();

  return query
    ? `/api/admin/bot/events/export?${query}`
    : "/api/admin/bot/events/export";
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
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        statusStyles[status] || "border-white/10 bg-white/5 text-gray-300"
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
      scroll={false}
      className={`rounded-xl border px-4 py-2 text-xs font-black transition ${
        active
          ? "border-violet-400/35 bg-violet-500/15 text-white"
          : "border-white/10 bg-black/20 text-gray-400 hover:border-violet-400/30 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 truncate text-2xl font-black text-white">{value}</p>
    </div>
  );
}

async function retryBotEventFormAction(formData: FormData) {
  "use server";

  await retryBotEventInline(formData);
}

async function cancelBotEventFormAction(formData: FormData) {
  "use server";

  await cancelBotEventInline(formData);
}

async function cleanupBotEventsFormAction(formData: FormData) {
  "use server";

  await cleanupCompletedBotEventsInline(formData);
}

async function resetProcessingBotEventsFormAction() {
  "use server";

  await resetProcessingBotEventsInline();
}

async function cancelPendingBotEventsFormAction() {
  "use server";

  await cancelPendingBotEventsInline();
}

function RetryButton({ eventId, status }: { eventId: string; status: string }) {
  if (!["failed", "cancelled"].includes(status)) {
    return null;
  }

  return (
    <form action={retryBotEventFormAction}>
      <input type="hidden" name="eventId" value={eventId} />

      <AdminConfirmSubmitButton
        label="Retry"
        confirmTitle="Retry bot event?"
        confirmDescription="This will move the selected bot event back to the queue and allow the bot to process it again."
        confirmLabel="Retry"
        className="rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-black text-violet-100 transition hover:bg-violet-500/25"
      />
    </form>
  );
}

function CancelButton({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  if (!["queued", "failed", "processing"].includes(status)) {
    return null;
  }

  return (
    <form action={cancelBotEventFormAction}>
      <input type="hidden" name="eventId" value={eventId} />

      <AdminConfirmSubmitButton
        label="Cancel"
        danger
        confirmTitle="Cancel bot event?"
        confirmDescription="This will cancel the selected bot event. The bot will not process it unless you retry it later."
        confirmLabel="Cancel event"
        className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black text-red-200 transition hover:bg-red-500/15"
      />
    </form>
  );
}

function EventsPagination({
  currentPage,
  totalPages,
  eventCount,
  statusFilter,
  typeFilter,
}: {
  currentPage: number;
  totalPages: number;
  eventCount: number;
  statusFilter: string;
  typeFilter: string;
}) {
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  if (eventCount <= 30) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-white/10 px-5 pt-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-gray-400">
        Page {currentPage} of {totalPages} · {eventCount} event
        {eventCount === 1 ? "" : "s"}
      </p>

      <div className="flex flex-wrap gap-3">
        {hasPreviousPage ? (
          <Link
            href={buildBotEventsPageHref({
              statusFilter,
              typeFilter,
              page: currentPage - 1,
            })}
            scroll={false}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-gray-600">
            Previous
          </span>
        )}

        {hasNextPage ? (
          <Link
            href={buildBotEventsPageHref({
              statusFilter,
              typeFilter,
              page: currentPage + 1,
            })}
            scroll={false}
            className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-black text-violet-200 transition hover:bg-violet-500/15 hover:text-white"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-gray-600">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

export default async function AdminBotEventsPanel({
  statusFilter,
  eventTypeFilter,
  page,
}: AdminBotEventsPanelProps) {
  const activeStatusFilter = normalizeStatusFilter(statusFilter);
  const activeTypeFilter = normalizeTypeFilter(eventTypeFilter);
  const requestedPage = normalizePage(page);
  const pageSize = 30;

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
    eventCount,
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
    prisma.botEvent.count({
      where: eventWhere,
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

  const totalPages = Math.max(1, Math.ceil(eventCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const events = await prisma.botEvent.findMany({
    where: eventWhere,
    orderBy: {
      createdAt: "desc",
    },
    skip: offset,
    take: pageSize,
  });

  const botTag = getSettingValue(settings, "bot.tag") || "Unknown";
  const guildId = getSettingValue(settings, "bot.guildId") || "-";
  const uptime = formatUptime(getSettingValue(settings, "bot.uptimeMs"));
  const lastHeartbeatAt = getSettingValue(settings, "bot.lastHeartbeatAt");
  const botStatus = getBotStatus(lastHeartbeatAt);

  return (
    <section className="grid gap-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
        <div className="grid gap-5 border-b border-white/10 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
              Bot events
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Operations queue
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              Monitor Discord operations, failed work, and queue status.
            </p>
          </div>

          <div className="grid gap-2 justify-items-start lg:justify-items-end">
            <StatusBadge status={botStatus.label.toLowerCase()} />

            <p className="text-xs font-bold text-gray-500">
              {botStatus.description}
            </p>
          </div>
        </div>

        <div className="grid gap-5 border-b border-white/10 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Queued" value={queuedCount} />
          <Stat label="Processing" value={processingCount} />
          <Stat label="Completed" value={completedCount} />
          <Stat label="Failed" value={failedCount} />
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Bot account" value={botTag} />
          <Stat label="Guild" value={shortenId(guildId)} />
          <Stat label="Heartbeat" value={formatDate(botStatus.date)} />
          <Stat label="Uptime" value={uptime} />
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-sm leading-6 text-gray-400">
            Last processed:{" "}
            <span className="font-black text-white">
              {lastProcessedEvent?.type || "-"}
            </span>{" "}
            · {formatDate(lastProcessedEvent?.processedAt || null)} ·{" "}
            {shortenId(lastProcessedEvent?.id)}
          </p>
        </div>
      </div>

      <section className="grid gap-4 rounded-3xl border border-violet-400/20 bg-violet-500/[0.06] p-5 shadow-2xl shadow-black/20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Bot controls
          </p>

          <h3 className="mt-1 text-xl font-black text-white">
            Queue recovery tools
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Use these controls when the bot is stuck, when processing events are
            frozen, or when you want to clear pending work before restarting the
            bot.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <form action={resetProcessingBotEventsFormAction}>
            <AdminConfirmSubmitButton
              label="Reset processing"
              confirmTitle="Reset processing events?"
              confirmDescription="This will move all currently processing bot events back to the queue. Use it only if the bot was stuck or restarted while processing."
              confirmLabel="Reset"
              className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm font-black text-blue-200 transition hover:bg-blue-500/15"
            />
          </form>

          <form action={cancelPendingBotEventsFormAction}>
            <AdminConfirmSubmitButton
              label="Cancel pending queue"
              danger
              confirmTitle="Cancel pending queue?"
              confirmDescription="This will cancel all queued, failed, and processing bot events. Use this only when you want to clear the current queue before restarting or recovering the bot."
              confirmLabel="Cancel queue"
              className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/15"
            />
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Filters
          </p>

          <h3 className="mt-1 text-xl font-black text-white">Event filters</h3>
        </div>

        <div className="grid gap-4 p-5">
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

      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Cleanup
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-400">
            Remove completed or cancelled bot events older than 30 days.
          </p>
        </div>

        <form action={cleanupBotEventsFormAction}>
          <input type="hidden" name="days" value="30" />

          <AdminConfirmSubmitButton
            label="Clean old events"
            confirmTitle="Clean old bot events?"
            confirmDescription="This will permanently delete completed and cancelled bot events older than 30 days. Failed, queued, and processing events will remain."
            confirmLabel="Clean"
            className="rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
          />
        </form>
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

        <div className="flex flex-col gap-3 sm:items-end">
          <Link
            href={buildBotEventsExportHref({
              statusFilter: activeStatusFilter,
              typeFilter: activeTypeFilter,
            })}
            className="w-fit rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-black text-violet-200 transition hover:bg-violet-500/15 hover:text-white"
          >
            Export CSV
          </Link>

          <p className="text-sm text-gray-500">
            Showing {events.length} of {eventCount} event
            {eventCount === 1 ? "" : "s"} · Page {currentPage} of {totalPages}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No bot events found"
          description="Change or clear the filters to see more bot events."
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[160px_minmax(0,1fr)_120px_130px_160px] xl:gap-5">
            <span>Status</span>
            <span>Event</span>
            <span>Attempts</span>
            <span>Created</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-white/10">
            {events.map((event) => (
              <article
                key={event.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035]"
              >
                <div className="grid gap-4 xl:grid-cols-[160px_minmax(0,1fr)_120px_130px_160px] xl:items-center xl:gap-5">
                  <StatusBadge status={event.status} />

                  <div className="min-w-0">
                    <p className="truncate font-black text-white">
                      {event.type}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {event.entityType || "event"} ·{" "}
                      {shortenId(event.entityId)}
                    </p>
                  </div>

                  <p className="text-sm text-gray-300">
                    {event.attempts}/{event.maxAttempts}
                  </p>

                  <p className="text-sm text-gray-500">
                    {formatDate(event.createdAt)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <RetryButton eventId={event.id} status={event.status} />
                    <CancelButton eventId={event.id} status={event.status} />
                  </div>
                </div>

                {event.error && (
                  <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
                    {event.error}
                  </p>
                )}

                <details className="rounded-2xl border border-white/10 bg-black/20">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-black text-gray-300 transition hover:text-white">
                    Payload and result
                  </summary>

                  <div className="grid gap-4 border-t border-white/10 p-4 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                        Payload
                      </p>

                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-300">
                        {formatJsonPreview(event.payload)}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                        Result
                      </p>

                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-gray-300">
                        {formatJsonPreview(event.result)}
                      </pre>
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>

          <EventsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            eventCount={eventCount}
            statusFilter={activeStatusFilter}
            typeFilter={activeTypeFilter}
          />
        </section>
      )}
    </section>
  );
}

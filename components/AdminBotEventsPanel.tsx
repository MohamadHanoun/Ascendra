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
  searchFilter?: string;
  page?: string;
};

const allowedBotStatuses = ["queued", "processing", "completed", "failed", "cancelled"] as const;
type BotStatusFilter = (typeof allowedBotStatuses)[number] | "all";

const statusStyleMap: Record<string, React.CSSProperties> = {
  queued: { borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" },
  processing: { borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)", color: "var(--asc-blue)" },
  completed: { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" },
  failed: { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" },
  cancelled: { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" },
  online: { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" },
  offline: { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" },
};

function normalizeStatusFilter(value?: string): BotStatusFilter {
  if (value && allowedBotStatuses.includes(value as (typeof allowedBotStatuses)[number])) return value as BotStatusFilter;
  return "all";
}

function normalizeTypeFilter(value?: string) {
  return value && value !== "all" ? value.slice(0, 120) : "all";
}

function normalizeSearchFilter(value?: string) {
  return String(value || "").trim().slice(0, 120);
}

function normalizePage(value?: string) {
  const page = Number(value || 1);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function buildBotFilterHref(status: string, botType: string, search: string) {
  const params = new URLSearchParams({ botSection: "events" });
  if (status !== "all") params.set("botStatus", status);
  if (botType !== "all") params.set("botType", botType);
  if (search) params.set("botEventSearch", search);
  return `/admin/bot?${params.toString()}`;
}

function buildBotEventsPageHref(params: { statusFilter: string; typeFilter: string; searchFilter: string; page: number }) {
  const searchParams = new URLSearchParams({ botSection: "events" });
  if (params.statusFilter !== "all") searchParams.set("botStatus", params.statusFilter);
  if (params.typeFilter !== "all") searchParams.set("botType", params.typeFilter);
  if (params.searchFilter) searchParams.set("botEventSearch", params.searchFilter);
  if (params.page > 1) searchParams.set("botEventPage", String(params.page));
  return `/admin/bot?${searchParams.toString()}`;
}

function buildBotEventsExportHref(params: { statusFilter: string; typeFilter: string; searchFilter: string }) {
  const searchParams = new URLSearchParams();
  if (params.statusFilter !== "all") searchParams.set("botStatus", params.statusFilter);
  if (params.typeFilter !== "all") searchParams.set("botType", params.typeFilter);
  if (params.searchFilter) searchParams.set("botEventSearch", params.searchFilter);
  const query = searchParams.toString();
  return query ? `/api/admin/bot/events/export?${query}` : "/api/admin/bot/events/export";
}

function buildEventWhere(params: { statusFilter: BotStatusFilter; typeFilter: string; searchFilter: string }): Prisma.BotEventWhereInput {
  const filters: Prisma.BotEventWhereInput[] = [];
  if (params.typeFilter !== "all") filters.push({ type: params.typeFilter });
  if (params.statusFilter !== "all") filters.push({ status: params.statusFilter });
  if (params.searchFilter) {
    filters.push({
      OR: [
        { id: { contains: params.searchFilter, mode: "insensitive" } },
        { type: { contains: params.searchFilter, mode: "insensitive" } },
        { entityType: { contains: params.searchFilter, mode: "insensitive" } },
        { entityId: { contains: params.searchFilter, mode: "insensitive" } },
        { error: { contains: params.searchFilter, mode: "insensitive" } },
      ],
    });
  }
  if (filters.length === 0) return {};
  return { AND: filters };
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-SE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatUptime(value: string | undefined) {
  const uptimeMs = Number(value || 0);
  if (!Number.isFinite(uptimeMs) || uptimeMs <= 0) return "-";
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatJsonPreview(value: unknown) {
  if (!value) return "-";
  try { return JSON.stringify(value, null, 2); } catch { return "Unable to display data."; }
}

function shortenId(value: string | null | undefined) {
  if (!value) return "-";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getSettingValue(settings: Array<{ key: string; value: string }>, key: string) {
  return settings.find((setting) => setting.key === key)?.value;
}

function getBotStatus(lastHeartbeatAt?: string) {
  if (!lastHeartbeatAt) return { label: "Offline", description: "No heartbeat received yet.", online: false, date: null as Date | null };
  const heartbeatDate = new Date(lastHeartbeatAt);
  if (Number.isNaN(heartbeatDate.getTime())) return { label: "Offline", description: "Invalid heartbeat timestamp.", online: false, date: null as Date | null };
  const diffMs = Date.now() - heartbeatDate.getTime();
  const online = diffMs <= 120000;
  return { label: online ? "Online" : "Offline", description: online ? "Heartbeat received within the last 2 minutes." : "No recent heartbeat from the bot.", online, date: heartbeatDate };
}

function StatusBadge({ status }: { status: string }) {
  const style = statusStyleMap[status] ?? { borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" };
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black capitalize" style={style}>
      {status}
    </span>
  );
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      className="border px-4 py-2 text-xs font-black transition hover:opacity-90"
      style={active
        ? { borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }
        : { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
    >
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-1 truncate text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
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
  if (!["failed", "cancelled"].includes(status)) return null;
  return (
    <form action={retryBotEventFormAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <AdminConfirmSubmitButton
        label="Retry"
        confirmTitle="Retry bot event?"
        confirmDescription="This will move the selected bot event back to the queue and allow the bot to process it again."
        confirmLabel="Retry"
        className="border px-4 py-2 text-xs font-black transition hover:opacity-90"
        style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" } as React.CSSProperties}
      />
    </form>
  );
}

function CancelButton({ eventId, status }: { eventId: string; status: string }) {
  if (!["queued", "failed", "processing"].includes(status)) return null;
  return (
    <form action={cancelBotEventFormAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <AdminConfirmSubmitButton
        label="Cancel"
        danger
        confirmTitle="Cancel bot event?"
        confirmDescription="This will cancel the selected bot event. The bot will not process it unless you retry it later."
        confirmLabel="Cancel event"
        className="border px-4 py-2 text-xs font-black transition hover:opacity-90"
        style={{ borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" } as React.CSSProperties}
      />
    </form>
  );
}

function EventsPagination({ currentPage, totalPages, eventCount, statusFilter, typeFilter, searchFilter }: {
  currentPage: number; totalPages: number; eventCount: number; statusFilter: string; typeFilter: string; searchFilter: string;
}) {
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  if (eventCount <= 30) return null;

  return (
    <div className="mt-6 flex flex-col gap-3 px-5 pb-5 pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
      <p className="text-sm font-bold" style={{ color: "var(--asc-fg-3)" }}>
        Page {currentPage} of {totalPages} · {eventCount} event{eventCount === 1 ? "" : "s"}
      </p>
      <div className="flex flex-wrap gap-3">
        {hasPreviousPage ? (
          <Link href={buildBotEventsPageHref({ statusFilter, typeFilter, searchFilter, page: currentPage - 1 })} scroll={false} className="border px-4 py-2 text-sm font-black transition hover:opacity-90" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>Previous</Link>
        ) : (
          <span className="border px-4 py-2 text-sm font-black" style={{ borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }}>Previous</span>
        )}
        {hasNextPage ? (
          <Link href={buildBotEventsPageHref({ statusFilter, typeFilter, searchFilter, page: currentPage + 1 })} scroll={false} className="border px-4 py-2 text-sm font-black transition hover:opacity-90" style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}>Next</Link>
        ) : (
          <span className="border px-4 py-2 text-sm font-black" style={{ borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }}>Next</span>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" };

export default async function AdminBotEventsPanel({ statusFilter, eventTypeFilter, searchFilter, page }: AdminBotEventsPanelProps) {
  const activeStatusFilter = normalizeStatusFilter(statusFilter);
  const activeTypeFilter = normalizeTypeFilter(eventTypeFilter);
  const activeSearchFilter = normalizeSearchFilter(searchFilter);
  const requestedPage = normalizePage(page);
  const pageSize = 30;

  const typeWhere: Prisma.BotEventWhereInput = activeTypeFilter !== "all" ? { type: activeTypeFilter } : {};
  const eventWhere = buildEventWhere({ statusFilter: activeStatusFilter, typeFilter: activeTypeFilter, searchFilter: activeSearchFilter });

  const [queuedCount, processingCount, completedCount, failedCount, eventCount, settings, lastProcessedEvent, eventTypes] = await Promise.all([
    prisma.botEvent.count({ where: { ...typeWhere, status: "queued" } }),
    prisma.botEvent.count({ where: { ...typeWhere, status: "processing" } }),
    prisma.botEvent.count({ where: { ...typeWhere, status: "completed" } }),
    prisma.botEvent.count({ where: { ...typeWhere, status: "failed" } }),
    prisma.botEvent.count({ where: eventWhere }),
    prisma.serverSetting.findMany({ where: { key: { in: ["bot.lastHeartbeatAt", "bot.tag", "bot.guildId", "bot.uptimeMs"] } } }),
    prisma.botEvent.findFirst({ where: { processedAt: { not: null } }, orderBy: { processedAt: "desc" } }),
    prisma.botEvent.findMany({ select: { type: true }, distinct: ["type"], orderBy: { type: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(eventCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const events = await prisma.botEvent.findMany({ where: eventWhere, orderBy: { createdAt: "desc" }, skip: offset, take: pageSize });

  const botTag = getSettingValue(settings, "bot.tag") || "Unknown";
  const guildId = getSettingValue(settings, "bot.guildId") || "-";
  const uptime = formatUptime(getSettingValue(settings, "bot.uptimeMs"));
  const lastHeartbeatAt = getSettingValue(settings, "bot.lastHeartbeatAt");
  const botStatus = getBotStatus(lastHeartbeatAt);

  return (
    <section className="grid gap-6">
      <div className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="grid gap-5 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Bot events</p>
            <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Operations queue</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>Monitor Discord operations, failed work, and queue status.</p>
          </div>
          <div className="grid gap-2 justify-items-start lg:justify-items-end">
            <StatusBadge status={botStatus.label.toLowerCase()} />
            <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>{botStatus.description}</p>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
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

        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
          <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Last processed: <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>{lastProcessedEvent?.type || "-"}</span>{" "}
            · {formatDate(lastProcessedEvent?.processedAt || null)} · {shortenId(lastProcessedEvent?.id)}
          </p>
        </div>
      </div>

      <section className="grid gap-4 border p-5 shadow-2xl shadow-black/20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" }}>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Bot controls</p>
          <h3 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Queue recovery tools</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Use these controls when the bot is stuck, when processing events are frozen, or when you want to clear pending work before restarting the bot.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={resetProcessingBotEventsFormAction}>
            <AdminConfirmSubmitButton
              label="Reset processing"
              confirmTitle="Reset processing events?"
              confirmDescription="This will move all currently processing bot events back to the queue. Use it only if the bot was stuck or restarted while processing."
              confirmLabel="Reset"
              className="border px-4 py-3 text-sm font-black transition hover:opacity-90"
              style={{ borderColor: "var(--asc-blue-border)", background: "var(--asc-blue-bg)", color: "var(--asc-blue)" } as React.CSSProperties}
            />
          </form>
          <form action={cancelPendingBotEventsFormAction}>
            <AdminConfirmSubmitButton
              label="Cancel pending queue"
              danger
              confirmTitle="Cancel pending queue?"
              confirmDescription="This will cancel all queued, failed, and processing bot events. Use this only when you want to clear the current queue before restarting or recovering the bot."
              confirmLabel="Cancel queue"
              className="border px-4 py-3 text-sm font-black transition hover:opacity-90"
              style={{ borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" } as React.CSSProperties}
            />
          </form>
        </div>
      </section>

      <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Filters</p>
          <h3 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Event filters</h3>
        </div>
        <div className="grid gap-5 p-5">
          <form className="grid gap-4 lg:grid-cols-[1fr_auto_auto]" action="/admin/bot">
            <input type="hidden" name="botSection" value="events" />
            {activeStatusFilter !== "all" && <input type="hidden" name="botStatus" value={activeStatusFilter} />}
            {activeTypeFilter !== "all" && <input type="hidden" name="botType" value={activeTypeFilter} />}
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>Search Events</span>
              <input name="botEventSearch" defaultValue={activeSearchFilter} placeholder="event type, id, entity, error..." className="border px-4 py-3 text-sm font-bold outline-none transition" style={inputStyle} />
            </label>
            <div className="flex items-end">
              <button type="submit" className="w-full px-5 py-3 text-sm font-black transition hover:opacity-90" style={{ background: "var(--asc-accent-2)", color: "var(--asc-on-accent)" }}>Search</button>
            </div>
            <div className="flex items-end">
              <Link href={buildBotFilterHref(activeStatusFilter, activeTypeFilter, "")} className="w-full border px-5 py-3 text-center text-sm font-black transition hover:opacity-90" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>Clear</Link>
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            {["all", ...allowedBotStatuses].map((status) => (
              <FilterPill key={status} href={buildBotFilterHref(status, activeTypeFilter, activeSearchFilter)} label={status} active={activeStatusFilter === status} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill href={buildBotFilterHref(activeStatusFilter, "all", activeSearchFilter)} label="All types" active={activeTypeFilter === "all"} />
            {eventTypes.map((eventType) => (
              <FilterPill key={eventType.type} href={buildBotFilterHref(activeStatusFilter, eventType.type, activeSearchFilter)} label={eventType.type} active={activeTypeFilter === eventType.type} />
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-between gap-4 border p-5 shadow-2xl shadow-black/20 lg:flex-row lg:items-center" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Cleanup</p>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>Remove completed or cancelled bot events older than 30 days.</p>
        </div>
        <form action={cleanupBotEventsFormAction}>
          <input type="hidden" name="days" value="30" />
          <AdminConfirmSubmitButton
            label="Clean old events"
            confirmTitle="Clean old bot events?"
            confirmDescription="This will permanently delete completed and cancelled bot events older than 30 days. Failed, queued, and processing events will remain."
            confirmLabel="Clean"
            className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" } as React.CSSProperties}
          />
        </form>
      </section>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>Recent operations</p>
          <h3 className="mt-2 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>Latest bot events</h3>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <Link
            href={buildBotEventsExportHref({ statusFilter: activeStatusFilter, typeFilter: activeTypeFilter, searchFilter: activeSearchFilter })}
            className="w-fit border px-4 py-2 text-sm font-black transition hover:opacity-90"
            style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
          >
            Export CSV
          </Link>
          <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
            Showing {events.length} of {eventCount} event{eventCount === 1 ? "" : "s"} · Page {currentPage} of {totalPages}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No bot events found" description="Change or clear the filters to see more bot events." />
      ) : (
        <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] xl:grid xl:grid-cols-[160px_minmax(0,1fr)_120px_130px_160px] xl:gap-5"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-table-head-bg)", color: "var(--asc-fg-3)" }}
          >
            <span>Status</span>
            <span>Event</span>
            <span>Attempts</span>
            <span>Created</span>
            <span>Actions</span>
          </div>

          <div>
            {events.map((event, idx) => (
              <article
                key={event.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035]"
                style={idx < events.length - 1 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
              >
                <div className="grid gap-4 xl:grid-cols-[160px_minmax(0,1fr)_120px_130px_160px] xl:items-center xl:gap-5">
                  <StatusBadge status={event.status} />
                  <div className="min-w-0">
                    <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>{event.type}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>{event.entityType || "event"} · {shortenId(event.entityId)}</p>
                  </div>
                  <p className="text-sm" style={{ color: "var(--asc-fg-0)" }}>{event.attempts}/{event.maxAttempts}</p>
                  <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>{formatDate(event.createdAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    <RetryButton eventId={event.id} status={event.status} />
                    <CancelButton eventId={event.id} status={event.status} />
                  </div>
                </div>

                {event.error && (
                  <p className="border px-4 py-3 text-sm leading-6" style={{ borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" }}>
                    {event.error}
                  </p>
                )}

                <details className="border" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
                  <summary className="cursor-pointer px-4 py-3 text-sm font-black transition hover:opacity-90" style={{ color: "var(--asc-fg-3)" }}>
                    Payload and result
                  </summary>
                  <div className="grid gap-4 p-4 lg:grid-cols-2" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>Payload</p>
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5" style={{ color: "var(--asc-fg-0)" }}>{formatJsonPreview(event.payload)}</pre>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>Result</p>
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5" style={{ color: "var(--asc-fg-0)" }}>{formatJsonPreview(event.result)}</pre>
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>

          <EventsPagination currentPage={currentPage} totalPages={totalPages} eventCount={eventCount} statusFilter={activeStatusFilter} typeFilter={activeTypeFilter} searchFilter={activeSearchFilter} />
        </section>
      )}
    </section>
  );
}

import { prisma } from "@/lib/prisma";

type EventTypeStat = {
  type: string;
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
};

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-SE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function getFailureRate(total: number, failed: number) {
  if (total === 0) return "0%";
  return `${Math.round((failed / total) * 100)}%`;
}

function buildEventTypeStats(events: Array<{ type: string; status: string }>) {
  const map = new Map<string, EventTypeStat>();
  for (const event of events) {
    const current = map.get(event.type) || ({ type: event.type, total: 0, queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 } satisfies EventTypeStat);
    current.total += 1;
    if (event.status === "queued") current.queued += 1;
    if (event.status === "processing") current.processing += 1;
    if (event.status === "completed") current.completed += 1;
    if (event.status === "failed") current.failed += 1;
    if (event.status === "cancelled") current.cancelled += 1;
    map.set(event.type, current);
  }
  return Array.from(map.values());
}

const toneStyles: Record<string, React.CSSProperties> = {
  default: { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" },
  success: { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" },
  danger: { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" },
  info: { borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" },
  blue: { borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)", color: "var(--asc-blue)" },
};

function StatCard({ label, value, description, tone = "default" }: {
  label: string; value: number | string; description?: string;
  tone?: "default" | "success" | "danger" | "info" | "blue";
}) {
  return (
    <div className="border p-5" style={toneStyles[tone]}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
      {description && <p className="mt-2 text-xs font-bold leading-5 opacity-80">{description}</p>}
    </div>
  );
}

export default async function AdminBotEventInsightsPanel() {
  const now = new Date();
  const last24Hours = new Date(now);
  const staleProcessingCutoff = new Date(now);
  last24Hours.setHours(last24Hours.getHours() - 24);
  staleProcessingCutoff.setMinutes(staleProcessingCutoff.getMinutes() - 5);

  const [
    totalEvents, queuedEvents, processingEvents, completedEvents, failedEvents, cancelledEvents,
    last24HoursEvents, last24HoursFailures, staleProcessingEvents, recentEvents, recentFailures,
  ] = await Promise.all([
    prisma.botEvent.count(),
    prisma.botEvent.count({ where: { status: "queued" } }),
    prisma.botEvent.count({ where: { status: "processing" } }),
    prisma.botEvent.count({ where: { status: "completed" } }),
    prisma.botEvent.count({ where: { status: "failed" } }),
    prisma.botEvent.count({ where: { status: "cancelled" } }),
    prisma.botEvent.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.botEvent.count({ where: { status: "failed", createdAt: { gte: last24Hours } } }),
    prisma.botEvent.count({ where: { status: "processing", lockedAt: { lt: staleProcessingCutoff } } }),
    prisma.botEvent.findMany({ orderBy: { createdAt: "desc" }, take: 500, select: { type: true, status: true } }),
    prisma.botEvent.findMany({
      where: { status: "failed" }, orderBy: { updatedAt: "desc" }, take: 6,
      select: { id: true, type: true, error: true, attempts: true, maxAttempts: true, createdAt: true, updatedAt: true },
    }),
  ]);

  const eventTypeStats = buildEventTypeStats(recentEvents);
  const topEventTypes = [...eventTypeStats].sort((a, b) => b.total - a.total).slice(0, 8);
  const failingEventTypes = [...eventTypeStats].filter((e) => e.failed > 0).sort((a, b) => b.failed - a.failed).slice(0, 8);
  const queuePressure = queuedEvents + processingEvents;

  return (
    <section className="grid gap-6">
      <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>Event Insights</p>
          <h2 className="text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Bot Event Analytics</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Monitor queue pressure, processing health, event failures, and the most active bot event types.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Events" value={totalEvents} description="All stored bot events." />
          <StatCard label="Queue Pressure" value={queuePressure} description="Queued + processing events." tone="info" />
          <StatCard label="Failed Events" value={failedEvents} description="Events that need review." tone="danger" />
          <StatCard label="Stale Processing" value={staleProcessingEvents} description="Processing for more than 5 minutes." tone={staleProcessingEvents > 0 ? "danger" : "success"} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Queued" value={queuedEvents} tone="info" />
        <StatCard label="Processing" value={processingEvents} tone="blue" />
        <StatCard label="Completed" value={completedEvents} tone="success" />
        <StatCard label="Failed" value={failedEvents} tone="danger" />
        <StatCard label="Cancelled" value={cancelledEvents} />
        <StatCard label="Last 24 Hours" value={last24HoursEvents} description={`${last24HoursFailures} failed`} tone={last24HoursFailures > 0 ? "danger" : "default"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <div className="mb-5">
            <h3 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Top Event Types</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>Most common event types from the latest {recentEvents.length} stored events.</p>
          </div>
          {topEventTypes.length === 0 ? (
            <div className="border p-5 text-sm" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}>No event activity found yet.</div>
          ) : (
            <div className="grid gap-3">
              {topEventTypes.map((eventType, index) => (
                <div key={eventType.type} className="border p-4" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black" style={{ color: "var(--asc-accent)" }}>#{index + 1} {eventType.type}</p>
                      <p className="mt-1 text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>Failure rate: {getFailureRate(eventType.total, eventType.failed)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{eventType.total}</p>
                      <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>{eventType.completed} completed</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <div className="mb-5">
            <h3 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Failing Event Types</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>Event types with the highest number of recent failures.</p>
          </div>
          {failingEventTypes.length === 0 ? (
            <div className="border p-5 text-sm" style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }}>No failing event types found.</div>
          ) : (
            <div className="grid gap-3">
              {failingEventTypes.map((eventType) => (
                <div key={eventType.type} className="border p-4" style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black" style={{ color: "var(--asc-live)" }}>{eventType.type}</p>
                      <p className="mt-1 text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>{eventType.completed} completed · {eventType.failed} failed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{eventType.failed}</p>
                      <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>{getFailureRate(eventType.total, eventType.failed)} failed</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border p-6 shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="mb-5">
          <h3 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Recent Failures</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>Latest failed bot events with error preview.</p>
        </div>
        {recentFailures.length === 0 ? (
          <div className="border p-5 text-sm" style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }}>No failed bot events found.</div>
        ) : (
          <div className="grid gap-3">
            {recentFailures.map((event) => (
              <article key={event.id} className="border p-4" style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }}>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="border px-3 py-1 text-sm font-black" style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.30 0.18 25 / 0.30)", color: "var(--asc-live)" }}>
                    {event.type}
                  </span>
                  <span className="border px-3 py-1 text-xs font-black" style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "transparent", color: "var(--asc-live)" }}>
                    {event.attempts}/{event.maxAttempts} attempts
                  </span>
                  <span className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>{formatDate(event.updatedAt)}</span>
                </div>
                <p className="break-words text-sm leading-6" style={{ color: "var(--asc-live)" }}>{event.error || "No error message available."}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

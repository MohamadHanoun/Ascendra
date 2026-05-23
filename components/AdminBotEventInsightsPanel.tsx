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
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStatusClass(status: string) {
  if (status === "failed") {
    return "border-red-400/25 bg-red-500/10 text-red-200";
  }

  if (status === "processing") {
    return "border-blue-400/25 bg-blue-500/10 text-blue-200";
  }

  if (status === "completed") {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "queued") {
    return "border-violet-400/25 bg-violet-500/10 text-violet-200";
  }

  return "border-white/10 bg-white/5 text-gray-300";
}

function getFailureRate(total: number, failed: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((failed / total) * 100)}%`;
}

function buildEventTypeStats(
  events: Array<{
    type: string;
    status: string;
  }>,
) {
  const map = new Map<string, EventTypeStat>();

  for (const event of events) {
    const current =
      map.get(event.type) ||
      ({
        type: event.type,
        total: 0,
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
      } satisfies EventTypeStat);

    current.total += 1;

    if (event.status === "queued") {
      current.queued += 1;
    }

    if (event.status === "processing") {
      current.processing += 1;
    }

    if (event.status === "completed") {
      current.completed += 1;
    }

    if (event.status === "failed") {
      current.failed += 1;
    }

    if (event.status === "cancelled") {
      current.cancelled += 1;
    }

    map.set(event.type, current);
  }

  return Array.from(map.values());
}

function StatCard({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: number | string;
  description?: string;
  tone?: "default" | "success" | "danger" | "info" | "blue";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : tone === "danger"
        ? "border-red-400/20 bg-red-500/10 text-red-200"
        : tone === "info"
          ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
          : tone === "blue"
            ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
            : "border-white/10 bg-black/20 text-gray-400";

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <p className="text-sm font-bold">{label}</p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>

      {description && (
        <p className="mt-2 text-xs font-bold leading-5 opacity-80">
          {description}
        </p>
      )}
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
    totalEvents,
    queuedEvents,
    processingEvents,
    completedEvents,
    failedEvents,
    cancelledEvents,
    last24HoursEvents,
    last24HoursFailures,
    staleProcessingEvents,
    recentEvents,
    recentFailures,
  ] = await Promise.all([
    prisma.botEvent.count(),
    prisma.botEvent.count({
      where: {
        status: "queued",
      },
    }),
    prisma.botEvent.count({
      where: {
        status: "processing",
      },
    }),
    prisma.botEvent.count({
      where: {
        status: "completed",
      },
    }),
    prisma.botEvent.count({
      where: {
        status: "failed",
      },
    }),
    prisma.botEvent.count({
      where: {
        status: "cancelled",
      },
    }),
    prisma.botEvent.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.botEvent.count({
      where: {
        status: "failed",
        createdAt: {
          gte: last24Hours,
        },
      },
    }),
    prisma.botEvent.count({
      where: {
        status: "processing",
        lockedAt: {
          lt: staleProcessingCutoff,
        },
      },
    }),
    prisma.botEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
      select: {
        type: true,
        status: true,
      },
    }),
    prisma.botEvent.findMany({
      where: {
        status: "failed",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        type: true,
        error: true,
        attempts: true,
        maxAttempts: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const eventTypeStats = buildEventTypeStats(recentEvents);

  const topEventTypes = [...eventTypeStats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const failingEventTypes = [...eventTypeStats]
    .filter((eventType) => eventType.failed > 0)
    .sort((a, b) => b.failed - a.failed)
    .slice(0, 8);

  const queuePressure = queuedEvents + processingEvents;

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
            Event Insights
          </p>

          <h2 className="text-3xl font-black text-white">
            Bot Event Analytics
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Monitor queue pressure, processing health, event failures, and the
            most active bot event types.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Total Events"
            value={totalEvents}
            description="All stored bot events."
          />

          <StatCard
            label="Queue Pressure"
            value={queuePressure}
            description="Queued + processing events."
            tone="info"
          />

          <StatCard
            label="Failed Events"
            value={failedEvents}
            description="Events that need review."
            tone="danger"
          />

          <StatCard
            label="Stale Processing"
            value={staleProcessingEvents}
            description="Processing for more than 5 minutes."
            tone={staleProcessingEvents > 0 ? "danger" : "success"}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Queued" value={queuedEvents} tone="info" />
        <StatCard label="Processing" value={processingEvents} tone="blue" />
        <StatCard label="Completed" value={completedEvents} tone="success" />
        <StatCard label="Failed" value={failedEvents} tone="danger" />
        <StatCard label="Cancelled" value={cancelledEvents} />
        <StatCard
          label="Last 24 Hours"
          value={last24HoursEvents}
          description={`${last24HoursFailures} failed`}
          tone={last24HoursFailures > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <div className="mb-5">
            <h3 className="text-xl font-black text-white">Top Event Types</h3>

            <p className="mt-1 text-sm text-gray-400">
              Most common event types from the latest {recentEvents.length}{" "}
              stored events.
            </p>
          </div>

          {topEventTypes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-400">
              No event activity found yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {topEventTypes.map((eventType, index) => (
                <div
                  key={eventType.type}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-violet-200">
                        #{index + 1} {eventType.type}
                      </p>

                      <p className="mt-1 text-xs font-bold text-gray-500">
                        Failure rate:{" "}
                        {getFailureRate(eventType.total, eventType.failed)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-white">
                        {eventType.total}
                      </p>

                      <p className="text-xs font-bold text-gray-500">
                        {eventType.completed} completed
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
            <h3 className="text-xl font-black text-white">
              Failing Event Types
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Event types with the highest number of recent failures.
            </p>
          </div>

          {failingEventTypes.length === 0 ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-200">
              No failing event types found.
            </div>
          ) : (
            <div className="grid gap-3">
              {failingEventTypes.map((eventType) => (
                <div
                  key={eventType.type}
                  className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-red-100">
                        {eventType.type}
                      </p>

                      <p className="mt-1 text-xs font-bold text-red-200/80">
                        {eventType.completed} completed · {eventType.failed}{" "}
                        failed
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-white">
                        {eventType.failed}
                      </p>

                      <p className="text-xs font-bold text-red-200/80">
                        {getFailureRate(eventType.total, eventType.failed)}{" "}
                        failed
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
          <h3 className="text-xl font-black text-white">Recent Failures</h3>

          <p className="mt-1 text-sm text-gray-400">
            Latest failed bot events with error preview.
          </p>
        </div>

        {recentFailures.length === 0 ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-200">
            No failed bot events found.
          </div>
        ) : (
          <div className="grid gap-3">
            {recentFailures.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-xl bg-red-500/15 px-3 py-1 text-sm font-black text-red-100">
                    {event.type}
                  </span>

                  <span className="rounded-xl border border-red-400/20 px-3 py-1 text-xs font-black text-red-200">
                    {event.attempts}/{event.maxAttempts} attempts
                  </span>

                  <span className="text-xs font-bold text-red-200/70">
                    {formatDate(event.updatedAt)}
                  </span>
                </div>

                <p className="break-words text-sm leading-6 text-red-100">
                  {event.error || "No error message available."}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

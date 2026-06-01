import type { CSSProperties } from "react";

import AdminConfirmSubmitButton from "@/components/AdminConfirmSubmitButton";
import {
  cancelPendingBotEventsInline,
  pauseBotQueueInline,
  resetProcessingBotEventsInline,
  resumeBotQueueInline,
} from "@/actions/adminBotEventInlineActions";
import { prisma } from "@/lib/prisma";

async function pauseQueueAction() {
  "use server";
  await pauseBotQueueInline();
}

async function resumeQueueAction() {
  "use server";
  await resumeBotQueueInline();
}

async function resetProcessingAction() {
  "use server";
  await resetProcessingBotEventsInline();
}

async function cancelPendingAction() {
  "use server";
  await cancelPendingBotEventsInline();
}

function StatusRow({
  label,
  value,
  ok,
  last,
}: {
  label: string;
  value: string;
  ok?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-[160px_minmax(0,1fr)] items-baseline gap-4 px-5 py-3"
      style={!last ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
    >
      <p
        className="text-xs font-black uppercase tracking-[0.14em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>
      <p
        className="text-sm font-bold"
        style={{
          color:
            typeof ok === "boolean"
              ? ok
                ? "var(--asc-green)"
                : "var(--asc-live)"
              : "var(--asc-fg-0)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AdminBotQueuePanel() {
  const now = new Date();
  const staleDate = new Date(now);
  staleDate.setMinutes(staleDate.getMinutes() - 5);

  const [queuePausedSetting, queuedCount, processingCount, failedCount, staleCount] =
    await Promise.all([
      prisma.serverSetting.findUnique({ where: { key: "bot.queue.paused" } }),
      prisma.botEvent.count({ where: { status: "queued" } }),
      prisma.botEvent.count({ where: { status: "processing" } }),
      prisma.botEvent.count({ where: { status: "failed" } }),
      prisma.botEvent.count({
        where: { status: "processing", lockedAt: { lt: staleDate } },
      }),
    ]);

  const queuePaused = queuePausedSetting?.value === "true";

  const rows = [
    { label: "Queue", value: queuePaused ? "Paused" : "Running", ok: !queuePaused },
    { label: "Queued", value: String(queuedCount) },
    { label: "Processing", value: String(processingCount) },
    { label: "Failed", value: String(failedCount), ok: failedCount === 0 },
    { label: "Stale (>5m)", value: String(staleCount), ok: staleCount === 0 },
  ];

  return (
    <section className="grid gap-6">
      <div
        className="overflow-hidden border shadow-2xl shadow-black/20"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
        >
          <p
            className="text-xs font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Queue
          </p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            Event queue
          </h2>
        </div>

        <div>
          {rows.map((row, idx) => (
            <StatusRow
              key={row.label}
              label={row.label}
              value={row.value}
              ok={row.ok}
              last={idx === rows.length - 1}
            />
          ))}
        </div>

        <div
          className="flex flex-wrap gap-3 px-5 py-4"
          style={{ borderTop: "1px solid var(--asc-line-soft)" }}
        >
          {queuePaused ? (
            <form action={resumeQueueAction}>
              <button
                type="submit"
                className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
                style={{
                  borderColor: "var(--asc-green-border)",
                  background: "var(--asc-green-bg)",
                  color: "var(--asc-green)",
                }}
              >
                Resume queue
              </button>
            </form>
          ) : (
            <form action={pauseQueueAction}>
              <AdminConfirmSubmitButton
                label="Pause queue"
                confirmTitle="Pause queue?"
                confirmDescription="Stops bot event processing until the queue is resumed."
                confirmLabel="Pause"
                className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-2)",
                  color: "var(--asc-fg-2)",
                } as CSSProperties}
              />
            </form>
          )}
        </div>
      </div>

      <div
        className="overflow-hidden border shadow-2xl shadow-black/20"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
        >
          <p
            className="text-xs font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Recovery
          </p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            Queue recovery
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 px-5 py-4">
          <form action={resetProcessingAction}>
            <AdminConfirmSubmitButton
              label="Reset processing"
              confirmTitle="Reset processing events?"
              confirmDescription="Moves processing bot events back to queued."
              confirmLabel="Reset"
              className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
              style={{
                borderColor: "var(--asc-blue-border)",
                background: "var(--asc-blue-bg)",
                color: "var(--asc-blue)",
              } as CSSProperties}
            />
          </form>
          <form action={cancelPendingAction}>
            <AdminConfirmSubmitButton
              label="Cancel pending"
              danger
              confirmTitle="Cancel pending events?"
              confirmDescription="Cancels queued, failed, and processing bot events."
              confirmLabel="Cancel pending"
              className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
              style={{
                borderColor: "var(--asc-live-border)",
                background: "var(--asc-live-bg)",
                color: "var(--asc-live)",
              } as CSSProperties}
            />
          </form>
        </div>
      </div>
    </section>
  );
}

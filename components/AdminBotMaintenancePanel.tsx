import type { Prisma } from "@prisma/client";
import AdminConfirmSubmitButton from "@/components/AdminConfirmSubmitButton";
import {
  cleanupOldBotEventsMaintenanceInline,
  cleanupOldCommandLogsMaintenanceInline,
  cleanupOldFailedBotEventsMaintenanceInline,
  cleanupOldRealtimeEventsMaintenanceInline,
} from "@/actions/adminBotMaintenanceActions";
import { prisma } from "@/lib/prisma";

const commandLogWhere: Prisma.BotEventWhereInput = {
  OR: [
    { type: "slash_command_used" },
    { type: "slash_command_failed" },
    { entityType: "slash_command" },
  ],
};

function getCutoffDate(days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return cutoffDate;
}

const toneStyleMap: Record<string, React.CSSProperties> = {
  default: { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" },
  success: { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" },
  danger: { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" },
  info: { borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" },
};

function StatCard({ label, value, tone = "default" }: { label: string; value: number | string; tone?: "default" | "success" | "danger" | "info" }) {
  return (
    <div className="border p-5" style={toneStyleMap[tone]}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function DaysSelect({ name = "days", defaultValue = 30 }: { name?: string; defaultValue?: number }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="border px-4 py-3 text-sm font-bold outline-none transition"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" }}
    >
      <option value="1">1 day</option>
      <option value="3">3 days</option>
      <option value="7">7 days</option>
      <option value="14">14 days</option>
      <option value="30">30 days</option>
      <option value="60">60 days</option>
      <option value="90">90 days</option>
    </select>
  );
}

function MaintenanceActionCard({
  title, description, defaultDays, buttonLabel, action, danger = false,
}: {
  title: string; description: string; defaultDays: number; buttonLabel: string;
  action: (formData: FormData) => Promise<void>; danger?: boolean;
}) {
  return (
    <form
      action={action}
      className="border p-6 shadow-2xl shadow-black/20"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div className="mb-5">
        <h3 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h3>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>Older than</span>
          <DaysSelect defaultValue={defaultDays} />
        </label>

        <AdminConfirmSubmitButton
          label={buttonLabel}
          danger={danger}
          confirmTitle={danger ? "Delete old failed events?" : "Run maintenance cleanup?"}
          confirmDescription={danger
            ? "This will permanently delete old failed bot events based on the selected number of days. Use this only after reviewing old errors."
            : "This will permanently delete old maintenance data based on the selected number of days. This action cannot be undone."}
          confirmLabel={danger ? "Delete" : "Clean"}
        />
      </div>
    </form>
  );
}

export default async function AdminBotMaintenancePanel() {
  const oldBotEventsCutoff = getCutoffDate(30);
  const oldRealtimeCutoff = getCutoffDate(7);
  const oldCommandCutoff = getCutoffDate(30);

  const [
    totalBotEvents, queuedBotEvents, processingBotEvents, completedBotEvents,
    failedBotEvents, cancelledBotEvents, oldCompletedBotEvents, oldFailedBotEvents,
    totalRealtimeEvents, oldRealtimeEvents, totalCommandLogs, oldCommandLogs,
  ] = await Promise.all([
    prisma.botEvent.count(),
    prisma.botEvent.count({ where: { status: "queued" } }),
    prisma.botEvent.count({ where: { status: "processing" } }),
    prisma.botEvent.count({ where: { status: "completed" } }),
    prisma.botEvent.count({ where: { status: "failed" } }),
    prisma.botEvent.count({ where: { status: "cancelled" } }),
    prisma.botEvent.count({ where: { status: { in: ["completed", "cancelled"] }, updatedAt: { lt: oldBotEventsCutoff } } }),
    prisma.botEvent.count({ where: { status: "failed", updatedAt: { lt: oldBotEventsCutoff } } }),
    prisma.realtimeEvent.count(),
    prisma.realtimeEvent.count({ where: { createdAt: { lt: oldRealtimeCutoff } } }),
    prisma.botEvent.count({ where: commandLogWhere }),
    prisma.botEvent.count({ where: { AND: [commandLogWhere, { createdAt: { lt: oldCommandCutoff } }] } }),
  ]);

  return (
    <section className="grid gap-6">
      <div
        className="border p-6 shadow-2xl shadow-black/20"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>Bot Maintenance</p>
          <h2 className="text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>Database Maintenance</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Clean old bot logs, command logs, and realtime events to keep the dashboard fast and the database lightweight.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Bot Events" value={totalBotEvents} />
          <StatCard label="Command Logs" value={totalCommandLogs} tone="info" />
          <StatCard label="Realtime Events" value={totalRealtimeEvents} />
          <StatCard label="Failed Events" value={failedBotEvents} tone="danger" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Queued" value={queuedBotEvents} tone="info" />
        <StatCard label="Processing" value={processingBotEvents} tone="info" />
        <StatCard label="Completed" value={completedBotEvents} tone="success" />
        <StatCard label="Cancelled" value={cancelledBotEvents} />
        <StatCard label="Old Bot Events" value={oldCompletedBotEvents} />
        <StatCard label="Old Failed" value={oldFailedBotEvents} tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <MaintenanceActionCard
          title="Clean old bot events"
          description="Deletes completed and cancelled bot events older than the selected number of days. Failed, queued, and processing events are preserved."
          defaultDays={30}
          buttonLabel="Clean bot events"
          action={cleanupOldBotEventsMaintenanceInline}
        />
        <MaintenanceActionCard
          title="Clean old command logs"
          description="Deletes stored Discord slash command logs older than the selected number of days. Recent logs and analytics remain available."
          defaultDays={30}
          buttonLabel="Clean command logs"
          action={cleanupOldCommandLogsMaintenanceInline}
        />
        <MaintenanceActionCard
          title="Clean old realtime events"
          description={`Deletes realtime events older than the selected number of days. Currently ${oldRealtimeEvents} realtime event(s) are older than 7 days.`}
          defaultDays={7}
          buttonLabel="Clean realtime events"
          action={cleanupOldRealtimeEventsMaintenanceInline}
        />
        <MaintenanceActionCard
          title="Clean old failed events"
          description="Deletes failed bot events older than the selected number of days. Keep recent failures until you finish debugging them."
          defaultDays={30}
          buttonLabel="Delete old failed events"
          action={cleanupOldFailedBotEventsMaintenanceInline}
          danger
        />
      </div>
    </section>
  );
}

import type { Prisma } from "@prisma/client";
import AdminConfirmSubmitButton from "@/components/AdminConfirmSubmitButton";
import {
  cleanupFailedCommandLogsMaintenanceInline,
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

function SummaryRow({ label, value, tone = "default" }: { label: string; value: number | string; tone?: "default" | "success" | "danger" | "info" }) {
  const color =
    tone === "success"
      ? "var(--asc-green)"
      : tone === "danger"
        ? "var(--asc-live)"
        : tone === "info"
          ? "var(--asc-accent)"
          : "var(--asc-fg-0)";

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p className="text-sm font-bold" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="text-sm font-black tabular-nums" style={{ color }}>{value}</p>
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
  title,
  description,
  defaultDays = 30,
  buttonLabel,
  action,
  danger = false,
  showDays = true,
  confirmTitle,
  confirmDescription,
  confirmLabel,
}: {
  title: string;
  description: string;
  defaultDays?: number;
  buttonLabel: string;
  action: (formData: FormData) => Promise<void>;
  danger?: boolean;
  showDays?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
}) {
  return (
    <form
      action={action}
      className="grid gap-4 border p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <div>
        <h3 className="text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h3>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{description}</p>
      </div>

      <div className={showDays ? "grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" : "flex items-end lg:justify-end"}>
        {showDays && (
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-fg-3)" }}>Older than</span>
            <DaysSelect defaultValue={defaultDays} />
          </label>
        )}

        <AdminConfirmSubmitButton
          label={buttonLabel}
          danger={danger}
          confirmTitle={confirmTitle || (danger ? "Delete maintenance data?" : "Run maintenance cleanup?")}
          confirmDescription={confirmDescription || (danger
            ? "Deletes selected maintenance data."
            : "Deletes maintenance data using the selected age.")}
          confirmLabel={confirmLabel || (danger ? "Delete" : "Clean")}
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
        className="overflow-hidden border shadow-2xl shadow-black/20"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Bot maintenance</p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Cleanup status</h2>
        </div>

        <div className="grid lg:grid-cols-2">
          <div>
            <SummaryRow label="Bot events" value={totalBotEvents} />
            <SummaryRow label="Queued" value={queuedBotEvents} tone="info" />
            <SummaryRow label="Processing" value={processingBotEvents} tone="info" />
            <SummaryRow label="Completed" value={completedBotEvents} tone="success" />
            <SummaryRow label="Cancelled" value={cancelledBotEvents} />
            <SummaryRow label="Failed" value={failedBotEvents} tone="danger" />
          </div>
          <div className="lg:border-l" style={{ borderColor: "var(--asc-line-soft)" }}>
            <SummaryRow label="Old completed/cancelled events" value={oldCompletedBotEvents} />
            <SummaryRow label="Old failed events" value={oldFailedBotEvents} tone="danger" />
            <SummaryRow label="Command logs" value={totalCommandLogs} tone="info" />
            <SummaryRow label="Old command logs" value={oldCommandLogs} />
            <SummaryRow label="Realtime events" value={totalRealtimeEvents} />
            <SummaryRow label="Old realtime events" value={oldRealtimeEvents} />
          </div>
        </div>
      </div>

      <div
        className="grid gap-4 border p-5 shadow-2xl shadow-black/20"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Operations</p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Cleanup actions</h2>
        </div>

        <MaintenanceActionCard
          title="Clean old bot events"
          description="Deletes completed and cancelled bot events older than the selected number of days. Failed, queued, and processing events are preserved."
          defaultDays={30}
          buttonLabel="Clean bot events"
          action={cleanupOldBotEventsMaintenanceInline}
          confirmTitle="Clean old bot events?"
          confirmDescription="Deletes old completed and cancelled bot events."
          confirmLabel="Clean"
        />
        <MaintenanceActionCard
          title="Clean old command logs"
          description="Deletes stored Discord slash command logs older than the selected number of days. Recent logs and analytics remain available."
          defaultDays={30}
          buttonLabel="Clean command logs"
          action={cleanupOldCommandLogsMaintenanceInline}
          confirmTitle="Clean old command logs?"
          confirmDescription="Deletes old Discord command logs."
          confirmLabel="Clean"
        />
        <MaintenanceActionCard
          title="Delete failed command logs"
          description="Deletes failed Discord slash command logs after review."
          buttonLabel="Delete failed logs"
          action={cleanupFailedCommandLogsMaintenanceInline}
          danger
          showDays={false}
          confirmTitle="Delete failed command logs?"
          confirmDescription="Deletes all failed Discord command logs."
          confirmLabel="Delete"
        />
        <MaintenanceActionCard
          title="Clean old realtime events"
          description={`Deletes realtime events older than the selected number of days. Currently ${oldRealtimeEvents} realtime event(s) are older than 7 days.`}
          defaultDays={7}
          buttonLabel="Clean realtime events"
          action={cleanupOldRealtimeEventsMaintenanceInline}
          confirmTitle="Clean old realtime events?"
          confirmDescription="Deletes old realtime events."
          confirmLabel="Clean"
        />
        <MaintenanceActionCard
          title="Clean old failed events"
          description="Deletes failed bot events older than the selected number of days. Keep recent failures until you finish debugging them."
          defaultDays={30}
          buttonLabel="Delete old failed events"
          action={cleanupOldFailedBotEventsMaintenanceInline}
          danger
          confirmTitle="Delete old failed events?"
          confirmDescription="Deletes old failed bot events."
          confirmLabel="Delete"
        />
      </div>
    </section>
  );
}

import type { Prisma } from "@prisma/client";

import {
  cleanupOldBotEventsMaintenanceInline,
  cleanupOldCommandLogsMaintenanceInline,
  cleanupOldFailedBotEventsMaintenanceInline,
  cleanupOldRealtimeEventsMaintenanceInline,
} from "@/actions/adminBotMaintenanceActions";
import { prisma } from "@/lib/prisma";

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

function getCutoffDate(days: number) {
  const cutoffDate = new Date();

  cutoffDate.setDate(cutoffDate.getDate() - days);

  return cutoffDate;
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "danger" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : tone === "danger"
        ? "border-red-400/20 bg-red-500/10 text-red-200"
        : tone === "info"
          ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
          : "border-white/10 bg-black/20 text-gray-400";

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function DaysSelect({
  name = "days",
  defaultValue = 30,
}: {
  name?: string;
  defaultValue?: number;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-violet-400"
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
  defaultDays,
  buttonLabel,
  action,
  danger = false,
}: {
  title: string;
  description: string;
  defaultDays: number;
  buttonLabel: string;
  action: (formData: FormData) => Promise<void>;
  danger?: boolean;
}) {
  return (
    <form
      action={action}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20"
    >
      <div className="mb-5">
        <h3 className="text-xl font-black text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
            Older than
          </span>

          <DaysSelect defaultValue={defaultDays} />
        </label>

        <button
          type="submit"
          className={
            danger
              ? "rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/15 hover:text-white"
              : "rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
          }
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}

export default async function AdminBotMaintenancePanel() {
  const oldBotEventsCutoff = getCutoffDate(30);
  const oldRealtimeCutoff = getCutoffDate(7);
  const oldCommandCutoff = getCutoffDate(30);

  const [
    totalBotEvents,
    queuedBotEvents,
    processingBotEvents,
    completedBotEvents,
    failedBotEvents,
    cancelledBotEvents,
    oldCompletedBotEvents,
    oldFailedBotEvents,
    totalRealtimeEvents,
    oldRealtimeEvents,
    totalCommandLogs,
    oldCommandLogs,
  ] = await Promise.all([
    prisma.botEvent.count(),
    prisma.botEvent.count({ where: { status: "queued" } }),
    prisma.botEvent.count({ where: { status: "processing" } }),
    prisma.botEvent.count({ where: { status: "completed" } }),
    prisma.botEvent.count({ where: { status: "failed" } }),
    prisma.botEvent.count({ where: { status: "cancelled" } }),
    prisma.botEvent.count({
      where: {
        status: {
          in: ["completed", "cancelled"],
        },
        updatedAt: {
          lt: oldBotEventsCutoff,
        },
      },
    }),
    prisma.botEvent.count({
      where: {
        status: "failed",
        updatedAt: {
          lt: oldBotEventsCutoff,
        },
      },
    }),
    prisma.realtimeEvent.count(),
    prisma.realtimeEvent.count({
      where: {
        createdAt: {
          lt: oldRealtimeCutoff,
        },
      },
    }),
    prisma.botEvent.count({
      where: commandLogWhere,
    }),
    prisma.botEvent.count({
      where: {
        AND: [
          commandLogWhere,
          {
            createdAt: {
              lt: oldCommandCutoff,
            },
          },
        ],
      },
    }),
  ]);

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
            Bot Maintenance
          </p>

          <h2 className="text-3xl font-black text-white">
            Database Maintenance
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Clean old bot logs, command logs, and realtime events to keep the
            dashboard fast and the database lightweight.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Bot Events" value={totalBotEvents} />
          <StatCard label="Command Logs" value={totalCommandLogs} tone="info" />
          <StatCard label="Realtime Events" value={totalRealtimeEvents} />
          <StatCard
            label="Failed Events"
            value={failedBotEvents}
            tone="danger"
          />
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

import {
  pauseBotQueueInline,
  queueBotHealthCheckInline,
  queueBotRefreshConfigInline,
  queueBotRestartInline,
  resumeBotQueueInline,
} from "@/actions/adminBotEventInlineActions";
import { prisma } from "@/lib/prisma";

async function pauseQueueFormAction() {
  "use server";

  await pauseBotQueueInline();
}

async function resumeQueueFormAction() {
  "use server";

  await resumeBotQueueInline();
}

async function healthCheckFormAction() {
  "use server";

  await queueBotHealthCheckInline();
}

async function refreshConfigFormAction() {
  "use server";

  await queueBotRefreshConfigInline();
}

async function restartBotFormAction() {
  "use server";

  await queueBotRestartInline();
}

function ControlButton({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "danger" | "blue";
}) {
  const styles = {
    default:
      "border-violet-400/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20",
    success:
      "border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15",
    danger: "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/15",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15",
  };

  return (
    <button
      type="submit"
      className={`rounded-xl border px-4 py-3 text-sm font-black transition ${styles[tone]}`}
    >
      {label}
    </button>
  );
}

function RuntimeStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 truncate text-xl font-black text-white">{value}</p>
    </div>
  );
}

export default async function AdminBotControlsPanel() {
  const [queuePausedSetting, queuedCount, processingCount, failedCount] =
    await Promise.all([
      prisma.serverSetting.findUnique({
        where: {
          key: "bot.queue.paused",
        },
      }),
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
          status: "failed",
        },
      }),
    ]);

  const queuePaused = queuePausedSetting?.value === "true";

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="grid gap-5 border-b border-white/10 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Runtime
          </p>

          <h2 className="mt-1 text-xl font-black text-white">Bot controls</h2>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
            queuePaused
              ? "border-red-400/25 bg-red-500/10 text-red-200"
              : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {queuePaused ? "Queue paused" : "Queue running"}
        </span>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <RuntimeStat label="Queued" value={queuedCount} />
        <RuntimeStat label="Processing" value={processingCount} />
        <RuntimeStat label="Failed" value={failedCount} />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/10 p-5">
        {queuePaused ? (
          <form action={resumeQueueFormAction}>
            <ControlButton label="Resume queue" tone="success" />
          </form>
        ) : (
          <form action={pauseQueueFormAction}>
            <ControlButton label="Pause queue" />
          </form>
        )}

        <form action={healthCheckFormAction}>
          <ControlButton label="Health check" tone="blue" />
        </form>

        <form action={refreshConfigFormAction}>
          <ControlButton label="Refresh config" />
        </form>

        <form action={restartBotFormAction}>
          <ControlButton label="Restart bot" tone="danger" />
        </form>
      </div>
    </section>
  );
}

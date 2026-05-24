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

const controlButtonStyles: Record<string, React.CSSProperties> = {
  default: { borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" },
  success: { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" },
  danger: { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" },
  blue: { borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)", color: "var(--asc-blue)" },
};

function ControlButton({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "danger" | "blue" }) {
  return (
    <button
      type="submit"
      className="border px-4 py-3 text-sm font-black transition hover:opacity-90"
      style={controlButtonStyles[tone]}
    >
      {label}
    </button>
  );
}

function RuntimeStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border p-4" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-2 truncate text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

export default async function AdminBotControlsPanel() {
  const [queuePausedSetting, queuedCount, processingCount, failedCount] = await Promise.all([
    prisma.serverSetting.findUnique({ where: { key: "bot.queue.paused" } }),
    prisma.botEvent.count({ where: { status: "queued" } }),
    prisma.botEvent.count({ where: { status: "processing" } }),
    prisma.botEvent.count({ where: { status: "failed" } }),
  ]);

  const queuePaused = queuePausedSetting?.value === "true";

  return (
    <section
      className="overflow-hidden border shadow-2xl shadow-black/20"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="grid gap-5 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Runtime</p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Bot controls</h2>
        </div>

        <span
          className="inline-flex w-fit border px-3 py-1 text-xs font-black"
          style={queuePaused
            ? { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }
            : { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }}
        >
          {queuePaused ? "Queue paused" : "Queue running"}
        </span>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <RuntimeStat label="Queued" value={queuedCount} />
        <RuntimeStat label="Processing" value={processingCount} />
        <RuntimeStat label="Failed" value={failedCount} />
      </div>

      <div className="flex flex-wrap gap-3 p-5" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
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

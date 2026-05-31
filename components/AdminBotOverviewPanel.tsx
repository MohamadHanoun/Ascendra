import type { CSSProperties } from "react";

import AdminConfirmSubmitButton from "@/components/AdminConfirmSubmitButton";
import {
  pauseBotQueueInline,
  queueBotHealthCheckInline,
  queueBotRefreshConfigInline,
  queueBotRestartInline,
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

async function healthCheckAction() {
  "use server";
  await queueBotHealthCheckInline();
}

async function refreshConfigAction() {
  "use server";
  await queueBotRefreshConfigInline();
}

async function restartBotAction() {
  "use server";
  await queueBotRestartInline();
}

function getSettingValue(settings: Array<{ key: string; value: string }>, key: string) {
  return settings.find((s) => s.key === key)?.value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getHealthBool(result: unknown, key: string) {
  if (!isRecord(result)) return false;
  return result[key] === true;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-SE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatUptime(value: string | undefined) {
  const ms = Number(value || 0);
  if (!Number.isFinite(ms) || ms <= 0) return "-";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getBotOnline(lastHeartbeatAt?: string) {
  if (!lastHeartbeatAt) return false;
  const date = new Date(lastHeartbeatAt);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= 90000;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black"
      style={
        ok
          ? { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }
          : { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" }
      }
    >
      {label}
    </span>
  );
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

export default async function AdminBotOverviewPanel() {
  const [settings, queuePausedSetting, queuedCount, processingCount, failedCount, lastHealthCheck] =
    await Promise.all([
      prisma.serverSetting.findMany({
        where: { key: { in: ["bot.lastHeartbeatAt", "bot.tag", "bot.guildId", "bot.uptimeMs"] } },
      }),
      prisma.serverSetting.findUnique({ where: { key: "bot.queue.paused" } }),
      prisma.botEvent.count({ where: { status: "queued" } }),
      prisma.botEvent.count({ where: { status: "processing" } }),
      prisma.botEvent.count({ where: { status: "failed" } }),
      prisma.botEvent.findFirst({
        where: { type: "bot_command_health_check", status: "completed" },
        orderBy: { processedAt: "desc" },
      }),
    ]);

  const botTag = getSettingValue(settings, "bot.tag") || "-";
  const guildId = getSettingValue(settings, "bot.guildId") || "-";
  const uptimeMs = getSettingValue(settings, "bot.uptimeMs");
  const lastHeartbeatAt = getSettingValue(settings, "bot.lastHeartbeatAt");
  const online = getBotOnline(lastHeartbeatAt);
  const queuePaused = queuePausedSetting?.value === "true";
  const healthResult = lastHealthCheck?.result;
  const checked = Boolean(lastHealthCheck);
  const guildName = isRecord(healthResult) ? String(healthResult.guildName || guildId) : guildId;

  const permChecks = [
    "announcementChannel",
    "announcementChannelPermissions",
    "botLogChannel",
    "botLogChannelPermissions",
    "tournamentLogChannel",
    "tournamentLogChannelPermissions",
    "inviteChannel",
    "inviteChannelPermissions",
    "tournamentCategory",
    "manageRoles",
    "manageChannels",
  ];
  const permOk = checked
    ? permChecks.filter((k) => getHealthBool(healthResult, k)).length
    : null;
  const permTotal = permChecks.length;

  const slashReady = checked ? getHealthBool(healthResult, "slashCommandsReady") : null;

  const queueSummary = queuePaused
    ? "Paused"
    : `Running - ${queuedCount} queued - ${processingCount} processing - ${failedCount} failed`;

  const rows: Array<{ label: string; value: string; ok?: boolean }> = [
    { label: "Bot", value: botTag, ok: online },
    { label: "Heartbeat", value: formatDate(lastHeartbeatAt) },
    { label: "Uptime", value: formatUptime(uptimeMs) },
    { label: "Guild", value: guildName },
    { label: "Queue", value: queueSummary, ok: !queuePaused },
    {
      label: "Permissions",
      value: permOk === null ? "Run health check" : `${permOk}/${permTotal} OK`,
      ok: permOk === null ? undefined : permOk === permTotal,
    },
    {
      label: "Slash commands",
      value: slashReady === null ? "Run health check" : slashReady ? "Ready" : "Error",
      ok: slashReady === null ? undefined : slashReady,
    },
  ];

  return (
    <section className="grid gap-6">
      <div
        className="overflow-hidden border shadow-2xl shadow-black/20"
        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
        >
          <p
            className="text-xs font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Overview
          </p>
          <StatusBadge ok={online} label={online ? "Online" : "Offline"} />
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
              <button
                type="submit"
                className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-2)",
                  color: "var(--asc-fg-2)",
                }}
              >
                Pause queue
              </button>
            </form>
          )}

          <form action={healthCheckAction}>
            <button
              type="submit"
              className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
              style={{
                borderColor: "var(--asc-accent-border)",
                background: "var(--asc-accent-dim)",
                color: "var(--asc-accent)",
              }}
            >
              Health check
            </button>
          </form>

          <form action={refreshConfigAction}>
            <button
              type="submit"
              className="border px-4 py-2 text-sm font-black transition hover:opacity-90"
              style={{
                borderColor: "var(--asc-accent-border)",
                background: "var(--asc-accent-dim)",
                color: "var(--asc-accent)",
              }}
            >
              Refresh config
            </button>
          </form>

          <form action={restartBotAction}>
            <AdminConfirmSubmitButton
              label="Restart bot"
              danger
              confirmTitle="Restart bot?"
              confirmDescription="Queues a restart command. The bot will shut down and restart via its process supervisor."
              confirmLabel="Restart"
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

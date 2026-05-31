import { prisma } from "@/lib/prisma";

function getSettingValue(
  settings: Array<{ key: string; value: string }>,
  key: string,
) {
  return settings.find((setting) => setting.key === key)?.value;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-SE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatUptime(value: string | number | undefined) {
  const uptimeMs = Number(value || 0);
  if (!Number.isFinite(uptimeMs) || uptimeMs <= 0) return "-";
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getHealthValue(result: unknown, key: string) {
  if (!isRecord(result)) return undefined;
  return result[key];
}

function getHealthBool(result: unknown, key: string) {
  return getHealthValue(result, key) === true;
}

function getBotStatus(lastHeartbeatAt?: string) {
  if (!lastHeartbeatAt) return { label: "Offline", ok: false, date: null as Date | null };
  const date = new Date(lastHeartbeatAt);
  if (Number.isNaN(date.getTime())) return { label: "Offline", ok: false, date: null as Date | null };
  const online = Date.now() - date.getTime() <= 90000;
  return { label: online ? "Online" : "Offline", ok: online, date };
}

function HealthBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black"
      style={ok
        ? { borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }
        : { borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)", color: "var(--asc-live)" }}
    >
      {label}
    </span>
  );
}

function HealthCard({ label, value, ok }: { label: string; value: string | number; ok?: boolean }) {
  return (
    <div className="border p-4" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
          {label}
        </p>
        {typeof ok === "boolean" && (
          <span
            className="h-2.5 w-2.5 dot"
            style={{ background: ok ? "var(--asc-green)" : "var(--asc-live)" }}
          />
        )}
      </div>
      <p className="mt-2 truncate text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function PermissionCard({ label, ready, checked }: { label: string; ready: boolean; checked: boolean }) {
  return (
    <HealthCard
      label={label}
      value={!checked ? "-" : ready ? "OK" : "Missing"}
      ok={checked ? ready : undefined}
    />
  );
}

export default async function AdminBotHealthPanel() {
  const [
    settings,
    queuePausedSetting,
    queuedCount,
    processingCount,
    failedCount,
    lastHealthCheck,
  ] = await Promise.all([
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

  const botTag = getSettingValue(settings, "bot.tag") || "Unknown";
  const guildId = getSettingValue(settings, "bot.guildId") || "-";
  const uptimeMs = getSettingValue(settings, "bot.uptimeMs");
  const lastHeartbeatAt = getSettingValue(settings, "bot.lastHeartbeatAt");
  const botStatus = getBotStatus(lastHeartbeatAt);
  const queuePaused = queuePausedSetting?.value === "true";
  const healthResult = lastHealthCheck?.result;
  const checked = Boolean(lastHealthCheck);
  const guildName = getHealthValue(healthResult, "guildName");

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
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Health</p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Bot status</h2>
        </div>
        <HealthBadge label={botStatus.label} ok={botStatus.ok} />
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <HealthCard label="Bot" value={botTag} ok={botStatus.ok} />
        <HealthCard label="Heartbeat" value={formatDate(botStatus.date)} />
        <HealthCard label="Uptime" value={formatUptime(uptimeMs)} />
        <HealthCard label="Queue" value={queuePaused ? "Paused" : "Running"} ok={!queuePaused} />
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
        <HealthCard label="Queued" value={queuedCount} ok={queuedCount < 10} />
        <HealthCard label="Processing" value={processingCount} ok={processingCount === 0} />
        <HealthCard label="Failed" value={failedCount} ok={failedCount === 0} />
        <HealthCard label="Guild" value={String(guildName || guildId)} />
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
        <PermissionCard
          label="Announcements"
          ready={getHealthBool(healthResult, "announcementChannel") && getHealthBool(healthResult, "announcementChannelPermissions")}
          checked={checked}
        />
        <PermissionCard
          label="Bot logs"
          ready={getHealthBool(healthResult, "botLogChannel") && getHealthBool(healthResult, "botLogChannelPermissions")}
          checked={checked}
        />
        <PermissionCard
          label="Tournament logs"
          ready={getHealthBool(healthResult, "tournamentLogChannel") && getHealthBool(healthResult, "tournamentLogChannelPermissions")}
          checked={checked}
        />
        <PermissionCard
          label="Invite channel"
          ready={getHealthBool(healthResult, "inviteChannel") && getHealthBool(healthResult, "inviteChannelPermissions")}
          checked={checked}
        />
        <PermissionCard label="Tournament category" ready={getHealthBool(healthResult, "tournamentCategory")} checked={checked} />
        <PermissionCard label="Manage roles" ready={getHealthBool(healthResult, "manageRoles")} checked={checked} />
        <PermissionCard label="Manage channels" ready={getHealthBool(healthResult, "manageChannels")} checked={checked} />
        <PermissionCard label="Slash commands" ready={getHealthBool(healthResult, "slashCommandsReady")} checked={checked} />
        <HealthCard label="Last health check" value={formatDate(lastHealthCheck?.processedAt)} />
      </div>
    </section>
  );
}

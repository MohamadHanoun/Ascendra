const requiredPermissions = [
  "View Channels", "Send Messages", "Embed Links", "Read Message History",
  "Manage Roles", "Manage Channels", "Connect", "Speak",
];

const permissionBits = {
  manageChannels: 16, viewChannel: 1024, sendMessages: 2048, embedLinks: 16384,
  readMessageHistory: 65536, manageRoles: 268435456, connect: 1048576, speak: 2097152,
  useVad: 33554432,
};

function getClientId() {
  return (process.env.DISCORD_CLIENT_ID || process.env.AUTH_DISCORD_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "").trim();
}

function getPermissionValue() {
  return Object.values(permissionBits).reduce((total, value) => total + value, 0).toString();
}

function getInviteUrl(clientId: string) {
  if (!clientId) return "";
  const params = new URLSearchParams({ client_id: clientId, permissions: getPermissionValue(), scope: "bot applications.commands" });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border p-4" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>{label}</p>
      <p className="mt-2 truncate text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

export default function AdminBotInvitePanel() {
  const clientId = getClientId();
  const inviteUrl = getInviteUrl(clientId);
  const permissionValue = getPermissionValue();

  return (
    <section
      className="overflow-hidden border shadow-2xl shadow-black/20"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Invite</p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Bot invite</h2>
        </div>
        <StatusBadge ok={Boolean(clientId)} label={clientId ? "Ready" : "Missing client ID"} />
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Client ID" value={clientId || "-"} />
        <InfoCard label="Permissions" value={permissionValue} />
        <InfoCard label="Scope" value="bot + commands" />
        <InfoCard label="Status" value={clientId ? "Ready" : "Missing"} />
      </div>

      <div className="grid gap-4 p-5" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Invite URL</span>
          <input
            readOnly
            value={inviteUrl || "Set DISCORD_CLIENT_ID or AUTH_DISCORD_ID"}
            className="border px-4 py-3 text-sm font-bold outline-none"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" }}
          />
        </label>

        {inviteUrl && (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
            className="w-fit px-5 py-3 text-sm font-black transition hover:opacity-90"
            style={{ background: "var(--asc-accent-2)", color: "var(--asc-on-accent)" }}
          >
            Open invite
          </a>
        )}
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
        {requiredPermissions.map((permission) => (
          <div
            key={permission}
            className="border px-4 py-3 text-sm font-black"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" }}
          >
            {permission}
          </div>
        ))}
      </div>
    </section>
  );
}

const requiredPermissions = [
  "View Channels",
  "Send Messages",
  "Embed Links",
  "Read Message History",
  "Manage Roles",
  "Manage Channels",
  "Connect",
  "Speak",
];

const permissionBits = {
  manageChannels: 16,
  viewChannel: 1024,
  sendMessages: 2048,
  embedLinks: 16384,
  readMessageHistory: 65536,
  manageRoles: 268435456,
  connect: 1048576,
  speak: 2097152,
  useVad: 33554432,
};

function getClientId() {
  return (
    process.env.DISCORD_CLIENT_ID ||
    process.env.AUTH_DISCORD_ID ||
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ||
    ""
  ).trim();
}

function getPermissionValue() {
  return Object.values(permissionBits)
    .reduce((total, value) => total + value, 0)
    .toString();
}

function getInviteUrl(clientId: string) {
  if (!clientId) {
    return "";
  }

  const params = new URLSearchParams({
    client_id: clientId,
    permissions: getPermissionValue(),
    scope: "bot applications.commands",
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        ok
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
          : "border-red-400/25 bg-red-500/10 text-red-200"
      }`}
    >
      {label}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 truncate text-xl font-black text-white">{value}</p>
    </div>
  );
}

export default function AdminBotInvitePanel() {
  const clientId = getClientId();
  const inviteUrl = getInviteUrl(clientId);
  const permissionValue = getPermissionValue();

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="grid gap-4 border-b border-white/10 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Invite
          </p>

          <h2 className="mt-1 text-xl font-black text-white">Bot invite</h2>
        </div>

        <StatusBadge
          ok={Boolean(clientId)}
          label={clientId ? "Ready" : "Missing client ID"}
        />
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Client ID" value={clientId || "-"} />
        <InfoCard label="Permissions" value={permissionValue} />
        <InfoCard label="Scope" value="bot + commands" />
        <InfoCard label="Status" value={clientId ? "Ready" : "Missing"} />
      </div>

      <div className="grid gap-4 border-t border-white/10 p-5">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-gray-200">Invite URL</span>

          <input
            readOnly
            value={inviteUrl || "Set DISCORD_CLIENT_ID or AUTH_DISCORD_ID"}
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none"
          />
        </label>

        {inviteUrl && (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
          >
            Open invite
          </a>
        )}
      </div>

      <div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {requiredPermissions.map((permission) => (
          <div
            key={permission}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-gray-200"
          >
            {permission}
          </div>
        ))}
      </div>
    </section>
  );
}

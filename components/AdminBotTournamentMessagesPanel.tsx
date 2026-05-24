import {
  deleteTournamentDiscordMessageInline,
  recreateTournamentDiscordMessageInline,
  syncTournamentDiscordMessageInline,
} from "@/actions/adminBotTournamentMessageActions";
import { prisma } from "@/lib/prisma";

async function syncMessageFormAction(formData: FormData) {
  "use server";
  await syncTournamentDiscordMessageInline(formData);
}

async function recreateMessageFormAction(formData: FormData) {
  "use server";
  await recreateTournamentDiscordMessageInline(formData);
}

async function deleteMessageFormAction(formData: FormData) {
  "use server";
  await deleteTournamentDiscordMessageInline(formData);
}

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return new Intl.DateTimeFormat("en-SE", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function StatusBadge({ linked, error }: { linked: boolean; error?: string | null }) {
  if (error) {
    return (
      <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }}>
        Error
      </span>
    );
  }
  if (linked) {
    return (
      <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" }}>
        Linked
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={{ borderColor: "var(--asc-line-soft)", background: "transparent", color: "var(--asc-fg-3)" }}>
      Not synced
    </span>
  );
}

const actionButtonStyles: Record<string, React.CSSProperties> = {
  default: { borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" },
  danger: { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" },
  blue: { borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)", color: "var(--asc-blue)" },
};

function ActionButton({ label, tone = "default", disabled = false }: { label: string; tone?: "default" | "danger" | "blue"; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="border px-4 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
      style={actionButtonStyles[tone]}
    >
      {label}
    </button>
  );
}

export default async function AdminBotTournamentMessagesPanel() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true, title: true, game: { select: { name: true } }, status: true,
      registrationStatus: true, discordAnnouncementUrl: true,
      discordAnnouncementMessageId: true, discordAnnouncementSyncedAt: true,
      discordAnnouncementLastError: true,
    },
  });

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
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Tournament messages</p>
          <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Discord sync</h2>
        </div>
        <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>{tournaments.length} shown</p>
      </div>

      <div>
        {tournaments.length === 0 ? (
          <div className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>No tournaments found.</div>
        ) : (
          tournaments.map((tournament, idx) => {
            const linked = Boolean(tournament.discordAnnouncementMessageId);
            const hasError = Boolean(tournament.discordAnnouncementLastError);

            return (
              <article
                key={tournament.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035]"
                style={idx < tournaments.length - 1 ? { borderBottom: "1px solid var(--asc-line-soft)" } : {}}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_120px_160px_260px] xl:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>{tournament.title}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                      {tournament.game?.name ?? "—"} · {tournament.status} · {tournament.registrationStatus}
                    </p>
                  </div>

                  <StatusBadge linked={linked} error={tournament.discordAnnouncementLastError} />

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>Last sync</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-0)" }}>{formatDate(tournament.discordAnnouncementSyncedAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {tournament.discordAnnouncementUrl && (
                      <a
                        href={tournament.discordAnnouncementUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border px-4 py-2 text-xs font-black transition hover:opacity-90"
                        style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
                      >
                        Open
                      </a>
                    )}
                    <form action={syncMessageFormAction}>
                      <input type="hidden" name="tournamentId" value={tournament.id} />
                      <ActionButton label="Sync" tone="blue" />
                    </form>
                    <form action={recreateMessageFormAction}>
                      <input type="hidden" name="tournamentId" value={tournament.id} />
                      <ActionButton label="Recreate" />
                    </form>
                    <form action={deleteMessageFormAction}>
                      <input type="hidden" name="tournamentId" value={tournament.id} />
                      <ActionButton label="Delete" tone="danger" disabled={!linked} />
                    </form>
                  </div>
                </div>

                {hasError && (
                  <p
                    className="border px-4 py-3 text-sm leading-6"
                    style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }}
                  >
                    {tournament.discordAnnouncementLastError}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

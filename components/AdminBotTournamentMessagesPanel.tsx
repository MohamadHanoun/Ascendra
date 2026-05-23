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
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return new Intl.DateTimeFormat("en-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function StatusBadge({
  linked,
  error,
}: {
  linked: boolean;
  error?: string | null;
}) {
  if (error) {
    return (
      <span className="inline-flex w-fit rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-200">
        Error
      </span>
    );
  }

  if (linked) {
    return (
      <span className="inline-flex w-fit rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">
        Linked
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-gray-300">
      Not synced
    </span>
  );
}

function ActionButton({
  label,
  tone = "default",
  disabled = false,
}: {
  label: string;
  tone?: "default" | "danger" | "blue";
  disabled?: boolean;
}) {
  const styles = {
    default:
      "border-violet-400/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20",
    danger: "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/15",
    blue: "border-blue-400/25 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15",
  };

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`rounded-xl border px-4 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[tone]}`}
    >
      {label}
    </button>
  );
}

export default async function AdminBotTournamentMessagesPanel() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      title: true,
      game: true,
      status: true,
      registrationStatus: true,
      discordAnnouncementUrl: true,
      discordAnnouncementMessageId: true,
      discordAnnouncementSyncedAt: true,
      discordAnnouncementLastError: true,
    },
  });

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="grid gap-4 border-b border-white/10 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Tournament messages
          </p>

          <h2 className="mt-1 text-xl font-black text-white">Discord sync</h2>
        </div>

        <p className="text-sm text-gray-500">{tournaments.length} shown</p>
      </div>

      <div className="divide-y divide-white/10">
        {tournaments.length === 0 ? (
          <div className="p-5 text-sm text-gray-400">No tournaments found.</div>
        ) : (
          tournaments.map((tournament) => {
            const linked = Boolean(tournament.discordAnnouncementMessageId);
            const hasError = Boolean(tournament.discordAnnouncementLastError);

            return (
              <article
                key={tournament.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035]"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_120px_160px_260px] xl:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">
                      {tournament.title}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {tournament.game} · {tournament.status} ·{" "}
                      {tournament.registrationStatus}
                    </p>
                  </div>

                  <StatusBadge
                    linked={linked}
                    error={tournament.discordAnnouncementLastError}
                  />

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
                      Last sync
                    </p>

                    <p className="mt-1 text-sm text-gray-300">
                      {formatDate(tournament.discordAnnouncementSyncedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {tournament.discordAnnouncementUrl && (
                      <a
                        href={tournament.discordAnnouncementUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-xs font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
                      >
                        Open
                      </a>
                    )}

                    <form action={syncMessageFormAction}>
                      <input
                        type="hidden"
                        name="tournamentId"
                        value={tournament.id}
                      />

                      <ActionButton label="Sync" tone="blue" />
                    </form>

                    <form action={recreateMessageFormAction}>
                      <input
                        type="hidden"
                        name="tournamentId"
                        value={tournament.id}
                      />

                      <ActionButton label="Recreate" />
                    </form>

                    <form action={deleteMessageFormAction}>
                      <input
                        type="hidden"
                        name="tournamentId"
                        value={tournament.id}
                      />

                      <ActionButton
                        label="Delete"
                        tone="danger"
                        disabled={!linked}
                      />
                    </form>
                  </div>
                </div>

                {hasError && (
                  <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
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

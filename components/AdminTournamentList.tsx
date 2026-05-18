import {
  closeTournamentRegistrationInline,
  deleteTournamentInline,
  openTournamentRegistrationInline,
  setTournamentCancelledInline,
  setTournamentClosedInline,
  setTournamentOpenInline,
  setTournamentUpcomingInline,
  updateTournamentInline,
} from "@/actions/adminTournamentInlineActions";
import InlineAdminTournamentForm from "@/components/InlineAdminTournamentForm";
import { getTournamentImageUrl } from "@/lib/tournamentImages";
import { prisma } from "@/lib/prisma";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

type TournamentAction = (formData: FormData) => Promise<{
  ok: boolean;
  message: string;
  redirectTo?: string;
}>;

function StatusBadge({ label, status }: { label: string; status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    open: "border-green-500/20 bg-green-500/10 text-green-300",
    upcoming: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    closed: "border-red-500/20 bg-red-500/10 text-red-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {label}: {status}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function SmallAction({
  action,
  tournamentId,
  label,
  pendingLabel,
  variant = "secondary",
}: {
  action: TournamentAction;
  tournamentId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "success" | "danger" | "secondary";
}) {
  return (
    <InlineAdminTournamentForm
      action={action}
      buttonLabel={label}
      pendingLabel={pendingLabel}
      variant={variant}
      className="grid gap-2"
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
    </InlineAdminTournamentForm>
  );
}

export default async function AdminTournamentList() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      registrations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const openTournaments = tournaments.filter(
    (tournament) => tournament.status === "open",
  ).length;

  const openRegistrations = tournaments.filter(
    (tournament) => tournament.registrationStatus === "open",
  ).length;

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            Manage Tournaments
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Tournament list
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Edit tournament details, images, registration, status, or delete
            tournaments with confirmation.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total" value={tournaments.length} />
          <StatCard label="Open" value={openTournaments} />
          <StatCard label="Reg. open" value={openRegistrations} />
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No tournaments found.
        </div>
      ) : (
        <div className="grid gap-5">
          {tournaments.map((tournament) => {
            const registrationsCount = tournament.registrations.length;
            const remainingSlots = Math.max(
              tournament.maxSlots - registrationsCount,
              0,
            );
            const tournamentImage = getTournamentImageUrl(
              tournament.game,
              tournament.imageUrl,
            );

            return (
              <article
                key={tournament.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                <div className="border-b border-white/10 bg-white/[0.03] p-5">
                  <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_260px] xl:items-start">
                    <div
                      className="min-h-32 rounded-xl border border-white/10 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(11,15,26,0.1), rgba(11,15,26,0.75)), url("${tournamentImage}")`,
                      }}
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black text-white">
                          {tournament.title}
                        </h3>

                        <StatusBadge
                          label="Tournament"
                          status={tournament.status}
                        />

                        <StatusBadge
                          label="Registration"
                          status={tournament.registrationStatus}
                        />
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        {tournament.game} · {tournament.date}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <StatCard label="Slots" value={tournament.maxSlots} />
                      <StatCard label="Used" value={registrationsCount} />
                      <StatCard label="Left" value={remainingSlots} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
                  <InlineAdminTournamentForm
                    action={updateTournamentInline}
                    buttonLabel="Save changes"
                    pendingLabel="Saving..."
                    className="grid gap-4"
                  >
                    <input
                      type="hidden"
                      name="tournamentId"
                      value={tournament.id}
                    />
                    <input
                      type="hidden"
                      name="status"
                      value={tournament.status}
                    />
                    <input
                      type="hidden"
                      name="registrationStatus"
                      value={tournament.registrationStatus}
                    />

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                      <label className="grid gap-2">
                        <FieldLabel>Title</FieldLabel>

                        <input
                          name="title"
                          required
                          defaultValue={tournament.title}
                          className={inputClass()}
                        />
                      </label>

                      <label className="grid gap-2">
                        <FieldLabel>Game</FieldLabel>

                        <select
                          name="game"
                          required
                          defaultValue={tournament.game}
                          className={inputClass()}
                        >
                          {games.map((game) => (
                            <option key={game} value={game}>
                              {game}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="grid gap-2">
                      <FieldLabel>Image URL</FieldLabel>

                      <input
                        name="imageUrl"
                        defaultValue={tournament.imageUrl || ""}
                        placeholder="Optional custom image URL"
                        className={inputClass()}
                      />
                    </label>

                    <label className="grid gap-2">
                      <FieldLabel>Description</FieldLabel>

                      <textarea
                        name="description"
                        required
                        defaultValue={tournament.description}
                        className={`${inputClass()} min-h-24 resize-y text-sm leading-6`}
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label className="grid gap-2">
                        <FieldLabel>Date</FieldLabel>

                        <input
                          name="date"
                          required
                          defaultValue={tournament.date}
                          className={inputClass()}
                        />
                      </label>

                      <label className="grid gap-2">
                        <FieldLabel>Prize</FieldLabel>

                        <input
                          name="prize"
                          required
                          defaultValue={tournament.prize}
                          className={inputClass()}
                        />
                      </label>

                      <label className="grid gap-2">
                        <FieldLabel>Max slots</FieldLabel>

                        <input
                          name="maxSlots"
                          type="number"
                          min="1"
                          required
                          defaultValue={tournament.maxSlots}
                          className={inputClass()}
                        />
                      </label>

                      <label className="grid gap-2">
                        <FieldLabel>Team size</FieldLabel>

                        <input
                          name="teamSize"
                          type="number"
                          min="1"
                          required
                          defaultValue={tournament.teamSize}
                          className={inputClass()}
                        />
                      </label>
                    </div>
                  </InlineAdminTournamentForm>

                  <aside className="grid content-start gap-4">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                        Registration
                      </p>

                      <div className="mt-3 grid gap-2">
                        {tournament.registrationStatus === "open" ? (
                          <SmallAction
                            action={closeTournamentRegistrationInline}
                            tournamentId={tournament.id}
                            label="Close registration"
                            pendingLabel="Closing..."
                            variant="danger"
                          />
                        ) : (
                          <SmallAction
                            action={openTournamentRegistrationInline}
                            tournamentId={tournament.id}
                            label="Open registration"
                            pendingLabel="Opening..."
                            variant="success"
                          />
                        )}
                      </div>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                        Quick status
                      </p>

                      <div className="mt-3 grid gap-2">
                        {tournament.status !== "upcoming" && (
                          <SmallAction
                            action={setTournamentUpcomingInline}
                            tournamentId={tournament.id}
                            label="Set upcoming"
                            pendingLabel="Updating..."
                          />
                        )}

                        {tournament.status !== "open" && (
                          <SmallAction
                            action={setTournamentOpenInline}
                            tournamentId={tournament.id}
                            label="Set open"
                            pendingLabel="Updating..."
                            variant="success"
                          />
                        )}

                        {tournament.status !== "closed" && (
                          <SmallAction
                            action={setTournamentClosedInline}
                            tournamentId={tournament.id}
                            label="Set closed"
                            pendingLabel="Updating..."
                            variant="danger"
                          />
                        )}

                        {tournament.status !== "cancelled" && (
                          <SmallAction
                            action={setTournamentCancelledInline}
                            tournamentId={tournament.id}
                            label="Set cancelled"
                            pendingLabel="Updating..."
                            variant="danger"
                          />
                        )}
                      </div>
                    </section>

                    <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
                        Danger zone
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        Delete this tournament and its connected registrations.
                      </p>

                      <div className="mt-3">
                        <InlineAdminTournamentForm
                          action={deleteTournamentInline}
                          buttonLabel="Delete tournament"
                          pendingLabel="Deleting..."
                          variant="danger"
                          className="grid gap-2"
                          confirmTitle="Delete tournament?"
                          confirmDescription={`Are you sure you want to delete ${tournament.title}? This will also remove tournament registrations connected to it.`}
                          confirmLabel="Delete permanently"
                        >
                          <input
                            type="hidden"
                            name="tournamentId"
                            value={tournament.id}
                          />
                        </InlineAdminTournamentForm>
                      </div>
                    </section>
                  </aside>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

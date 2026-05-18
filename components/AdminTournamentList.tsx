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
import { prisma } from "@/lib/prisma";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

const tournamentStatuses = [
  { value: "upcoming", label: "Upcoming" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

const registrationStatuses = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    open: "border-green-500/20 bg-green-500/10 text-green-300",
    upcoming: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    registered: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    closed: "border-red-500/20 bg-red-500/10 text-red-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded border px-3 py-1 text-xs font-bold capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400";
}

function SmallAction({
  action,
  tournamentId,
  label,
  pendingLabel,
  variant = "secondary",
}: {
  action: (formData: FormData) => Promise<{
    ok: boolean;
    message: string;
    redirectTo?: string;
  }>;
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

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
          Manage Tournaments
        </p>

        <h2 className="mt-2 text-4xl font-black text-white">Tournament list</h2>

        <p className="mt-3 max-w-3xl text-gray-400">
          Edit tournament details, open or close registration, change status, or
          delete a tournament with confirmation.
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No tournaments found.
        </div>
      ) : (
        <div className="grid gap-6">
          {tournaments.map((tournament) => (
            <article
              key={tournament.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
            >
              <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-white">
                        {tournament.title}
                      </h3>

                      <StatusBadge status={tournament.status} />
                      <StatusBadge
                        status={`registration ${tournament.registrationStatus}`}
                      />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {tournament.game} · {tournament.date} ·{" "}
                      {tournament.registrations.length}/{tournament.maxSlots}{" "}
                      registrations
                    </p>
                  </div>

                  <InlineAdminTournamentForm
                    action={deleteTournamentInline}
                    buttonLabel="Delete"
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
              </div>

              <div className="grid gap-8 p-6 xl:grid-cols-[1fr_320px]">
                <InlineAdminTournamentForm
                  action={updateTournamentInline}
                  buttonLabel="Save changes"
                  pendingLabel="Saving..."
                >
                  <input
                    type="hidden"
                    name="tournamentId"
                    value={tournament.id}
                  />

                  <div className="grid gap-5 lg:grid-cols-2">
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
                    <FieldLabel>Description</FieldLabel>

                    <textarea
                      name="description"
                      required
                      defaultValue={tournament.description}
                      className={`${inputClass()} min-h-32 resize-y`}
                    />
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
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
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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

                    <label className="grid gap-2">
                      <FieldLabel>Status</FieldLabel>

                      <select
                        name="status"
                        required
                        defaultValue={tournament.status}
                        className={inputClass()}
                      >
                        {tournamentStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <FieldLabel>Registration</FieldLabel>

                      <select
                        name="registrationStatus"
                        required
                        defaultValue={tournament.registrationStatus}
                        className={inputClass()}
                      >
                        {registrationStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </InlineAdminTournamentForm>

                <aside className="grid content-start gap-6">
                  <section className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      Quick registration
                    </p>

                    <div className="mt-4 grid gap-3">
                      <SmallAction
                        action={openTournamentRegistrationInline}
                        tournamentId={tournament.id}
                        label="Open registration"
                        pendingLabel="Opening..."
                        variant="success"
                      />

                      <SmallAction
                        action={closeTournamentRegistrationInline}
                        tournamentId={tournament.id}
                        label="Close registration"
                        pendingLabel="Closing..."
                        variant="danger"
                      />
                    </div>
                  </section>

                  <section className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      Quick status
                    </p>

                    <div className="mt-4 grid gap-3">
                      <SmallAction
                        action={setTournamentUpcomingInline}
                        tournamentId={tournament.id}
                        label="Set upcoming"
                        pendingLabel="Updating..."
                      />

                      <SmallAction
                        action={setTournamentOpenInline}
                        tournamentId={tournament.id}
                        label="Set open"
                        pendingLabel="Updating..."
                        variant="success"
                      />

                      <SmallAction
                        action={setTournamentClosedInline}
                        tournamentId={tournament.id}
                        label="Set closed"
                        pendingLabel="Updating..."
                        variant="danger"
                      />

                      <SmallAction
                        action={setTournamentCancelledInline}
                        tournamentId={tournament.id}
                        label="Set cancelled"
                        pendingLabel="Updating..."
                        variant="danger"
                      />
                    </div>
                  </section>

                  <section className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      Current info
                    </p>

                    <div className="mt-4 grid gap-3 text-sm text-gray-300">
                      <p>
                        Slots:{" "}
                        <span className="font-black text-white">
                          {tournament.registrations.length}/
                          {tournament.maxSlots}
                        </span>
                      </p>

                      <p>
                        Team size:{" "}
                        <span className="font-black text-white">
                          {tournament.teamSize}
                        </span>
                      </p>

                      <p>
                        Prize:{" "}
                        <span className="font-black text-white">
                          {tournament.prize}
                        </span>
                      </p>
                    </div>
                  </section>
                </aside>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

import {
  approveTournamentRegistration,
  cancelTournamentRegistrationAsAdmin,
} from "@/actions/adminRegistrationActions";
import ProfileNotice from "@/components/ProfileNotice";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";

type AdminTournamentRegistrationsProps = {
  message?: string;
  error?: string;
};

function statusStyle(status: string): React.CSSProperties {
  if (status === "approved") {
    return { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" };
  }
  if (status === "cancelled") {
    return { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" };
  }
  return { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" };
}

function statusLabel(status: string) {
  if (status === "approved") return "Approved";
  if (status === "cancelled") return "Cancelled";
  return "Waiting Approval";
}

export default async function AdminTournamentRegistrations({
  message,
  error,
}: AdminTournamentRegistrationsProps) {
  const registrations = await prisma.tournamentRegistration.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tournament: { include: { game: true } },
      team: { include: { members: { include: { user: true } } } },
      registeredBy: true,
    },
  });

  const waitingRegistrations = registrations.filter((r) => r.status === "registered");
  const approvedRegistrations = registrations.filter((r) => r.status === "approved");
  const cancelledRegistrations = registrations.filter((r) => r.status === "cancelled");

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <ProfileNotice message={message} error={error} />

      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--asc-accent)" }}>
          Registrations
        </p>
        <h2 className="text-4xl font-black" style={{ color: "var(--asc-fg-0)" }}>Tournament Registrations</h2>
        <p className="mt-4 max-w-3xl leading-7" style={{ color: "var(--asc-fg-3)" }}>
          Review teams that registered for tournaments, approve registrations, or cancel invalid requests.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border p-5" style={{ borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--asc-amber)" }}>Waiting</p>
          <p className="mt-3 text-4xl font-black" style={{ color: "var(--asc-fg-0)" }}>{waitingRegistrations.length}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>Need admin approval</p>
        </div>

        <div className="border p-5" style={{ borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--asc-green)" }}>Approved</p>
          <p className="mt-3 text-4xl font-black" style={{ color: "var(--asc-fg-0)" }}>{approvedRegistrations.length}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>Confirmed teams</p>
        </div>

        <div className="border p-5" style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--asc-live)" }}>Cancelled</p>
          <p className="mt-3 text-4xl font-black" style={{ color: "var(--asc-fg-0)" }}>{cancelledRegistrations.length}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>Rejected or cancelled</p>
        </div>

        <div className="border p-5" style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--asc-accent)" }}>Total</p>
          <p className="mt-3 text-4xl font-black" style={{ color: "var(--asc-fg-0)" }}>{registrations.length}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>All registrations</p>
        </div>
      </div>

      {registrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="Tournament registrations will appear here after teams register."
        />
      ) : (
        <div className="grid gap-5">
          {registrations.map((registration) => (
            <article
              key={registration.id}
              className="border p-6"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
            >
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="border px-4 py-1 text-sm font-bold" style={statusStyle(registration.status)}>
                      {statusLabel(registration.status)}
                    </span>

                    <span
                      className="border px-4 py-1 text-sm font-bold"
                      style={{ color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" }}
                    >
                      {registration.tournament.game?.name ?? "—"}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{registration.team.name}</h3>
                  <p className="mt-2 leading-7" style={{ color: "var(--asc-fg-3)" }}>Tournament: {registration.tournament.title}</p>
                  <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>Registered by {registration.registeredBy.username}</p>
                </div>

                <div className="grid gap-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                  <p>Team members: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{registration.team.members.length}</span></p>
                  <p>Required size: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{registration.tournament.teamSize}</span></p>
                  <p>Registered at: <span className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{registration.createdAt.toLocaleDateString("en")}</span></p>
                </div>
              </div>

              <div className="border p-5" style={{ borderColor: "var(--asc-line-soft)", background: "oklch(0.08 0.02 287)" }}>
                <h4 className="mb-4 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Members</h4>

                <div className="grid gap-3 md:grid-cols-2">
                  {registration.team.members.map((member) => (
                    <div
                      key={member.id}
                      className="border px-4 py-3"
                      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
                    >
                      <p className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{member.user.username}</p>
                      <p className="text-sm capitalize" style={{ color: "var(--asc-fg-3)" }}>{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {registration.status === "registered" && (
                  <form action={approveTournamentRegistration}>
                    <input type="hidden" name="registrationId" value={registration.id} />
                    <button
                      type="submit"
                      className="px-5 py-3 font-bold text-white transition hover:opacity-90"
                      style={{ background: "oklch(0.55 0.14 150)" }}
                    >
                      Approve Registration
                    </button>
                  </form>
                )}

                {registration.status !== "cancelled" && (
                  <form action={cancelTournamentRegistrationAsAdmin}>
                    <input type="hidden" name="registrationId" value={registration.id} />
                    <button
                      type="submit"
                      className="border px-5 py-3 font-bold transition hover:opacity-90"
                      style={{ borderColor: "oklch(0.50 0.20 25 / 0.5)", color: "var(--asc-live)", background: "transparent" }}
                    >
                      Cancel Registration
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

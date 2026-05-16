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

function statusStyle(status: string) {
  if (status === "approved") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "cancelled") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
}

function statusLabel(status: string) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Waiting Approval";
}

export default async function AdminTournamentRegistrations({
  message,
  error,
}: AdminTournamentRegistrationsProps) {
  const registrations = await prisma.tournamentRegistration.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      tournament: true,
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
      registeredBy: true,
    },
  });

  const waitingRegistrations = registrations.filter(
    (registration) => registration.status === "registered",
  );

  const approvedRegistrations = registrations.filter(
    (registration) => registration.status === "approved",
  );

  const cancelledRegistrations = registrations.filter(
    (registration) => registration.status === "cancelled",
  );

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <ProfileNotice message={message} error={error} />

      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Registrations
        </p>

        <h2 className="text-4xl font-black">Tournament Registrations</h2>

        <p className="mt-4 max-w-3xl leading-7 text-gray-300">
          Review teams that registered for tournaments, approve registrations,
          or cancel invalid requests.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">
            Waiting
          </p>
          <p className="mt-3 text-4xl font-black">
            {waitingRegistrations.length}
          </p>
          <p className="mt-2 text-sm text-gray-300">Need admin approval</p>
        </div>

        <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
            Approved
          </p>
          <p className="mt-3 text-4xl font-black">
            {approvedRegistrations.length}
          </p>
          <p className="mt-2 text-sm text-gray-300">Confirmed teams</p>
        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">
            Cancelled
          </p>
          <p className="mt-3 text-4xl font-black">
            {cancelledRegistrations.length}
          </p>
          <p className="mt-2 text-sm text-gray-300">Rejected or cancelled</p>
        </div>

        <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Total
          </p>
          <p className="mt-3 text-4xl font-black">{registrations.length}</p>
          <p className="mt-2 text-sm text-gray-300">All registrations</p>
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
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-4 py-1 text-sm font-bold ${statusStyle(
                        registration.status,
                      )}`}
                    >
                      {statusLabel(registration.status)}
                    </span>

                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-sm font-bold text-cyan-300">
                      {registration.tournament.game}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black">
                    {registration.team.name}
                  </h3>

                  <p className="mt-2 leading-7 text-gray-300">
                    Tournament: {registration.tournament.title}
                  </p>

                  <p className="text-sm text-gray-400">
                    Registered by {registration.registeredBy.username}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-gray-300">
                  <p>
                    Team members:{" "}
                    <span className="font-bold text-white">
                      {registration.team.members.length}
                    </span>
                  </p>

                  <p>
                    Required size:{" "}
                    <span className="font-bold text-white">
                      {registration.tournament.teamSize}
                    </span>
                  </p>

                  <p>
                    Registered at:{" "}
                    <span className="font-bold text-white">
                      {registration.createdAt.toLocaleDateString("en")}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h4 className="mb-4 text-xl font-black">Members</h4>

                <div className="grid gap-3 md:grid-cols-2">
                  {registration.team.members.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <p className="font-bold">{member.user.username}</p>
                      <p className="text-sm capitalize text-gray-400">
                        {member.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {registration.status === "registered" && (
                  <form action={approveTournamentRegistration}>
                    <input
                      type="hidden"
                      name="registrationId"
                      value={registration.id}
                    />

                    <button
                      type="submit"
                      className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white transition hover:bg-green-400"
                    >
                      Approve Registration
                    </button>
                  </form>
                )}

                {registration.status !== "cancelled" && (
                  <form action={cancelTournamentRegistrationAsAdmin}>
                    <input
                      type="hidden"
                      name="registrationId"
                      value={registration.id}
                    />

                    <button
                      type="submit"
                      className="rounded-xl border border-red-500/20 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/10"
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

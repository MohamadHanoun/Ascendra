import {
  approveTeam,
  deleteTeamAsAdmin,
  rejectTeam,
} from "@/actions/adminTeamActions";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";
import EmptyState from "@/components/EmptyState";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";

type AdminTeamReviewProps = {
  message?: string;
  error?: string;
};

function statusStyle(status: string) {
  if (status === "approved") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "pending") {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
  }

  if (status === "rejected") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
}

function statusLabel(status: string) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "pending") {
    return "Pending Review";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Draft";
}

export default async function AdminTeamReview({
  message,
  error,
}: AdminTeamReviewProps) {
  const teams = await prisma.team.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      leader: true,
      members: {
        include: {
          user: true,
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      invites: {
        where: {
          status: "pending",
        },
        include: {
          invitedUser: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const pendingTeams = teams.filter((team) => team.status === "pending");
  const approvedTeams = teams.filter((team) => team.status === "approved");
  const rejectedTeams = teams.filter((team) => team.status === "rejected");
  const draftTeams = teams.filter((team) => team.status === "draft");

  const otherTeams = teams.filter((team) => team.status !== "pending");

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <ProfileNotice message={message} error={error} />

      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Team Review
        </p>

        <h2 className="text-4xl font-black">Manage RTN Teams</h2>

        <p className="mt-4 max-w-3xl leading-7 text-gray-300">
          Review submitted teams, approve official teams, reject requests with a
          clear reason, or delete teams when needed.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">
            Pending
          </p>
          <p className="mt-3 text-4xl font-black">{pendingTeams.length}</p>
          <p className="mt-2 text-sm text-gray-300">Waiting for review</p>
        </div>

        <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
            Approved
          </p>
          <p className="mt-3 text-4xl font-black">{approvedTeams.length}</p>
          <p className="mt-2 text-sm text-gray-300">Official RTN teams</p>
        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">
            Rejected
          </p>
          <p className="mt-3 text-4xl font-black">{rejectedTeams.length}</p>
          <p className="mt-2 text-sm text-gray-300">Needs correction</p>
        </div>

        <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Total
          </p>
          <p className="mt-3 text-4xl font-black">{teams.length}</p>
          <p className="mt-2 text-sm text-gray-300">
            {draftTeams.length} draft teams
          </p>
        </div>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Team requests will appear here after players create and submit teams for review."
        />
      ) : (
        <div className="grid gap-8">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
                  Priority
                </p>

                <h3 className="text-3xl font-black">Pending Team Requests</h3>
              </div>

              <p className="text-sm text-gray-400">Review these teams first.</p>
            </div>

            {pendingTeams.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-gray-300">
                No pending teams right now.
              </div>
            ) : (
              <div className="grid gap-5">
                {pendingTeams.map((team) => (
                  <article
                    key={team.id}
                    className="overflow-hidden rounded-3xl border border-yellow-500/20 bg-[#101522]"
                  >
                    <div className="border-b border-white/10 bg-yellow-500/10 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-3">
                            <span
                              className={`rounded-full border px-4 py-1 text-sm font-bold ${statusStyle(
                                team.status,
                              )}`}
                            >
                              {statusLabel(team.status)}
                            </span>

                            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-sm font-bold text-cyan-300">
                              {team.game}
                            </span>
                          </div>

                          <h4 className="text-3xl font-black">{team.name}</h4>

                          <p className="mt-3 text-gray-300">
                            Leader: {team.leader.username}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-2xl font-black">
                              {team.members.length}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">
                              Members
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-2xl font-black">
                              {team.invites.length}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">
                              Invites
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.9fr]">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                        <h5 className="mb-4 text-xl font-black">Members</h5>

                        {team.members.length === 0 ? (
                          <p className="text-gray-300">No members found.</p>
                        ) : (
                          <div className="grid gap-3">
                            {team.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3"
                              >
                                <span className="font-semibold">
                                  {member.user.username}
                                </span>

                                <span className="text-sm capitalize text-gray-400">
                                  {member.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid content-start gap-5">
                        {team.invites.length > 0 && (
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                            <h5 className="mb-4 text-xl font-black">
                              Pending Invites
                            </h5>

                            <div className="grid gap-3">
                              {team.invites.map((invite) => (
                                <div
                                  key={invite.id}
                                  className="rounded-xl bg-white/5 px-4 py-3 text-gray-300"
                                >
                                  {invite.invitedUser.username}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                          <h5 className="mb-4 text-xl font-black">Decision</h5>

                          <div className="grid gap-4">
                            <div className="grid gap-3 sm:flex sm:flex-wrap">
                              <form action={approveTeam}>
                                <input
                                  type="hidden"
                                  name="teamId"
                                  value={team.id}
                                />

                                <button
                                  type="submit"
                                  className="w-full rounded-xl bg-green-500 px-5 py-3 font-bold text-white transition hover:bg-green-400 sm:w-auto"
                                >
                                  Approve Team
                                </button>
                              </form>

                              <ConfirmDeleteForm
                                id={team.id}
                                action={deleteTeamAsAdmin}
                                message="Are you sure you want to delete this team? This will remove the team, members, invites, and registrations."
                              />
                            </div>

                            <form action={rejectTeam} className="grid gap-3">
                              <input
                                type="hidden"
                                name="teamId"
                                value={team.id}
                              />

                              <input
                                name="rejectionReason"
                                required
                                placeholder="Write rejection reason..."
                                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-red-400"
                              />

                              <button
                                type="submit"
                                className="rounded-xl border border-red-500/20 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/10"
                              >
                                Reject Team
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
                  Overview
                </p>

                <h3 className="text-3xl font-black">All Teams</h3>
              </div>

              <p className="text-sm text-gray-400">
                Approved, rejected, and draft teams.
              </p>
            </div>

            {otherTeams.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-gray-300">
                No other teams yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {otherTeams.map((team) => (
                  <article
                    key={team.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full border px-4 py-1 text-sm font-bold ${statusStyle(
                              team.status,
                            )}`}
                          >
                            {statusLabel(team.status)}
                          </span>

                          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-sm font-bold text-cyan-300">
                            {team.game}
                          </span>
                        </div>

                        <h4 className="text-2xl font-black">{team.name}</h4>

                        <p className="mt-2 text-gray-300">
                          Leader: {team.leader.username} • {team.members.length}{" "}
                          members
                        </p>

                        {team.rejectionReason && (
                          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                            <p className="mb-2 font-bold text-red-300">
                              Rejection reason
                            </p>

                            <p className="leading-7 text-gray-300">
                              {team.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="lg:min-w-[180px]">
                        <ConfirmDeleteForm
                          id={team.id}
                          action={deleteTeamAsAdmin}
                          message="Are you sure you want to delete this team? This action cannot be undone."
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

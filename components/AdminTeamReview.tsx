import { deleteTeamInline } from "@/actions/adminTeamInlineActions";
import InlineAdminActionForm from "@/components/InlineAdminActionForm";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";

type AdminTeamReviewProps = {
  message?: string;
  error?: string;
};

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    active: "border-green-500/20 bg-green-500/10 text-green-300",
    draft: "border-white/10 bg-white/5 text-gray-300",
    pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  const label = normalizedStatus === "approved" ? "Active" : status;

  return (
    <span
      className={`inline-flex w-fit rounded border px-3 py-1 text-xs font-bold capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {label}
    </span>
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not submitted";
  }

  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminTeamReview({
  message,
  error,
}: AdminTeamReviewProps) {
  const teams = await prisma.team.findMany({
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
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 80,
  });

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <ProfileNotice message={message} error={error} />

      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
          Teams
        </p>

        <h1 className="mt-2 text-4xl font-black text-white">Teams directory</h1>

        <p className="mt-3 max-w-3xl text-gray-400">
          View all created teams, their leaders, members, games, and creation
          details. Admin approval is only needed for tournament registrations.
        </p>
      </div>

      {teams.length === 0 ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No teams found.
        </section>
      ) : (
        <section className="grid gap-4">
          {teams.map((team) => (
            <article
              key={team.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
            >
              <div className="grid gap-6 p-5 xl:grid-cols-[1fr_1.1fr_220px] xl:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-white">
                      {team.name}
                    </h2>

                    <StatusBadge status={team.status} />
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-gray-400">
                    <p>
                      Game:{" "}
                      <span className="font-bold text-white">{team.game}</span>
                    </p>

                    <p>
                      Leader:{" "}
                      <span className="font-bold text-white">
                        {team.leader.username}
                      </span>
                    </p>

                    <p>
                      Created:{" "}
                      <span className="font-bold text-white">
                        {formatDate(team.createdAt)}
                      </span>
                    </p>

                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                    Players
                  </p>

                  <div className="grid gap-2">
                    {team.members.length === 0 ? (
                      <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-400">
                        No players in this team.
                      </div>
                    ) : (
                      team.members.map((member) => {
                        const isLeader = member.userId === team.leaderId;

                        return (
                          <div
                            key={member.id}
                            className="grid gap-2 rounded-lg border border-white/10 bg-black/20 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                          >
                            <div>
                              <p className="font-black text-white">
                                {member.user.username}
                              </p>

                              <p className="mt-1 break-all text-xs text-gray-500">
                                {member.user.discordId}
                              </p>
                            </div>

                            <span
                              className={`w-fit rounded border px-2.5 py-1 text-xs font-bold ${
                                isLeader
                                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                                  : "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
                              }`}
                            >
                              {isLeader ? "Leader" : "Member"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid gap-2 xl:justify-end">
                  <InlineAdminActionForm
                    action={deleteTeamInline}
                    buttonLabel="Delete"
                    pendingLabel="Deleting..."
                    variant="danger"
                    confirmTitle="Delete team?"
                    confirmDescription={`Are you sure you want to delete ${team.name}? This will remove the team, members, invitations, and tournament registrations.`}
                    confirmLabel="Delete permanently"
                  >
                    <input type="hidden" name="teamId" value={team.id} />
                  </InlineAdminActionForm>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

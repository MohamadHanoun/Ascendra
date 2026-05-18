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
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {label}
    </span>
  );
}

function RoleBadge({ leader }: { leader: boolean }) {
  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${
        leader
          ? "border-green-500/20 bg-green-500/10 text-green-300"
          : "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
      }`}
    >
      {leader ? "Leader" : "Member"}
    </span>
  );
}

function RegistrationBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    registered: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
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

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <p>
      {label}: <span className="break-all font-black text-white">{value}</span>
    </p>
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not set";
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
      registrations: {
        include: {
          tournament: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      results: {
        include: {
          tournament: true,
        },
        orderBy: [
          {
            awardedAt: "desc",
          },
        ],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 80,
  });

  const teamsWithStats = teams.map((team) => {
    const tournamentPoints = team.results.reduce(
      (total, result) => total + result.points,
      0,
    );

    const bestPlacement =
      team.results.length > 0
        ? Math.min(...team.results.map((result) => result.placement))
        : null;

    return {
      ...team,
      tournamentPoints,
      bestPlacement,
    };
  });

  const totalPlayers = teamsWithStats.reduce(
    (sum, team) => sum + team.members.length,
    0,
  );

  const activeTeams = teamsWithStats.filter((team) => {
    const status = team.status.toLowerCase();

    return status === "approved" || status === "active";
  }).length;

  const totalTournamentPoints = teamsWithStats.reduce(
    (total, team) => total + team.tournamentPoints,
    0,
  );

  const teamsWithResults = teamsWithStats.filter(
    (team) => team.results.length > 0,
  ).length;

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <ProfileNotice message={message} error={error} />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            Teams
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            Teams directory
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            View teams, leaders, players, registrations, tournament results, and
            points.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Teams" value={teamsWithStats.length} />
          <StatCard label="Active" value={activeTeams} />
          <StatCard label="Players" value={totalPlayers} />
          <StatCard label="Ranked" value={teamsWithResults} />
          <StatCard label="Points" value={totalTournamentPoints} />
        </div>
      </div>

      {teamsWithStats.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          No teams found.
        </section>
      ) : (
        <section className="grid gap-5">
          {teamsWithStats.map((team) => (
            <article
              key={team.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
            >
              <div className="border-b border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-black text-white">
                        {team.name}
                      </h2>

                      <StatusBadge status={team.status} />

                      {team.tournamentPoints > 0 && (
                        <span className="inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-black text-green-300">
                          {team.tournamentPoints} pts
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-6 text-gray-400">
                      {team.game} · Created {formatDate(team.createdAt)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    <StatCard label="Players" value={team.members.length} />
                    <StatCard label="Regs." value={team.registrations.length} />
                    <StatCard label="Results" value={team.results.length} />
                    <StatCard label="Points" value={team.tournamentPoints} />
                    <StatCard
                      label="Best"
                      value={
                        team.bestPlacement ? `#${team.bestPlacement}` : "-"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_280px] xl:items-start">
                <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                    Team info
                  </p>

                  <div className="mt-4 grid gap-3 text-sm text-gray-300">
                    <InfoRow label="Team name" value={team.name} />
                    <InfoRow label="Game" value={team.game} />
                    <InfoRow label="Leader" value={team.leader.username} />
                    <InfoRow
                      label="Leader Discord ID"
                      value={team.leader.discordId}
                    />
                    <InfoRow label="Players" value={team.members.length} />
                    <InfoRow
                      label="Registrations"
                      value={team.registrations.length}
                    />
                    <InfoRow label="Results" value={team.results.length} />
                    <InfoRow
                      label="Tournament points"
                      value={team.tournamentPoints}
                    />
                    <InfoRow
                      label="Best placement"
                      value={
                        team.bestPlacement ? `#${team.bestPlacement}` : "-"
                      }
                    />
                    <InfoRow
                      label="Created"
                      value={formatDate(team.createdAt)}
                    />
                  </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                    Players
                  </p>

                  <div className="mt-4 grid gap-2">
                    {team.members.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-400">
                        No players in this team.
                      </div>
                    ) : (
                      team.members.map((member) => {
                        const isLeader = member.userId === team.leaderId;

                        return (
                          <div
                            key={member.id}
                            className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                          >
                            <div>
                              <p className="font-black text-white">
                                {member.user.username}
                              </p>

                              <p className="mt-1 break-all text-xs text-gray-500">
                                {member.user.discordId}
                              </p>
                            </div>

                            <RoleBadge leader={isLeader} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                <aside className="grid content-start gap-4">
                  <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                      Results
                    </p>

                    <div className="mt-4 grid gap-2">
                      {team.results.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-400">
                          No tournament results.
                        </div>
                      ) : (
                        team.results.slice(0, 4).map((result) => (
                          <div
                            key={result.id}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                          >
                            <p className="text-sm font-black text-white">
                              {result.tournament.title}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              #{result.placement} · {result.points} pts
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                      Registrations
                    </p>

                    <div className="mt-4 grid gap-2">
                      {team.registrations.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-400">
                          No tournament registrations.
                        </div>
                      ) : (
                        team.registrations.slice(0, 4).map((registration) => (
                          <div
                            key={registration.id}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                          >
                            <p className="text-sm font-black text-white">
                              {registration.tournament.title}
                            </p>

                            <div className="mt-2">
                              <RegistrationBadge status={registration.status} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
                      Danger zone
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      Delete this team, its members, invitations, registrations,
                      and tournament results.
                    </p>

                    <div className="mt-3">
                      <InlineAdminActionForm
                        action={deleteTeamInline}
                        buttonLabel="Delete team"
                        pendingLabel="Deleting..."
                        variant="danger"
                        confirmTitle="Delete team?"
                        confirmDescription={`Are you sure you want to delete ${team.name}? This will remove the team, members, invitations, registrations, and tournament results.`}
                        confirmLabel="Delete permanently"
                      >
                        <input type="hidden" name="teamId" value={team.id} />
                      </InlineAdminActionForm>
                    </div>
                  </section>
                </aside>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}

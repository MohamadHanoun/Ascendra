import { deleteTeamInline } from "@/actions/adminTeamInlineActions";
import InlineAdminActionForm from "@/components/InlineAdminActionForm";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";

type AdminTeamReviewProps = {
  message?: string;
  error?: string;
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "approved" || normalizedStatus === "active") {
    return <Pill tone="green">Active</Pill>;
  }

  if (normalizedStatus === "pending") {
    return <Pill tone="yellow">Pending</Pill>;
  }

  if (normalizedStatus === "rejected") {
    return <Pill tone="red">Rejected</Pill>;
  }

  return <Pill>{status}</Pill>;
}

function RegistrationBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const tone =
    normalizedStatus === "approved"
      ? "green"
      : normalizedStatus === "registered"
        ? "violet"
        : normalizedStatus === "rejected"
          ? "red"
          : "gray";

  return <Pill tone={tone}>{status}</Pill>;
}

function RoleBadge({ leader }: { leader: boolean }) {
  return (
    <Pill tone={leader ? "green" : "violet"}>
      {leader ? "Leader" : "Member"}
    </Pill>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string | number;
  value: string | number;
}) {
  return (
    <p className="text-sm text-gray-400">
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
    select: {
      id: true,
      name: true,
      game: { select: { name: true } },
      status: true,
      leaderId: true,
      createdAt: true,
      leader: {
        select: {
          username: true,
          discordId: true,
        },
      },
      members: {
        select: {
          id: true,
          userId: true,
          joinedAt: true,
          user: {
            select: {
              username: true,
              discordId: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      registrations: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          snapshotTeamName: true,
          snapshotTeamGame: true,
          tournament: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      results: {
        select: {
          id: true,
          placement: true,
          points: true,
          awardedAt: true,
          snapshotTeamName: true,
          snapshotTeamGame: true,
          tournament: {
            select: {
              title: true,
            },
          },
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

  const teamsWithResults = teamsWithStats.filter(
    (team) => team.results.length > 0,
  ).length;

  const totalTournamentPoints = teamsWithStats.reduce(
    (total, team) => total + team.tournamentPoints,
    0,
  );

  return (
    <section className="grid gap-6">
      <ProfileNotice message={message} error={error} />

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Teams
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            Teams directory
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Review teams, players, registrations, and official tournament
            results.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          <Stat label="Teams" value={teamsWithStats.length} />
          <Stat label="Active" value={activeTeams} />
          <Stat label="Players" value={totalPlayers} />
          <Stat label="Ranked" value={teamsWithResults} />
          <Stat label="Points" value={totalTournamentPoints} />
        </div>
      </div>

      {teamsWithStats.length === 0 ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-gray-300 shadow-2xl shadow-black/20">
          No teams found.
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[minmax(0,1fr)_110px_110px_110px_110px] xl:gap-5">
            <span>Team</span>
            <span>Players</span>
            <span>Regs.</span>
            <span>Results</span>
            <span>Points</span>
          </div>

          <div className="divide-y divide-white/10">
            {teamsWithStats.map((team) => (
              <article
                key={team.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035]"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_110px_110px_110px_110px] xl:items-center xl:gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-black text-white">
                        {team.name}
                      </h2>

                      <StatusBadge status={team.status} />
                      <Pill tone="violet">{team.game?.name ?? "—"}</Pill>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      Leader {team.leader.username} · Created{" "}
                      {formatDate(team.createdAt)}
                    </p>
                  </div>

                  <p className="text-sm text-gray-300">
                    <span className="font-black text-white">
                      {team.members.length}
                    </span>{" "}
                    players
                  </p>

                  <p className="text-sm text-gray-300">
                    <span className="font-black text-white">
                      {team.registrations.length}
                    </span>{" "}
                    regs
                  </p>

                  <p className="text-sm text-gray-300">
                    <span className="font-black text-white">
                      {team.results.length}
                    </span>{" "}
                    results
                  </p>

                  <Pill tone={team.tournamentPoints > 0 ? "green" : "gray"}>
                    {team.tournamentPoints} pts
                  </Pill>
                </div>

                <details className="rounded-2xl border border-white/10 bg-black/20">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-black text-gray-300 transition hover:text-white">
                    Team details and actions
                  </summary>

                  <div className="grid gap-6 border-t border-white/10 p-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_260px]">
                    <section className="grid content-start gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                        Team info
                      </p>

                      <InfoRow label="Team name" value={team.name} />
                      <InfoRow label="Game" value={team.game?.name ?? "—"} />
                      <InfoRow label="Status" value={team.status} />
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
                      <InfoRow label="Points" value={team.tournamentPoints} />
                      <InfoRow
                        label="Best placement"
                        value={
                          team.bestPlacement ? `#${team.bestPlacement}` : "-"
                        }
                      />
                    </section>

                    <section className="grid content-start gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                        Players
                      </p>

                      {team.members.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          No players in this team.
                        </p>
                      ) : (
                        <div className="divide-y divide-white/10">
                          {team.members.map((member) => {
                            const isLeader = member.userId === team.leaderId;

                            return (
                              <div
                                key={member.id}
                                className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-black text-white">
                                    {member.user.username}
                                  </p>

                                  <p className="mt-1 break-all text-xs text-gray-500">
                                    {member.user.discordId}
                                  </p>
                                </div>

                                <RoleBadge leader={isLeader} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    <aside className="grid content-start gap-5">
                      <section className="grid gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                          Latest results
                        </p>

                        {team.results.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            No tournament results.
                          </p>
                        ) : (
                          <div className="grid gap-3">
                            {team.results.slice(0, 4).map((result) => (
                              <div key={result.id}>
                                <p className="truncate text-sm font-black text-white">
                                  {result.tournament.title}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  #{result.placement} · {result.points} pts
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="grid gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                          Latest registrations
                        </p>

                        {team.registrations.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            No tournament registrations.
                          </p>
                        ) : (
                          <div className="grid gap-3">
                            {team.registrations
                              .slice(0, 4)
                              .map((registration) => (
                                <div key={registration.id}>
                                  <p className="truncate text-sm font-black text-white">
                                    {registration.tournament.title}
                                  </p>

                                  <div className="mt-2">
                                    <RegistrationBadge
                                      status={registration.status}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </section>

                      <section className="border-t border-red-500/20 pt-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-red-300">
                          Danger zone
                        </p>

                        <p className="mt-2 text-sm leading-6 text-gray-400">
                          Delete this team and connected records.
                        </p>

                        <div className="mt-3">
                          <InlineAdminActionForm
                            action={deleteTeamInline}
                            buttonLabel="Delete team"
                            pendingLabel="Deleting..."
                            variant="danger"
                            confirmTitle="Delete team?"
                            confirmDescription={`Delete ${team.name}? This will remove the team, members, invitations, registrations, and tournament results.`}
                            confirmLabel="Delete permanently"
                          >
                            <input
                              type="hidden"
                              name="teamId"
                              value={team.id}
                            />
                          </InlineAdminActionForm>
                        </div>
                      </section>
                    </aside>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

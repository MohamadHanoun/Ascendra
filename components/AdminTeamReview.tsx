import { deleteTeamInline } from "@/actions/adminTeamInlineActions";
import InlineAdminActionForm from "@/components/InlineAdminActionForm";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";

type AdminTeamReviewProps = {
  message?: string;
  error?: string;
};

const pillStyleMap: Record<string, React.CSSProperties> = {
  green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
  yellow: { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" },
  red: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
  gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
  violet: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "gray" | "violet";
}) {
  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={pillStyleMap[tone]}>
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
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
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
    <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
      {label}: <span className="break-all font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</span>
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
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
            Teams
          </p>

          <h1 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            Teams directory
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
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
        <section
          className="border p-6 shadow-2xl"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-2)" }}
        >
          No teams found.
        </section>
      ) : (
        <section
          className="overflow-hidden border shadow-2xl"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
        >
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] xl:grid xl:grid-cols-[minmax(0,1fr)_110px_110px_110px_110px] xl:gap-5"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
          >
            <span>Team</span>
            <span>Players</span>
            <span>Regs.</span>
            <span>Results</span>
            <span>Points</span>
          </div>

          <div>
            {teamsWithStats.map((team) => (
              <article
                key={team.id}
                className="grid gap-4 px-5 py-4 transition"
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_110px_110px_110px_110px] xl:items-center xl:gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                        {team.name}
                      </h2>

                      <StatusBadge status={team.status} />
                      <Pill tone="violet">{team.game?.name ?? "—"}</Pill>
                    </div>

                    <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                      Leader {team.leader.username} · Created{" "}
                      {formatDate(team.createdAt)}
                    </p>
                  </div>

                  <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
                    <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>{team.members.length}</span>{" "}players
                  </p>

                  <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
                    <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>{team.registrations.length}</span>{" "}regs
                  </p>

                  <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
                    <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>{team.results.length}</span>{" "}results
                  </p>

                  <Pill tone={team.tournamentPoints > 0 ? "green" : "gray"}>
                    {team.tournamentPoints} pts
                  </Pill>
                </div>

                <details
                  className="border"
                  style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                >
                  <summary
                    className="cursor-pointer px-4 py-3 text-sm font-black transition hover:opacity-90"
                    style={{ color: "var(--asc-fg-2)" }}
                  >
                    Team details and actions
                  </summary>

                  <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_260px]" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
                    <section className="grid content-start gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
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
                      <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                        Players
                      </p>

                      {team.members.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
                          No players in this team.
                        </p>
                      ) : (
                        <div>
                          {team.members.map((member) => {
                            const isLeader = member.userId === team.leaderId;

                            return (
                              <div
                                key={member.id}
                                className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>
                                    {member.user.username}
                                  </p>

                                  <p className="mt-1 break-all text-xs" style={{ color: "var(--asc-fg-3)" }}>
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
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          Latest results
                        </p>

                        {team.results.length === 0 ? (
                          <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
                            No tournament results.
                          </p>
                        ) : (
                          <div className="grid gap-3">
                            {team.results.slice(0, 4).map((result) => (
                              <div key={result.id}>
                                <p className="truncate text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
                                  {result.tournament.title}
                                </p>

                                <p className="mt-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                                  #{result.placement} · {result.points} pts
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="grid gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
                          Latest registrations
                        </p>

                        {team.registrations.length === 0 ? (
                          <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
                            No tournament registrations.
                          </p>
                        ) : (
                          <div className="grid gap-3">
                            {team.registrations
                              .slice(0, 4)
                              .map((registration) => (
                                <div key={registration.id}>
                                  <p className="truncate text-sm font-black" style={{ color: "var(--asc-fg-0)" }}>
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

                      <section className="pt-5" style={{ borderTop: "1px solid var(--asc-live-border)" }}>
                        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-live)" }}>
                          Danger zone
                        </p>

                        <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
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

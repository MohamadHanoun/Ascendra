import Image from "next/image";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({ isGuildMember }: { isGuildMember: boolean }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        isGuildMember
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-yellow-400/25 bg-yellow-500/10 text-yellow-300"
      }`}
    >
      {isGuildMember ? "Ascendra Member" : "Login Only"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === "admin";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        isAdmin
          ? "border-red-400/25 bg-red-500/10 text-red-300"
          : "border-violet-400/25 bg-violet-500/10 text-violet-200"
      }`}
    >
      {role}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white">{value}</p>
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

function AvatarFallback({ username }: { username: string }) {
  return (
    <div className="relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-sm font-black text-violet-200">
      <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-xl" />
      <span className="relative uppercase">{username.slice(0, 2)}</span>
    </div>
  );
}

export default async function AdminPlayersList() {
  const players = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      teamMemberships: {
        include: {
          team: {
            include: {
              results: {
                select: {
                  id: true,
                  points: true,
                  placement: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          ownedTeams: true,
          teamMemberships: true,
          receivedTeamInvites: true,
          tournamentRegistrations: true,
        },
      },
    },
  });

  const playersWithPoints = players.map((player) => {
    const results = player.teamMemberships.flatMap(
      (membership) => membership.team.results,
    );

    const tournamentPoints = results.reduce(
      (total, result) => total + result.points,
      0,
    );

    const bestPlacement =
      results.length > 0
        ? Math.min(...results.map((result) => result.placement))
        : null;

    return {
      ...player,
      tournamentResults: results.length,
      tournamentPoints,
      bestPlacement,
    };
  });

  const guildMembers = playersWithPoints.filter(
    (player) => player.isGuildMember,
  );
  const admins = playersWithPoints.filter((player) => player.role === "Admin");
  const externalPlayers = playersWithPoints.length - guildMembers.length;

  const totalTournamentPoints = playersWithPoints.reduce(
    (total, player) => total + player.tournamentPoints,
    0,
  );

  const rankedPlayers = playersWithPoints.filter(
    (player) => player.tournamentPoints > 0,
  ).length;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Players
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Registered players
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            View players who logged in with Discord, their Ascendra membership,
            teams, registrations, and tournament points.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard label="Total" value={playersWithPoints.length} />
          <StatCard label="Members" value={guildMembers.length} />
          <StatCard label="External" value={externalPlayers} />
          <StatCard label="Admins" value={admins.length} />
          <StatCard label="Ranked" value={rankedPlayers} />
          <StatCard label="Points" value={totalTournamentPoints} />
        </div>
      </div>

      {playersWithPoints.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Players will appear here after they login with Discord."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="hidden border-b border-white/10 bg-black/25 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[minmax(0,1.2fr)_140px_140px_140px_140px_120px] xl:gap-5">
            <span>Player</span>
            <span>Teams</span>
            <span>Regs.</span>
            <span>Results</span>
            <span>Best</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-white/10">
            {playersWithPoints.map((player) => (
              <article
                key={player.id}
                className="grid gap-4 p-5 transition hover:bg-white/[0.035]"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_140px_140px_140px_140px_120px] xl:items-center xl:gap-5">
                  <div className="flex min-w-0 items-center gap-4">
                    {player.avatar ? (
                      <Image
                        src={player.avatar}
                        alt={player.username}
                        width={52}
                        height={52}
                        className="shrink-0 rounded-2xl"
                      />
                    ) : (
                      <AvatarFallback username={player.username} />
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-2xl font-black text-white">
                          {player.username}
                        </h3>

                        <StatusBadge isGuildMember={player.isGuildMember} />
                        <RoleBadge role={player.role} />

                        {player.tournamentPoints > 0 && (
                          <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                            {player.tournamentPoints} pts
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-gray-400">
                        Joined Ascendra platform {formatDate(player.createdAt)}
                      </p>
                    </div>
                  </div>

                  <MiniStat
                    label="Teams"
                    value={player._count.teamMemberships}
                  />
                  <MiniStat
                    label="Regs."
                    value={player._count.tournamentRegistrations}
                  />
                  <MiniStat label="Results" value={player.tournamentResults} />
                  <MiniStat
                    label="Best"
                    value={
                      player.bestPlacement ? `#${player.bestPlacement}` : "-"
                    }
                  />

                  <details className="group">
                    <summary className="cursor-pointer list-none rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-center text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white">
                      Details
                    </summary>
                  </details>
                </div>

                <details className="rounded-2xl border border-white/10 bg-black/25">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-black text-gray-300 transition hover:text-white">
                    Player details
                  </summary>

                  <div className="grid gap-5 border-t border-white/10 p-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                        Account info
                      </p>

                      <div className="mt-4 grid gap-3 text-sm text-gray-300">
                        <InfoRow label="Username" value={player.username} />
                        <InfoRow label="Role" value={player.role} />
                        <InfoRow label="Discord ID" value={player.discordId} />
                        <InfoRow
                          label="Guild member"
                          value={player.isGuildMember ? "Yes" : "No"}
                        />
                      </div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                        Activity and points
                      </p>

                      <div className="mt-4 grid gap-3 text-sm text-gray-300">
                        <InfoRow
                          label="Tournament points"
                          value={player.tournamentPoints}
                        />
                        <InfoRow
                          label="Tournament results"
                          value={player.tournamentResults}
                        />
                        <InfoRow
                          label="Best placement"
                          value={
                            player.bestPlacement
                              ? `#${player.bestPlacement}`
                              : "-"
                          }
                        />
                        <InfoRow
                          label="Last login"
                          value={formatDate(player.lastLoginAt)}
                        />
                        <InfoRow
                          label="Last guild check"
                          value={formatDate(player.lastGuildCheckAt)}
                        />
                        <InfoRow
                          label="Received invites"
                          value={player._count.receivedTeamInvites}
                        />
                        <InfoRow
                          label="Owned teams"
                          value={player._count.ownedTeams}
                        />
                      </div>
                    </section>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

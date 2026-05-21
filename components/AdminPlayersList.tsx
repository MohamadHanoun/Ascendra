import Image from "next/image";

import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";

type SnapshotMember = {
  userId?: string;
  username?: string;
};

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

function parseSnapshotMembers(snapshotMembers: unknown): SnapshotMember[] {
  if (!Array.isArray(snapshotMembers)) {
    return [];
  }

  return snapshotMembers
    .filter((member): member is Record<string, unknown> => {
      return Boolean(member) && typeof member === "object";
    })
    .map((member) => ({
      userId: typeof member.userId === "string" ? member.userId : undefined,
      username:
        typeof member.username === "string" ? member.username : undefined,
    }))
    .filter((member) => Boolean(member.userId));
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
      {isGuildMember ? "Member" : "Login only"}
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

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <p className="text-sm text-gray-400">
      {label}: <span className="break-all font-black text-white">{value}</span>
    </p>
  );
}

function AvatarFallback({ username }: { username: string }) {
  return (
    <div className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-sm font-black uppercase text-violet-200">
      {username.slice(0, 2)}
    </div>
  );
}

export default async function AdminPlayersList() {
  const [players, results] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        username: true,
        discordId: true,
        avatar: true,
        role: true,
        isGuildMember: true,
        createdAt: true,
        lastLoginAt: true,
        lastGuildCheckAt: true,
        _count: {
          select: {
            ownedTeams: true,
            teamMemberships: true,
            receivedTeamInvites: true,
            tournamentRegistrations: true,
          },
        },
      },
    }),

    prisma.tournamentResult.findMany({
      select: {
        id: true,
        points: true,
        placement: true,
        snapshotMembers: true,
        team: {
          select: {
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const playerResultStats = new Map<
    string,
    {
      tournamentPoints: number;
      tournamentResults: number;
      bestPlacement: number | null;
    }
  >();

  for (const result of results) {
    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);

    const userIds =
      snapshotMembers.length > 0
        ? snapshotMembers
            .map((member) => member.userId)
            .filter((userId): userId is string => Boolean(userId))
        : result.team.members.map((member) => member.userId);

    for (const userId of userIds) {
      const existing = playerResultStats.get(userId) || {
        tournamentPoints: 0,
        tournamentResults: 0,
        bestPlacement: null,
      };

      existing.tournamentPoints += result.points;
      existing.tournamentResults += 1;
      existing.bestPlacement =
        existing.bestPlacement === null
          ? result.placement
          : Math.min(existing.bestPlacement, result.placement);

      playerResultStats.set(userId, existing);
    }
  }

  const playersWithPoints = players.map((player) => {
    const stats = playerResultStats.get(player.id) || {
      tournamentPoints: 0,
      tournamentResults: 0,
      bestPlacement: null,
    };

    return {
      ...player,
      ...stats,
    };
  });

  const guildMembers = playersWithPoints.filter(
    (player) => player.isGuildMember,
  );

  const admins = playersWithPoints.filter(
    (player) => player.role.toLowerCase() === "admin",
  );

  const rankedPlayers = playersWithPoints.filter(
    (player) => player.tournamentPoints > 0,
  );

  const totalTournamentPoints = playersWithPoints.reduce(
    (total, player) => total + player.tournamentPoints,
    0,
  );

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Players
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Registered players
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Discord accounts, team activity, registrations, and official points.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          <Stat label="Total" value={playersWithPoints.length} />
          <Stat label="Members" value={guildMembers.length} />
          <Stat label="Admins" value={admins.length} />
          <Stat label="Ranked" value={rankedPlayers.length} />
          <Stat label="Points" value={totalTournamentPoints} />
        </div>
      </div>

      {playersWithPoints.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Players will appear here after they login with Discord."
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[minmax(0,1fr)_110px_110px_110px_110px] xl:gap-5">
            <span>Player</span>
            <span>Teams</span>
            <span>Regs.</span>
            <span>Results</span>
            <span>Points</span>
          </div>

          <div className="divide-y divide-white/10">
            {playersWithPoints.map((player) => (
              <article
                key={player.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035]"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_110px_110px_110px_110px] xl:items-center xl:gap-5">
                  <div className="flex min-w-0 items-center gap-4">
                    {player.avatar ? (
                      <Image
                        src={player.avatar}
                        alt={player.username}
                        width={48}
                        height={48}
                        className="shrink-0 rounded-2xl"
                      />
                    ) : (
                      <AvatarFallback username={player.username} />
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-black text-white">
                          {player.username}
                        </h3>

                        <StatusBadge isGuildMember={player.isGuildMember} />
                        <RoleBadge role={player.role} />
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        Joined {formatDate(player.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300">
                    <span className="font-black text-white">
                      {player._count.teamMemberships}
                    </span>{" "}
                    teams
                  </p>

                  <p className="text-sm text-gray-300">
                    <span className="font-black text-white">
                      {player._count.tournamentRegistrations}
                    </span>{" "}
                    regs
                  </p>

                  <p className="text-sm text-gray-300">
                    <span className="font-black text-white">
                      {player.tournamentResults}
                    </span>{" "}
                    results
                  </p>

                  <Pill tone={player.tournamentPoints > 0 ? "green" : "gray"}>
                    {player.tournamentPoints} pts
                  </Pill>
                </div>

                <details className="rounded-2xl border border-white/10 bg-black/20">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-black text-gray-300 transition hover:text-white">
                    Player details
                  </summary>

                  <div className="grid gap-5 border-t border-white/10 p-4 lg:grid-cols-2">
                    <section className="grid gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                        Account
                      </p>

                      <InfoRow label="Username" value={player.username} />
                      <InfoRow label="Role" value={player.role} />
                      <InfoRow label="Discord ID" value={player.discordId} />
                      <InfoRow
                        label="Guild member"
                        value={player.isGuildMember ? "Yes" : "No"}
                      />
                    </section>

                    <section className="grid gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                        Activity
                      </p>

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
                        label="Owned teams"
                        value={player._count.ownedTeams}
                      />
                      <InfoRow
                        label="Received invites"
                        value={player._count.receivedTeamInvites}
                      />
                    </section>
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

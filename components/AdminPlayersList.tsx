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
  const style: React.CSSProperties = isGuildMember
    ? { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" }
    : { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" };

  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={style}>
      {isGuildMember ? "Member" : "Login only"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === "admin";
  const style: React.CSSProperties = isAdmin
    ? { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" }
    : { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" };

  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={style}>
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
  const styleMap: Record<string, React.CSSProperties> = {
    green: { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" },
    yellow: { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" },
    red: { color: "var(--asc-live)", borderColor: "var(--asc-live-border)", background: "var(--asc-live-bg)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    violet: { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" },
  };

  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={styleMap[tone]}>
      {children}
    </span>
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

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
      {label}: <span className="break-all font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</span>
    </p>
  );
}

function AvatarFallback({ username }: { username: string }) {
  return (
    <div
      className="grid h-[48px] w-[48px] shrink-0 place-items-center text-sm font-black uppercase"
      style={{ border: "1px solid var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
    >
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
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
            Players
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            Review player identity, role, membership, and linked accounts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="border px-3 py-2 font-bold" style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)" }}>
            {playersWithPoints.length} total
          </span>
          <span className="border px-3 py-2 font-bold" style={{ borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)", color: "var(--asc-green)" }}>
            {guildMembers.length} members
          </span>
          <span className="border px-3 py-2 font-bold" style={{ borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}>
            {totalTournamentPoints} points
          </span>
        </div>
      </div>

      {playersWithPoints.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Players will appear here after they login with Discord."
        />
      ) : (
        <section
          className="overflow-hidden border shadow-xl shadow-black/15"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
        >
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] xl:grid xl:grid-cols-[minmax(0,1fr)_110px_110px_110px_110px] xl:gap-5"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
          >
            <span>Player</span>
            <span>Teams</span>
            <span>Regs.</span>
            <span>Results</span>
            <span>Points</span>
          </div>

          <div>
            {playersWithPoints.map((player) => (
              <article
                key={player.id}
                className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.025]"
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_110px_110px_110px_110px] xl:items-center xl:gap-5">
                  <div className="flex min-w-0 items-center gap-4">
                    {player.avatar ? (
                      <Image
                        src={player.avatar}
                        alt={player.username}
                        width={48}
                        height={48}
                        className="shrink-0"
                      />
                    ) : (
                      <AvatarFallback username={player.username} />
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black" style={{ color: "var(--asc-fg-0)" }}>
                          {player.username}
                        </h3>

                        <StatusBadge isGuildMember={player.isGuildMember} />
                        <RoleBadge role={player.role} />
                      </div>

                      <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                        Joined {formatDate(player.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
                    <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {player._count.teamMemberships}
                    </span>{" "}
                    teams
                  </p>

                  <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
                    <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {player._count.tournamentRegistrations}
                    </span>{" "}
                    regs
                  </p>

                  <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
                    <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
                      {player.tournamentResults}
                    </span>{" "}
                    results
                  </p>

                  <Pill tone={player.tournamentPoints > 0 ? "green" : "gray"}>
                    {player.tournamentPoints} pts
                  </Pill>
                </div>

                <details
                  className="border"
                  style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
                >
                  <summary
                    className="cursor-pointer px-4 py-3 text-sm font-black transition hover:bg-white/[0.03]"
                    style={{ color: "var(--asc-fg-2)" }}
                  >
                    Player details
                  </summary>

                  <div className="grid gap-5 p-4 lg:grid-cols-2" style={{ borderTop: "1px solid var(--asc-line-soft)" }}>
                    <section className="grid gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
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
                      <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
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

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
          ? "border-green-500/20 bg-green-500/10 text-green-300"
          : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
      }`}
    >
      {isGuildMember ? "RTN Member" : "Login Only"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === "admin";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        isAdmin
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
      }`}
    >
      {role}
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

export default async function AdminPlayersList() {
  const players = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
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

  const guildMembers = players.filter((player) => player.isGuildMember);
  const admins = players.filter((player) => player.role === "Admin");
  const externalPlayers = players.length - guildMembers.length;

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            Players
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Registered players
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            View players who logged in with Discord, their RTN membership
            status, team activity, and account activity.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total" value={players.length} />
          <StatCard label="Members" value={guildMembers.length} />
          <StatCard label="External" value={externalPlayers} />
          <StatCard label="Admins" value={admins.length} />
        </div>
      </div>

      {players.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Players will appear here after they login with Discord."
        />
      ) : (
        <div className="grid gap-5">
          {players.map((player) => (
            <article
              key={player.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
            >
              <div className="border-b border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    {player.avatar ? (
                      <Image
                        src={player.avatar}
                        alt={player.username}
                        width={52}
                        height={52}
                        className="rounded-xl"
                      />
                    ) : (
                      <div className="grid h-13 w-13 place-items-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-sm font-black text-indigo-300">
                        RTN
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black text-white">
                          {player.username}
                        </h3>

                        <StatusBadge isGuildMember={player.isGuildMember} />
                        <RoleBadge role={player.role} />
                      </div>

                      <p className="mt-2 text-sm text-gray-400">
                        Joined RTN platform {formatDate(player.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <StatCard label="Leader" value={player._count.ownedTeams} />
                    <StatCard
                      label="Teams"
                      value={player._count.teamMemberships}
                    />
                    <StatCard
                      label="Regs."
                      value={player._count.tournamentRegistrations}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
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

                <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
                    Activity
                  </p>

                  <div className="mt-4 grid gap-3 text-sm text-gray-300">
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
                      label="Team memberships"
                      value={player._count.teamMemberships}
                    />
                    <InfoRow
                      label="Received invites"
                      value={player._count.receivedTeamInvites}
                    />
                  </div>
                </section>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

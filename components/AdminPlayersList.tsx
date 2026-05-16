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
        },
      },
    },
  });

  const guildMembers = players.filter((player) => player.isGuildMember);
  const admins = players.filter((player) => player.role === "Admin");

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Players
        </p>

        <h2 className="text-4xl font-black">Registered Players</h2>

        <p className="mt-4 max-w-3xl leading-7 text-gray-300">
          View players who logged in with Discord, their RTN Discord membership
          status, and their team activity.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Total
          </p>
          <p className="mt-3 text-4xl font-black">{players.length}</p>
          <p className="mt-2 text-sm text-gray-300">Registered players</p>
        </div>

        <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
            RTN Members
          </p>
          <p className="mt-3 text-4xl font-black">{guildMembers.length}</p>
          <p className="mt-2 text-sm text-gray-300">Can use team features</p>
        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">
            External
          </p>
          <p className="mt-3 text-4xl font-black">
            {players.length - guildMembers.length}
          </p>
          <p className="mt-2 text-sm text-gray-300">Logged in only</p>
        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">
            Admins
          </p>
          <p className="mt-3 text-4xl font-black">{admins.length}</p>
          <p className="mt-2 text-sm text-gray-300">Admin role accounts</p>
        </div>
      </div>

      {players.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Players will appear here after they login with Discord."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="hidden grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr] gap-4 border-b border-white/10 bg-black/20 px-5 py-4 text-sm font-bold uppercase tracking-[0.16em] text-gray-400 lg:grid">
            <span>Player</span>
            <span>Discord ID</span>
            <span>Status</span>
            <span>Teams</span>
            <span>Last Login</span>
          </div>

          <div className="divide-y divide-white/10">
            {players.map((player) => (
              <article
                key={player.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr] lg:items-center"
              >
                <div className="flex items-center gap-3">
                  {player.avatar ? (
                    <Image
                      src={player.avatar}
                      alt={player.username}
                      width={44}
                      height={44}
                      className="rounded-xl"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-black text-indigo-300">
                      RTN
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">
                      {player.username}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">{player.role}</p>
                  </div>
                </div>

                <code className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-300">
                  {player.discordId}
                </code>

                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      player.isGuildMember
                        ? "bg-green-500/20 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {player.isGuildMember ? "RTN Member" : "Login Only"}
                  </span>
                </div>

                <div className="text-sm text-gray-300">
                  <p>Leader: {player._count.ownedTeams}</p>
                  <p>Joined: {player._count.teamMemberships}</p>
                </div>

                <p className="text-sm text-gray-400">
                  {formatDate(player.lastLoginAt)}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

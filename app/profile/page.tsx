import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createTeam, respondToTeamInvite } from "@/actions/teamActions";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileIdentityActions from "@/components/ProfileIdentityActions";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your RTN profile, team invitations, and teams.",
};

type ProfilePageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    approved: "border-green-500/20 bg-green-500/10 text-green-300",
    member: "border-green-500/20 bg-green-500/10 text-green-300",
    draft: "border-white/10 bg-white/5 text-gray-300",
    pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
    cancelled: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded border px-3 py-1 text-xs font-bold capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function PanelHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
        {label}
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
        {description}
      </p>
    </div>
  );
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user?.databaseId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.databaseId,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const [teams, invitations] = await Promise.all([
    prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        members: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.teamInvite.findMany({
      where: {
        invitedUserId: user.id,
        status: "pending",
      },
      include: {
        team: true,
        invitedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <ProfileNotice message={params.message} error={params.error} />

        <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-5">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-indigo-500 text-xl font-black text-white">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
                  Player Profile
                </p>

                <h1 className="mt-2 truncate text-4xl font-black text-white">
                  {user.username}
                </h1>

                <div className="mt-3 flex flex-wrap gap-2">
                  {user.isGuildMember ? (
                    <StatusBadge status="Member" />
                  ) : (
                    <StatusBadge status="Not member" />
                  )}

                  <span className="inline-flex rounded border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
                    {teams.length} team{teams.length === 1 ? "" : "s"}
                  </span>

                  <span className="inline-flex rounded border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                    {invitations.length} invite
                    {invitations.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:justify-items-end">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  Discord ID
                </p>

                <ProfileIdentityActions discordId={user.discordId} />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <PanelHeader
              label="Invitations"
              title="Team invitations"
              description="Accept or reject invitations sent by team leaders."
            />

            {invitations.length === 0 ? (
              <div className="p-6 text-gray-300">No pending invitations.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="grid gap-4 px-6 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-black text-white">
                        {invite.team.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {invite.team.game} · invited by{" "}
                        {invite.invitedBy.username}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <form action={respondToTeamInvite}>
                        <input
                          type="hidden"
                          name="inviteId"
                          value={invite.id}
                        />
                        <input type="hidden" name="response" value="accepted" />

                        <button
                          type="submit"
                          className="rounded bg-green-500 px-4 py-2 text-sm font-black text-white transition hover:bg-green-400"
                        >
                          Accept
                        </button>
                      </form>

                      <form action={respondToTeamInvite}>
                        <input
                          type="hidden"
                          name="inviteId"
                          value={invite.id}
                        />
                        <input type="hidden" name="response" value="rejected" />

                        <button
                          type="submit"
                          className="rounded border border-red-500/20 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <PanelHeader
              label="Create Team"
              title="Start a new team"
              description="Create a team, invite players, then register for tournaments."
            />

            {user.isGuildMember ? (
              <form action={createTeam} className="grid gap-5 p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-bold text-gray-200">Team Name</span>

                    <input
                      name="name"
                      required
                      placeholder="Example: RTN Wolves"
                      className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="font-bold text-gray-200">Game</span>

                    <select
                      name="game"
                      required
                      defaultValue=""
                      className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    >
                      <option value="" disabled>
                        Select game
                      </option>

                      {games.map((game) => (
                        <option key={game} value={game}>
                          {game}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="rounded bg-indigo-500 px-5 py-3 font-black text-white transition hover:bg-indigo-400"
                  >
                    Create Team
                  </button>

                  <p className="text-sm leading-6 text-gray-400">
                    You can invite players after creating the team.
                  </p>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5">
                  <p className="font-black text-yellow-300">
                    RTN Discord required
                  </p>

                  <p className="mt-2 leading-7 text-gray-300">
                    You can login to the website, but team creation requires
                    membership in the RTN Discord server.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <PanelHeader
            label="My Teams"
            title="Team overview"
            description="A compact list of your teams. Open a team to manage members, invites, and review status."
          />

          {teams.length === 0 ? (
            <div className="p-6">
              <p className="font-bold text-white">No teams yet</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Create your first team from the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20 text-xs font-black uppercase tracking-[0.12em] text-gray-400">
                    <th className="w-[30%] px-6 py-4">Team</th>
                    <th className="w-[18%] px-6 py-4">Game</th>
                    <th className="w-[12%] px-6 py-4">Members</th>
                    <th className="w-[14%] px-6 py-4">Role</th>
                    <th className="w-[14%] px-6 py-4">Status</th>
                    <th className="w-[12%] px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {teams.map((team) => {
                    const membership = team.members.find(
                      (member) => member.userId === user.id,
                    );

                    const isLeader = team.leaderId === user.id;

                    return (
                      <tr
                        key={team.id}
                        className="border-b border-white/10 transition last:border-b-0 hover:bg-white/[0.035]"
                      >
                        <td className="px-6 py-5">
                          <p className="font-black text-white">{team.name}</p>

                          {team.rejectionReason && (
                            <p className="mt-1 text-sm text-red-300">
                              Rejected: {team.rejectionReason}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 text-gray-300">{team.game}</td>

                        <td className="px-6 py-5 font-bold text-white">
                          {team.members.length}
                        </td>

                        <td className="px-6 py-5 text-gray-300">
                          {isLeader ? "Leader" : membership?.role || "Member"}
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge status={team.status} />
                        </td>

                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/profile/teams/${team.id}`}
                            className="inline-flex rounded bg-indigo-500 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-400"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <Footer />
    </main>
  );
}

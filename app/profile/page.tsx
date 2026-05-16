import type { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/auth";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import ProfileLogoutButton from "@/components/ProfileLogoutButton";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CreateTeamForm from "@/components/CreateTeamForm";

export const metadata: Metadata = {
  title: "Profile",
  description: "View your RTN player profile.",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.databaseId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.databaseId,
    },
    include: {
      ownedTeams: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          members: true,
        },
      },
      teamMemberships: {
        include: {
          team: true,
        },
      },
      receivedTeamInvites: {
        where: {
          status: "pending",
        },
        include: {
          team: true,
          invitedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const memberTeams = user.teamMemberships
    .map((membership) => membership.team)
    .filter((team) => team.leaderId !== user.id);

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="Player Profile"
        title={`Welcome, ${user.username}`}
        description="Manage your RTN profile, teams, invitations, and future tournament activity."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center gap-5">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={80}
                  height={80}
                  className="rounded-3xl"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/20 text-2xl font-black text-indigo-300">
                  RTN
                </div>
              )}

              <div>
                <h2 className="text-2xl font-black">{user.username}</h2>

                <p className="mt-1 text-sm text-gray-400">
                  Discord ID: {user.discordId.slice(0, 6)}******
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              <div
                className={`rounded-2xl border p-4 ${
                  user.isGuildMember
                    ? "border-green-500/20 bg-green-500/10 text-green-300"
                    : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                }`}
              >
                <p className="font-bold">
                  {user.isGuildMember
                    ? "RTN Discord Member"
                    : "Discord Login Active"}
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-300">
                  {user.isGuildMember
                    ? "You can use RTN team and tournament features."
                    : "Join the RTN Discord server to create teams and use tournament features."}
                </p>
              </div>

              <ProfileLogoutButton />
            </div>
          </aside>

          <div className="grid gap-8">
            <CreateTeamForm canCreateTeam={user.isGuildMember} />
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="mb-5 text-3xl font-black">My Teams</h2>

              {user.ownedTeams.length === 0 && memberTeams.length === 0 ? (
                <EmptyState
                  title="No teams yet"
                  description="Your teams will appear here after you create or join an RTN team."
                />
              ) : (
                <div className="grid gap-4">
                  {user.ownedTeams.map((team) => (
                    <article
                      key={team.id}
                      className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5"
                    >
                      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
                        Leader
                      </p>

                      <h3 className="text-2xl font-bold">{team.name}</h3>

                      <p className="mt-2 text-gray-300">
                        {team.game} • {team.status}
                      </p>
                    </article>
                  ))}

                  {memberTeams.map((team) => (
                    <article
                      key={team.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5"
                    >
                      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Member
                      </p>

                      <h3 className="text-2xl font-bold">{team.name}</h3>

                      <p className="mt-2 text-gray-300">
                        {team.game} • {team.status}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="mb-5 text-3xl font-black">Team Invitations</h2>

              {user.receivedTeamInvites.length === 0 ? (
                <EmptyState
                  title="No pending invitations"
                  description="Team invitations will appear here when another player invites you."
                />
              ) : (
                <div className="grid gap-4">
                  {user.receivedTeamInvites.map((invite) => (
                    <article
                      key={invite.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-5"
                    >
                      <h3 className="text-2xl font-bold">{invite.team.name}</h3>

                      <p className="mt-2 text-gray-300">
                        {invite.team.game} • Invited by{" "}
                        {invite.invitedBy.username}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  cancelTeamInviteInline,
  deleteTeamInline,
  invitePlayerToTeamInline,
  removeTeamMemberInline,
  updateTeamInline,
} from "@/actions/teamInlineActions";
import Footer from "@/components/Footer";
import InlineTeamActionForm from "@/components/InlineTeamActionForm";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Team",
  description: "Manage your RTN team.",
};

type TeamDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
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
    leader: "border-green-500/20 bg-green-500/10 text-green-300",
    member: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
    draft: "border-white/10 bg-white/5 text-gray-300",
    pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    invited: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    rejected: "border-red-500/20 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded border px-3 py-1 text-xs font-bold capitalize ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {normalizedStatus === "approved" ? "Active" : status}
    </span>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
      {children}
    </p>
  );
}

function TeamStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

export default async function TeamDetailsPage({
  params,
  searchParams,
}: TeamDetailsPageProps) {
  const { id } = await params;
  const noticeParams = await searchParams;
  const session = await auth();

  if (!session?.user?.databaseId) {
    redirect("/login");
  }

  const team = await prisma.team.findUnique({
    where: {
      id,
    },
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
      invites: {
        where: {
          status: "pending",
        },
        include: {
          invitedUser: true,
          invitedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      results: {
        include: {
          tournament: {
            select: {
              id: true,
              title: true,
              game: true,
              date: true,
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
  });

  if (!team) {
    notFound();
  }

  const currentMembership = team.members.find(
    (member) => member.userId === session.user.databaseId,
  );

  const isLeader = team.leaderId === session.user.databaseId;
  const canManage = Boolean(currentMembership);
  const canEdit = isLeader;
  const canDelete = isLeader;

  if (!canManage) {
    redirect("/profile");
  }

  const totalTeamPoints = team.results.reduce(
    (total, result) => total + result.points,
    0,
  );

  const bestPlacement =
    team.results.length > 0
      ? Math.min(...team.results.map((result) => result.placement))
      : null;

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <ProfileNotice
          message={noticeParams.message}
          error={noticeParams.error}
        />

        <Link
          href="/profile"
          className="mb-6 inline-flex rounded border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to profile
        </Link>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SmallLabel>Team Management</SmallLabel>

              <h1 className="mt-2 text-4xl font-black text-white md:text-5xl">
                {team.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge status={team.status} />

                <span className="inline-flex rounded border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                  {team.game}
                </span>

                <span className="inline-flex rounded border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
                  {team.members.length} member
                  {team.members.length === 1 ? "" : "s"}
                </span>

                <span className="inline-flex rounded border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                  {totalTeamPoints} points
                </span>

                {team.invites.length > 0 && (
                  <span className="inline-flex rounded border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
                    {team.invites.length} pending invite
                    {team.invites.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {team.rejectionReason && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="font-black text-red-300">Team rejected</p>

                  <p className="mt-2 leading-7 text-gray-300">
                    Reason: {team.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2 text-sm text-gray-300 lg:text-right">
              <p>
                Leader:{" "}
                <span className="font-black text-white">
                  {team.leader.username}
                </span>
              </p>

              <p>
                Created:{" "}
                <span className="font-black text-white">
                  {team.createdAt.toLocaleDateString("en")}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
            <SmallLabel>Tournament History</SmallLabel>

            <h2 className="mt-2 text-2xl font-black text-white">
              Team tournament results
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Results and points this team has earned from official RTN
              tournaments.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <TeamStatCard label="Total points" value={totalTeamPoints} />
            <TeamStatCard label="Results" value={team.results.length} />
            <TeamStatCard
              label="Best placement"
              value={bestPlacement ? `#${bestPlacement}` : "-"}
            />
          </div>

          {team.results.length > 0 && (
            <div className="border-t border-white/10">
              <div className="hidden border-b border-white/10 bg-black/20 px-6 py-4 text-xs font-black uppercase tracking-[0.12em] text-gray-400 lg:grid lg:grid-cols-[minmax(0,1fr)_160px_130px_130px]">
                <span>Tournament</span>
                <span>Game</span>
                <span>Placement</span>
                <span>Points</span>
              </div>

              <div className="divide-y divide-white/10">
                {team.results.map((result) => (
                  <article
                    key={result.id}
                    className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_160px_130px_130px] lg:items-center"
                  >
                    <div>
                      <Link
                        href={`/tournaments/${result.tournament.id}`}
                        className="font-black text-white transition hover:text-cyan-300"
                      >
                        {result.tournament.title}
                      </Link>

                      <p className="mt-1 text-sm text-gray-400">
                        {result.tournament.date}
                      </p>

                      {result.note && (
                        <p className="mt-2 text-sm text-gray-500">
                          {result.note}
                        </p>
                      )}
                    </div>

                    <p className="text-sm font-bold text-gray-300">
                      {result.tournament.game}
                    </p>

                    <p className="text-sm font-black text-yellow-300">
                      #{result.placement}
                    </p>

                    <p className="text-sm font-black text-green-300">
                      {result.points} pts
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
              <SmallLabel>Team Controls</SmallLabel>

              <h2 className="mt-2 text-2xl font-black text-white">
                Setup and actions
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Edit the team, invite players, and manage important team actions
                from one clean place.
              </p>
            </div>

            <div className="grid gap-8 p-6">
              <section>
                <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                  Basic settings
                </p>

                {canEdit ? (
                  <InlineTeamActionForm
                    action={updateTeamInline}
                    buttonLabel="Save changes"
                    pendingLabel="Saving..."
                  >
                    <input type="hidden" name="teamId" value={team.id} />

                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-gray-200">
                          Team Name
                        </span>

                        <input
                          name="name"
                          required
                          defaultValue={team.name}
                          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-gray-200">
                          Game
                        </span>

                        <select
                          name="game"
                          required
                          defaultValue={team.game}
                          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                        >
                          {games.map((game) => (
                            <option key={game} value={game}>
                              {game}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </InlineTeamActionForm>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                    Only the team leader can edit this team.
                  </div>
                )}
              </section>

              {isLeader && (
                <section className="border-t border-white/10 pt-6">
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                    Invite player
                  </p>

                  <InlineTeamActionForm
                    action={invitePlayerToTeamInline}
                    buttonLabel="Send invite"
                    pendingLabel="Sending..."
                  >
                    <input type="hidden" name="teamId" value={team.id} />

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Username or Discord ID
                      </span>

                      <input
                        name="player"
                        required
                        placeholder="Example: abu3day or 615..."
                        className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400"
                      />
                    </label>
                  </InlineTeamActionForm>
                </section>
              )}

              {isLeader && canDelete && (
                <section className="border-t border-red-500/20 pt-6">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-red-300">
                    Danger Zone
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div>
                      <p className="font-black text-white">Delete team</p>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-gray-400">
                        Permanently delete this team, its members, and pending
                        invitations.
                      </p>
                    </div>

                    <InlineTeamActionForm
                      action={deleteTeamInline}
                      buttonLabel="Delete team"
                      pendingLabel="Deleting..."
                      variant="danger"
                      confirmTitle="Delete team?"
                      confirmDescription={`Are you sure you want to delete ${team.name}? This cannot be undone.`}
                      confirmLabel="Delete permanently"
                    >
                      <input type="hidden" name="teamId" value={team.id} />
                    </InlineTeamActionForm>
                  </div>
                </section>
              )}
            </div>
          </section>

          <aside className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <SmallLabel>Players</SmallLabel>

              <h2 className="mt-2 text-xl font-black text-white">
                Players and invites
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Current members and pending invites.
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {team.members.map((member) => {
                const isMemberLeader = member.userId === team.leaderId;

                return (
                  <div key={member.id} className="grid gap-3 p-5">
                    <div>
                      <p className="font-black text-white">
                        {member.user.username}
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-400">
                        {member.user.discordId}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <StatusBadge
                        status={isMemberLeader ? "Leader" : "Member"}
                      />

                      {isLeader && !isMemberLeader ? (
                        <InlineTeamActionForm
                          action={removeTeamMemberInline}
                          buttonLabel="Remove"
                          pendingLabel="Removing..."
                          variant="danger"
                          confirmTitle="Remove player?"
                          confirmDescription={`Are you sure you want to remove ${member.user.username} from this team?`}
                          confirmLabel="Remove player"
                        >
                          <input type="hidden" name="teamId" value={team.id} />
                          <input
                            type="hidden"
                            name="memberId"
                            value={member.id}
                          />
                        </InlineTeamActionForm>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {team.invites.map((invite) => (
                <div key={invite.id} className="grid gap-3 p-5">
                  <div>
                    <p className="font-black text-white">
                      {invite.invitedUser.username}
                    </p>

                    <p className="mt-1 break-all text-sm text-gray-400">
                      {invite.invitedUser.discordId}
                    </p>
                  </div>

                  <p className="text-sm text-gray-400">
                    Waiting for player response
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusBadge status="Invited" />

                    {isLeader ? (
                      <InlineTeamActionForm
                        action={cancelTeamInviteInline}
                        buttonLabel="Cancel"
                        pendingLabel="Cancelling..."
                        variant="secondary"
                        confirmTitle="Cancel invitation?"
                        confirmDescription={`Cancel the invitation sent to ${invite.invitedUser.username}?`}
                        confirmLabel="Cancel invite"
                      >
                        <input type="hidden" name="teamId" value={team.id} />
                        <input
                          type="hidden"
                          name="inviteId"
                          value={invite.id}
                        />
                      </InlineTeamActionForm>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>
              ))}

              {team.members.length === 0 && team.invites.length === 0 && (
                <div className="p-5 text-gray-300">
                  No players in this team yet.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

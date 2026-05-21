import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  cancelTeamInviteInline,
  deleteTeamInline,
  invitePlayerToTeamInline,
  leaveTeamInline,
  removeTeamMemberInline,
  transferTeamLeadershipInline,
  updateTeamInline,
} from "@/actions/teamInlineActions";
import { auth } from "@/auth";
import CustomSelect from "@/components/CustomSelect";
import Footer from "@/components/Footer";
import InlineTeamActionForm from "@/components/InlineTeamActionForm";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import { prisma } from "@/lib/prisma";
import { getGameImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Team | Ascendra",
  description: "Manage your Ascendra team.",
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
    approved: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    leader: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    member: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    draft: "border-white/10 bg-white/5 text-gray-300",
    pending: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    invited: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    rejected: "border-red-400/25 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize tracking-[0.08em] ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {normalizedStatus === "approved" ? "Active" : status}
    </span>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
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
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function PanelHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="bg-white/[0.03] px-6 py-5">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
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
      registrations: {
        where: {
          status: {
            in: ["registered", "approved"],
          },
        },
        include: {
          tournament: {
            select: {
              id: true,
              title: true,
              status: true,
              registrationStatus: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
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
  const activeRegistration = team.registrations[0] || null;
  const isTeamLocked = Boolean(activeRegistration);

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

  const teamImage = getGameImageUrl(team.game);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[560px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${teamImage}")`,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.90)_0%,rgba(7,8,17,0.58)_44%,rgba(7,8,17,0.76)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_30%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-32 pt-16 lg:px-10">
            <ProfileNotice
              message={noticeParams.message}
              error={noticeParams.error}
            />

            <Link
              href="/profile"
              className="mt-4 inline-flex rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to profile
            </Link>

            <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <SmallLabel>Team management</SmallLabel>

                  <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
                    {team.name}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={team.status} />

                    <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
                      {team.game}
                    </span>

                    <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
                      {team.members.length} member
                      {team.members.length === 1 ? "" : "s"}
                    </span>

                    <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                      {totalTeamPoints} points
                    </span>

                    {isTeamLocked && (
                      <span className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                        Locked
                      </span>
                    )}

                    {team.invites.length > 0 && (
                      <span className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                        {team.invites.length} pending invite
                        {team.invites.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  {team.rejectionReason && (
                    <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                      <p className="font-black text-red-300">Team rejected</p>

                      <p className="mt-2 leading-7 text-gray-300">
                        Reason: {team.rejectionReason}
                      </p>
                    </div>
                  )}

                  {activeRegistration && (
                    <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4">
                      <p className="font-black text-yellow-300">Team locked</p>

                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        This team is registered for{" "}
                        <Link
                          href={`/tournaments/${activeRegistration.tournament.id}`}
                          className="font-black text-white transition hover:text-violet-300"
                        >
                          {activeRegistration.tournament.title}
                        </Link>
                        .
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
          </div>
        </section>

        <section className="relative -mt-20 mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:px-10">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
            <PanelHeader label="Tournament history" title="Team results" />

            <div className="grid gap-4 p-6 md:grid-cols-3">
              <TeamStatCard label="Total points" value={totalTeamPoints} />
              <TeamStatCard label="Results" value={team.results.length} />
              <TeamStatCard
                label="Best placement"
                value={bestPlacement ? `#${bestPlacement}` : "-"}
              />
            </div>

            {team.results.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-gray-400">
                No tournament results yet.
              </div>
            ) : (
              <div>
                <div className="hidden bg-white/[0.03] px-6 py-4 text-xs font-black uppercase tracking-[0.12em] text-gray-500 lg:grid lg:grid-cols-[minmax(0,1fr)_160px_130px_130px]">
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
                          className="font-black text-white transition hover:text-violet-300"
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

                      <p className="text-sm font-black text-emerald-300">
                        {result.points} pts
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
              <PanelHeader label="Team controls" title="Setup and actions" />

              <div className="grid gap-8 p-6">
                <section>
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                    Basic settings
                  </p>

                  {canEdit && !isTeamLocked ? (
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
                            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-bold text-gray-200">
                            Game
                          </span>

                          <CustomSelect
                            name="game"
                            required
                            placeholder="Select game"
                            defaultValue={team.game}
                            options={games.map((game) => ({
                              value: game,
                              label: game,
                              description: "Team game",
                            }))}
                          />
                        </label>
                      </div>
                    </InlineTeamActionForm>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-gray-300">
                      {isTeamLocked
                        ? "Team settings are locked while registered in a tournament."
                        : "Only the team leader can edit this team."}
                    </div>
                  )}
                </section>

                {isLeader && !isTeamLocked && (
                  <section className="pt-2">
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
                          placeholder="Example: AscendraPlayer or 615..."
                          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
                        />
                      </label>
                    </InlineTeamActionForm>
                  </section>
                )}

                {!isLeader && !isTeamLocked && (
                  <section className="pt-2">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-red-300">
                      Leave team
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                      <div>
                        <p className="font-black text-white">Leave this team</p>

                        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-400">
                          You will be removed from this team. You can only join
                          again if the team leader sends you a new invitation.
                        </p>
                      </div>

                      <InlineTeamActionForm
                        action={leaveTeamInline}
                        buttonLabel="Leave team"
                        pendingLabel="Leaving..."
                        variant="danger"
                        confirmTitle="Leave team?"
                        confirmDescription={`Are you sure you want to leave ${team.name}?`}
                        confirmLabel="Leave team"
                      >
                        <input type="hidden" name="teamId" value={team.id} />
                      </InlineTeamActionForm>
                    </div>
                  </section>
                )}

                {isLeader && canDelete && !isTeamLocked && (
                  <section className="pt-2">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-red-300">
                      Danger zone
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                      <div>
                        <p className="font-black text-white">Delete team</p>

                        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-400">
                          This removes the team, members, and pending invites.
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

            <aside className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
              <div className="bg-white/[0.03] px-5 py-4">
                <SmallLabel>Players</SmallLabel>

                <h2 className="mt-2 text-xl font-black text-white">
                  Players and invites
                </h2>
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

                        {isLeader && !isMemberLeader && !isTeamLocked ? (
                          <div className="flex flex-wrap gap-2">
                            <InlineTeamActionForm
                              action={transferTeamLeadershipInline}
                              buttonLabel="Transfer leader"
                              pendingLabel="Transferring..."
                              variant="secondary"
                              confirmTitle="Transfer leadership?"
                              confirmDescription={`Are you sure you want to make ${member.user.username} the new team leader? You will become a regular member.`}
                              confirmLabel="Transfer leadership"
                            >
                              <input
                                type="hidden"
                                name="teamId"
                                value={team.id}
                              />
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                            </InlineTeamActionForm>

                            <InlineTeamActionForm
                              action={removeTeamMemberInline}
                              buttonLabel="Remove"
                              pendingLabel="Removing..."
                              variant="danger"
                              confirmTitle="Remove player?"
                              confirmDescription={`Are you sure you want to remove ${member.user.username} from this team?`}
                              confirmLabel="Remove player"
                            >
                              <input
                                type="hidden"
                                name="teamId"
                                value={team.id}
                              />
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                            </InlineTeamActionForm>
                          </div>
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

                      {isLeader && !isTeamLocked ? (
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
      </div>
    </main>
  );
}

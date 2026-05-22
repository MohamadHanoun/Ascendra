import type { Metadata } from "next";
import type { ReactNode } from "react";
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
import ProfileRealtime from "@/components/ProfileRealtime";
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

function Pill({
  label,
  tone = "violet",
}: {
  label: string;
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
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "approved") {
    return <Pill label="Active" tone="green" />;
  }

  if (normalizedStatus === "leader") {
    return <Pill label="Leader" tone="green" />;
  }

  if (normalizedStatus === "member") {
    return <Pill label="Member" tone="violet" />;
  }

  if (normalizedStatus === "pending" || normalizedStatus === "invited") {
    return <Pill label={status} tone="yellow" />;
  }

  if (normalizedStatus === "locked") {
    return <Pill label="Locked" tone="yellow" />;
  }

  if (normalizedStatus === "rejected") {
    return <Pill label="Rejected" tone="red" />;
  }

  return <Pill label={status} tone="gray" />;
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

function CollapsibleSection({
  label,
  title,
  meta,
  children,
  defaultOpen = false,
}: {
  label: string;
  title: string;
  meta?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.035]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            {label}
          </p>

          <h2 className="mt-1 text-xl font-black text-white">{title}</h2>

          {meta && <p className="mt-1 text-sm text-gray-500">{meta}</p>}
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/25 text-lg font-black text-gray-300 transition group-open:rotate-45 group-hover:border-violet-400/30 group-hover:text-white">
          +
        </span>
      </summary>

      <div className="border-t border-white/10">{children}</div>
    </details>
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
          tournament: {
            status: {
              notIn: ["ended", "cancelled"],
            },
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

        <section className="relative min-h-[500px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${teamImage}")`,
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.62)_48%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-28 pt-16 lg:px-10">
            <ProfileNotice
              message={noticeParams.message}
              error={noticeParams.error}
            />
            <ProfileRealtime />

            <Link
              href="/profile"
              className="mt-4 inline-flex rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to profile
            </Link>

            <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                    Team management
                  </p>

                  <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
                    {team.name}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={team.status} />
                    <Pill label={team.game} />
                    <Pill
                      label={`${team.members.length} member${
                        team.members.length === 1 ? "" : "s"
                      }`}
                    />
                    <Pill label={`${totalTeamPoints} points`} tone="green" />
                    {isTeamLocked && <StatusBadge status="Locked" />}
                    {team.invites.length > 0 && (
                      <Pill
                        label={`${team.invites.length} pending invite${
                          team.invites.length === 1 ? "" : "s"
                        }`}
                        tone="yellow"
                      />
                    )}
                  </div>

                  {activeRegistration && (
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-yellow-300">
                      Locked while registered for{" "}
                      <Link
                        href={`/tournaments/${activeRegistration.tournament.id}`}
                        className="font-black text-white transition hover:text-violet-300"
                      >
                        {activeRegistration.tournament.title}
                      </Link>
                      .
                    </p>
                  )}

                  {team.rejectionReason && (
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-red-300">
                      {team.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-5 lg:text-right">
                  <Stat label="Leader" value={team.leader.username} />
                  <Stat label="Results" value={team.results.length} />
                  <Stat
                    label="Best"
                    value={bestPlacement ? `#${bestPlacement}` : "-"}
                  />
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10">
          <div className="grid content-start gap-5">
            <CollapsibleSection
              label="Settings"
              title="Team setup"
              meta={
                isTeamLocked
                  ? "Locked while registered in an active tournament."
                  : isLeader
                    ? "Edit team name, game, invites, and team actions."
                    : "Only the leader can edit team settings."
              }
              defaultOpen={!isTeamLocked}
            >
              <div className="grid gap-6 p-5">
                {isLeader && !isTeamLocked ? (
                  <InlineTeamActionForm
                    action={updateTeamInline}
                    buttonLabel="Save changes"
                    pendingLabel="Saving..."
                  >
                    <input type="hidden" name="teamId" value={team.id} />

                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-gray-200">
                          Team name
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
                  <p className="text-sm leading-6 text-gray-400">
                    {isTeamLocked
                      ? "Settings are locked while this team is registered in an active tournament. They unlock after the tournament ends or the registration is cancelled."
                      : "Only the team leader can edit settings."}
                  </p>
                )}

                {isLeader && !isTeamLocked && (
                  <div className="border-t border-white/10 pt-5">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
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
                  </div>
                )}

                {!isLeader && !isTeamLocked && (
                  <div className="border-t border-white/10 pt-5">
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
                )}

                {isLeader && !isTeamLocked && (
                  <div className="border-t border-red-500/20 pt-5">
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
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              label="History"
              title="Tournament results"
              meta={`${team.results.length} result${team.results.length === 1 ? "" : "s"} · ${totalTeamPoints} points`}
              defaultOpen={team.results.length > 0}
            >
              <div className="grid grid-cols-3 gap-5 border-b border-white/10 p-5">
                <Stat label="Points" value={totalTeamPoints} />
                <Stat label="Results" value={team.results.length} />
                <Stat
                  label="Best"
                  value={bestPlacement ? `#${bestPlacement}` : "-"}
                />
              </div>

              {team.results.length === 0 ? (
                <div className="p-5 text-sm text-gray-400">
                  No tournament results yet.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {team.results.map((result) => (
                    <article
                      key={result.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_100px_100px] md:items-center"
                    >
                      <div>
                        <Link
                          href={`/tournaments/${result.tournament.id}`}
                          className="font-black text-white transition hover:text-violet-300"
                        >
                          {result.tournament.title}
                        </Link>

                        <p className="mt-1 text-sm text-gray-400">
                          {result.tournament.game} · {result.tournament.date}
                        </p>

                        {result.note && (
                          <p className="mt-2 text-sm text-gray-500">
                            {result.note}
                          </p>
                        )}
                      </div>

                      <Pill label={`#${result.placement}`} tone="yellow" />
                      <Pill label={`${result.points} pts`} tone="green" />
                    </article>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </div>

          <aside>
            <CollapsibleSection
              label="Roster"
              title="Players and invites"
              meta={`${team.members.length} member${team.members.length === 1 ? "" : "s"} · ${team.invites.length} invite${team.invites.length === 1 ? "" : "s"}`}
              defaultOpen
            >
              <div className="divide-y divide-white/10">
                {team.members.map((member) => {
                  const isMemberLeader = member.userId === team.leaderId;

                  return (
                    <div key={member.id} className="grid gap-3 px-5 py-4">
                      <div>
                        <p className="font-black text-white">
                          {member.user.username}
                        </p>

                        <p className="mt-1 break-all text-xs text-gray-500">
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
                              buttonLabel="Make leader"
                              pendingLabel="Transferring..."
                              variant="secondary"
                              confirmTitle="Transfer leadership?"
                              confirmDescription={`Make ${member.user.username} the new team leader?`}
                              confirmLabel="Transfer"
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
                              confirmDescription={`Remove ${member.user.username} from this team?`}
                              confirmLabel="Remove"
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
                  <div key={invite.id} className="grid gap-3 px-5 py-4">
                    <div>
                      <p className="font-black text-white">
                        {invite.invitedUser.username}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-500">
                        {invite.invitedUser.discordId}
                      </p>
                    </div>

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
            </CollapsibleSection>
          </aside>
        </section>

        <Footer />
      </div>
    </main>
  );
}

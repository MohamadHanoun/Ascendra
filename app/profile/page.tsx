import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createTeam, respondToTeamInvite } from "@/actions/teamActions";
import { auth } from "@/auth";
import CustomSelect from "@/components/CustomSelect";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileIdentityActions from "@/components/ProfileIdentityActions";
import ProfileNotice from "@/components/ProfileNotice";
import ProfileRealtime from "@/components/ProfileRealtime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile | Ascendra",
  description: "Manage your Ascendra profile, invitations, and teams.",
};

type ProfilePageProps = {
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

  const tone =
    normalizedStatus === "approved" || normalizedStatus === "member"
      ? "green"
      : normalizedStatus === "pending"
        ? "yellow"
        : normalizedStatus === "rejected" || normalizedStatus === "not member"
          ? "red"
          : "gray";

  const label = normalizedStatus === "approved" ? "Active" : status;

  return <Pill label={label} tone={tone} />;
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

function PanelTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-white/10 px-5 py-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
    </div>
  );
}

function Avatar({
  username,
  avatar,
}: {
  username: string;
  avatar: string | null;
}) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        className="h-20 w-20 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10">
      <span className="text-xl font-black uppercase text-white">
        {username.slice(0, 2)}
      </span>
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

  const [teams, invitations, tournamentResults] = await Promise.all([
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
        team: {
          include: {
            members: true,
          },
        },
        invitedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.tournamentResult.findMany({
      where: {
        team: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      include: {
        team: true,
        tournament: {
          select: {
            id: true,
            title: true,
            game: true,
          },
        },
      },
      orderBy: [
        {
          awardedAt: "desc",
        },
      ],
    }),
  ]);

  const tournamentPoints = tournamentResults.reduce(
    (total, result) => total + result.points,
    0,
  );

  const bestPlacement =
    tournamentResults.length > 0
      ? Math.min(...tournamentResults.map((result) => result.placement))
      : null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[400px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/profile-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.92)_0%,rgba(7,8,17,0.66)_48%,rgba(7,8,17,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-14 lg:px-10">
            <ProfileNotice message={params.message} error={params.error} />
            <ProfileRealtime />

            <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                  <Avatar username={user.username} avatar={user.avatar} />

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                      Player profile
                    </p>

                    <h1 className="mt-2 truncate text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
                      {user.username}
                    </h1>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {user.isGuildMember ? (
                        <StatusBadge status="Member" />
                      ) : (
                        <StatusBadge status="Not member" />
                      )}

                      <Pill label={`${teams.length} teams`} />
                      <Pill label={`${tournamentPoints} points`} tone="green" />
                      <Pill label={`${invitations.length} invites`} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 lg:justify-items-end">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Discord ID
                  </p>

                  <ProfileIdentityActions discordId={user.discordId} />
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="relative -mt-14 mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
          <div className="grid min-w-0 gap-8">
            {invitations.length > 0 && (
              <section className="overflow-hidden rounded-3xl border border-yellow-400/20 bg-yellow-500/[0.05] shadow-2xl shadow-black/20">
                <PanelTitle label="Invitations" title="Pending team invites" />

                <div className="divide-y divide-white/10">
                  {invitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-black text-white">
                          {invite.team.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {invite.team.game} · {invite.team.members.length}{" "}
                          member
                          {invite.team.members.length === 1 ? "" : "s"} · by{" "}
                          {invite.invitedBy.username}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <form action={respondToTeamInvite}>
                          <input
                            type="hidden"
                            name="inviteId"
                            value={invite.id}
                          />
                          <input
                            type="hidden"
                            name="response"
                            value="accepted"
                          />

                          <button
                            type="submit"
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-400"
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
                          <input
                            type="hidden"
                            name="response"
                            value="rejected"
                          />

                          <button
                            type="submit"
                            className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10"
                          >
                            Decline
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <PanelTitle label="My teams" title="Team overview" />

              {teams.length === 0 ? (
                <div className="p-5">
                  <p className="font-black text-white">No teams yet</p>
                  <p className="mt-2 text-sm text-gray-400">
                    Create your first team below.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {teams.map((team) => {
                    const membership = team.members.find(
                      (member) => member.userId === user.id,
                    );

                    const isLeader = team.leaderId === user.id;

                    return (
                      <article
                        key={team.id}
                        className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] md:grid-cols-[minmax(0,1fr)_130px_110px_90px] md:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {team.name}
                          </p>

                          <p className="mt-1 text-sm text-gray-400">
                            {team.game} · {team.members.length} member
                            {team.members.length === 1 ? "" : "s"}
                          </p>

                          {team.rejectionReason && (
                            <p className="mt-1 text-sm text-red-300">
                              {team.rejectionReason}
                            </p>
                          )}
                        </div>

                        <StatusBadge status={team.status} />

                        <p className="text-sm font-bold text-gray-400">
                          {isLeader ? "Leader" : membership?.role || "Member"}
                        </p>

                        <Link
                          href={`/profile/teams/${team.id}`}
                          className="rounded-xl bg-violet-600 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-violet-500"
                        >
                          Open
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <PanelTitle label="Create team" title="Start a new team" />

              {user.isGuildMember ? (
                <form action={createTeam} className="grid gap-5 p-5">
                  <div className="relative z-50 grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-200">
                        Team name
                      </span>

                      <input
                        name="name"
                        required
                        placeholder="Example: Ascendra Wolves"
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
                        options={games.map((game) => ({
                          value: game,
                          label: game,
                          description: "Team game",
                        }))}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-fit rounded-xl bg-violet-600 px-5 py-3 font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
                  >
                    Create team
                  </button>
                </form>
              ) : (
                <div className="p-5">
                  <div className="rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4">
                    <p className="font-black text-yellow-300">
                      Ascendra Discord required
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      Join the Discord server and refresh your login to create
                      or join teams.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside>
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 lg:sticky lg:top-24">
              <div className="grid gap-4 border-b border-white/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  Progress
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Points" value={tournamentPoints} />
                  <Stat label="Results" value={tournamentResults.length} />
                  <Stat
                    label="Best"
                    value={bestPlacement ? `#${bestPlacement}` : "-"}
                  />
                </div>
              </div>

              {tournamentResults.length === 0 ? (
                <div className="p-5 text-sm text-gray-400">
                  No tournament results yet.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {tournamentResults.slice(0, 6).map((result) => {
                    const teamName =
                      result.snapshotTeamName || result.team.name;

                    return (
                      <Link
                        key={result.id}
                        href={`/tournaments/${result.tournament.id}`}
                        className="block px-5 py-4 transition hover:bg-white/[0.035]"
                      >
                        <p className="truncate font-black text-white">
                          {result.tournament.title}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {teamName} · {result.tournament.game}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill label={`#${result.placement}`} tone="yellow" />
                          <Pill label={`${result.points} pts`} tone="green" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </section>

        <Footer />
      </div>
    </main>
  );
}

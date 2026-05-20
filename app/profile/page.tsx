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
import CustomSelect from "@/components/CustomSelect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile | Ascendra",
  description: "Manage your Ascendra profile, team invitations, and teams.",
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
    approved: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    member: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    draft: "border-white/10 bg-white/5 text-gray-300",
    pending: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    rejected: "border-red-400/25 bg-red-500/10 text-red-300",
    cancelled: "border-red-400/25 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black capitalize tracking-[0.08em] ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function PanelHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
    </div>
  );
}

function ProfileStatCard({
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

function AscendraAvatarFallback({ username }: { username: string }) {
  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10">
      <div className="absolute inset-0 rounded-2xl bg-violet-500/25 blur-xl" />
      <span className="relative text-xl font-black uppercase text-white">
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
        team: true,
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
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-75"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(7,8,17,0.98), rgba(7,8,17,0.82), rgba(7,8,17,0.96)), url("/images/backgrounds/profile-hero.webp")',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.28)_0%,transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10)_0%,transparent_28%)]" />

          <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-14 lg:px-10">
            <ProfileNotice message={params.message} error={params.error} />

            <section className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur">
              <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <AscendraAvatarFallback username={user.username} />
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
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

                      <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
                        {teams.length} team{teams.length === 1 ? "" : "s"}
                      </span>

                      <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
                        {tournamentPoints} points
                      </span>

                      <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                        {tournamentResults.length} result
                        {tournamentResults.length === 1 ? "" : "s"}
                      </span>

                      <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200">
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
          </div>

          <svg
            className="absolute bottom-[-1px] left-0 w-full text-[#070811]"
            viewBox="0 0 1440 120"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
          <div className="grid min-w-0 gap-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
                <PanelHeader label="Invitations" title="Team invitations" />

                {invitations.length === 0 ? (
                  <div className="p-6 text-gray-300">
                    No pending invitations.
                  </div>
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
                              Reject
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
                <PanelHeader label="Create team" title="Start a new team" />

                {user.isGuildMember ? (
                  <form action={createTeam} className="grid gap-5 p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="font-bold text-gray-200">
                          Team Name
                        </span>

                        <input
                          name="name"
                          required
                          placeholder="Example: Ascendra Wolves"
                          className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="font-bold text-gray-200">Game</span>

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

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="rounded-xl bg-violet-600 px-5 py-3 font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
                      >
                        Create Team
                      </button>

                      <p className="text-sm leading-6 text-gray-400">
                        Invites are managed from the team page.
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="p-6">
                    <div className="rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-5">
                      <p className="font-black text-yellow-300">
                        Ascendra Discord required
                      </p>

                      <p className="mt-2 leading-7 text-gray-300">
                        Team creation requires Ascendra Discord membership.
                        Please join the Discord server and link your account to
                        create or join teams.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <PanelHeader label="My teams" title="Team overview" />

              {teams.length === 0 ? (
                <div className="p-6">
                  <p className="font-bold text-white">No teams yet</p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Create your first team from the form above.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 p-5">
                  {teams.map((team) => {
                    const membership = team.members.find(
                      (member) => member.userId === user.id,
                    );

                    const isLeader = team.leaderId === user.id;

                    return (
                      <article
                        key={team.id}
                        className="grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-[minmax(0,1fr)_140px_90px_120px_100px] md:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {team.name}
                          </p>

                          {team.rejectionReason && (
                            <p className="mt-1 text-sm text-red-300">
                              Rejected: {team.rejectionReason}
                            </p>
                          )}
                        </div>

                        <p className="text-sm text-gray-300">{team.game}</p>

                        <p className="text-sm font-bold text-white">
                          {team.members.length} members
                        </p>

                        <div>
                          <StatusBadge status={team.status} />
                        </div>

                        <Link
                          href={`/profile/teams/${team.id}`}
                          className="rounded-xl bg-violet-600 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-violet-500"
                        >
                          Manage
                        </Link>

                        <p className="text-sm text-gray-500 md:col-start-2 md:row-start-2">
                          {isLeader ? "Leader" : membership?.role || "Member"}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside>
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 lg:sticky lg:top-24">
              <div className="border-b border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                  Progress
                </p>

                <div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
                    Total points
                  </p>

                  <p className="mt-2 text-4xl font-black text-white">
                    {tournamentPoints}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ProfileStatCard
                    label="Results"
                    value={tournamentResults.length}
                  />
                  <ProfileStatCard
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
                <div className="grid gap-3 p-5">
                  {tournamentResults.slice(0, 6).map((result) => (
                    <Link
                      key={result.id}
                      href={`/tournaments/${result.tournament.id}`}
                      className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-violet-400/30 hover:bg-white/[0.05]"
                    >
                      <p className="truncate font-black text-white">
                        {result.tournament.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {result.team.name} · {result.tournament.game}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-500/10 px-2 py-1 text-xs font-black text-yellow-300">
                          #{result.placement}
                        </span>

                        <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-xs font-black text-emerald-300">
                          {result.points} pts
                        </span>
                      </div>
                    </Link>
                  ))}

                  {tournamentResults.length > 6 && (
                    <p className="text-sm text-gray-500">
                      Showing latest 6 results.
                    </p>
                  )}
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

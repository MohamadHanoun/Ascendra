import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ascendra",
  description: "Ascendra competitive gaming and tournament platform.",
};


const playerJourney = [
  {
    title: "Verify access",
    description:
      "Players sign in with Discord and connect their account to the Ascendra community.",
  },
  {
    title: "Build a roster",
    description:
      "Team leaders create teams, invite members, and prepare eligible lineups.",
  },
  {
    title: "Enter tournaments",
    description:
      "Eligible teams register for open events that match their game and team size.",
  },
  {
    title: "Admin review",
    description:
      "Registrations are reviewed before teams are confirmed for official events.",
  },
  {
    title: "Results and ranking",
    description:
      "Placements award points that update profiles, team history, and leaderboards.",
  },
];

type PlayerHubStats = {
  isLoggedIn: boolean;
  teamsCount: number;
  pendingInvitesCount: number;
  activeRegistrationsCount: number;
  tournamentResultsCount: number;
  tournamentPoints: number;
  bestPlacement: number | null;
};

function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const styles = {
    default: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    warning: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    danger: "border-red-400/25 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${styles[variant]}`}
    >
      {status}
    </span>
  );
}

function getStatusVariant(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("open") || normalized.includes("approved")) {
    return "success";
  }

  if (normalized.includes("upcoming") || normalized.includes("pending")) {
    return "warning";
  }

  if (normalized.includes("closed") || normalized.includes("rejected")) {
    return "danger";
  }

  return "default";
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:border-violet-400/30 hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-violet-300">
        {label}
      </p>

      <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
        {title}
      </h2>

      <p className="mt-4 text-base leading-8 text-gray-400 md:text-lg">
        {description}
      </p>
    </div>
  );
}

function PlayerJourneyStep({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <article className="relative rounded-3xl border border-white/10 bg-black/25 p-6 transition hover:border-violet-400/30 hover:bg-white/[0.045]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-950/30">
          {String(index).padStart(2, "0")}
        </div>

        <div className="h-px flex-1 bg-gradient-to-r from-violet-400/40 to-transparent" />
      </div>

      <h3 className="text-xl font-black text-white">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-gray-400">{description}</p>
    </article>
  );
}

function TournamentMiniCard({
  tournament,
}: {
  tournament: {
    id: string;
    title: string;
    game: string;
    date: string;
    imageUrl: string | null;
    maxSlots: number;
    teamSize: number;
    status: string;
    registrationStatus: string;
    registrations: { id: string }[];
  };
}) {
  const registeredTeams = tournament.registrations.length;

  const progress =
    tournament.maxSlots > 0
      ? Math.min((registeredTeams / tournament.maxSlots) * 100, 100)
      : 0;

  const imageSrc = getTournamentImageUrl(tournament.game, tournament.imageUrl);

  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.06]">
      <div
        className="relative h-48 overflow-hidden bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
        style={{
          backgroundImage: `url("${imageSrc}")`,
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(7,8,17,0.96)_0%,rgba(7,8,17,0.42)_58%,rgba(7,8,17,0.12)_100%)]" />

        <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2">
          <StatusBadge
            status={tournament.status}
            variant={getStatusVariant(tournament.status)}
          />
          <StatusBadge
            status={`Registration ${tournament.registrationStatus}`}
            variant={getStatusVariant(tournament.registrationStatus)}
          />
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-200/90">
            {tournament.game}
          </p>

          <h3 className="mt-1 text-3xl font-black leading-none text-white">
            {tournament.title}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
              Date
            </p>
            <p className="mt-1 truncate text-sm font-black text-white">
              {tournament.date || "TBA"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
              Team
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {tournament.teamSize}v{tournament.teamSize}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
              Slots
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {registeredTeams}/{tournament.maxSlots}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-400">
            <span>{registeredTeams} registered teams</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Link
          href={`/tournaments/${tournament.id}`}
          className="mt-5 inline-flex w-full justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

function PlayerHubStatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-300">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">{value}</p>

      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function PlayerHubSection({ stats }: { stats: PlayerHubStats }) {
  const bestPlacementValue = stats.bestPlacement
    ? `#${stats.bestPlacement}`
    : "-";

  return (
    <section className="relative py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 shadow-2xl shadow-black/20 backdrop-blur md:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-violet-300">
                Player hub
              </p>

              <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
                {stats.isLoggedIn
                  ? "Your teams, invitations, and results."
                  : "Manage teams, invitations, and results from one place."}
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-400">
                {stats.isLoggedIn
                  ? "This overview is connected to your account and updates from your teams, invitations, tournament registrations, and results."
                  : "Login with Discord to create teams, manage invitations, register for tournaments, and track your tournament activity."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href={stats.isLoggedIn ? "/profile" : "/login"}>
                  {stats.isLoggedIn ? "Open profile" : "Login with Discord"}
                </PrimaryLink>

                <SecondaryLink href="/tournaments">
                  View tournaments
                </SecondaryLink>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PlayerHubStatCard
                label="Teams"
                value={stats.teamsCount}
                description="Teams where you are currently a member."
              />

              <PlayerHubStatCard
                label="Invites"
                value={stats.pendingInvitesCount}
                description="Pending invitations waiting for your response."
              />

              <PlayerHubStatCard
                label="Registrations"
                value={stats.activeRegistrationsCount}
                description="Active tournament registrations through your teams."
              />

              <PlayerHubStatCard
                label="Points"
                value={stats.tournamentPoints}
                description={`${stats.tournamentResultsCount} result${
                  stats.tournamentResultsCount === 1 ? "" : "s"
                } · Best placement ${bestPlacementValue}`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function getPlayerHubStats(): Promise<PlayerHubStats> {
  const session = await auth();

  if (!session?.user?.databaseId) {
    return {
      isLoggedIn: false,
      teamsCount: 0,
      pendingInvitesCount: 0,
      activeRegistrationsCount: 0,
      tournamentResultsCount: 0,
      tournamentPoints: 0,
      bestPlacement: null,
    };
  }

  const userId = session.user.databaseId;

  const [
    teamsCount,
    pendingInvitesCount,
    activeRegistrationsCount,
    resultStats,
  ] = await Promise.all([
    prisma.team.count({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    }),

    prisma.teamInvite.count({
      where: {
        invitedUserId: userId,
        status: "pending",
      },
    }),

    prisma.tournamentRegistration.count({
      where: {
        status: {
          in: ["registered", "approved"],
        },
        team: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    }),

    prisma.tournamentResult.aggregate({
      where: {
        team: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        points: true,
      },
      _min: {
        placement: true,
      },
    }),
  ]);

  return {
    isLoggedIn: true,
    teamsCount,
    pendingInvitesCount,
    activeRegistrationsCount,
    tournamentResultsCount: resultStats._count.id,
    tournamentPoints: resultStats._sum.points || 0,
    bestPlacement: resultStats._min.placement,
  };
}

export default async function HomePage() {
  const [tournaments, playerHubStats] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        title: true,
        game: true,
        date: true,
        imageUrl: true,
        maxSlots: true,
        teamSize: true,
        status: true,
        registrationStatus: true,
        registrations: {
          where: {
            status: {
              in: ["registered", "approved"],
            },
          },
          select: {
            id: true,
          },
        },
      },
    }),

    getPlayerHubStats(),
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[760px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/home-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.82)_0%,rgba(7,8,17,0.45)_44%,rgba(7,8,17,0.58)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_32%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 flex min-h-[760px] items-center px-6 pb-32 pt-20 lg:px-10 2xl:px-14">
            <div className="max-w-5xl">
              <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
                Ascendra tournament platform
              </p>

              <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
                Compete in organized community tournaments
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
                Create a team, register for events, and follow tournament
                progress from one clean player hub.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <PrimaryLink href="/tournaments">
                  Explore tournaments
                </PrimaryLink>
                <SecondaryLink href="/profile">Create a team</SecondaryLink>
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label="Tournaments"
              title="Latest tournaments."
              description="Explore current events, check registration status, and open the full tournament page for details."
            />

            {tournaments.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-gray-300 shadow-2xl shadow-black/20">
                No tournaments available yet.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {tournaments.map((tournament) => (
                  <TournamentMiniCard
                    key={tournament.id}
                    tournament={tournament}
                  />
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <SecondaryLink href="/tournaments">
                View all tournaments
              </SecondaryLink>
            </div>
          </div>
        </section>
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-8 shadow-2xl shadow-black/25 backdrop-blur md:p-10">
              <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div>
                  <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-violet-300">
                    Player journey
                  </p>

                  <h2 className="max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl">
                    From team setup to official rankings.
                  </h2>
                </div>

                <p className="max-w-3xl text-base leading-8 text-gray-400 lg:justify-self-end">
                  Ascendra connects team creation, tournament registration,
                  admin review, and result tracking into one organized
                  competitive flow.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                {playerJourney.map((step, index) => (
                  <PlayerJourneyStep
                    key={step.title}
                    index={index + 1}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <PlayerHubSection stats={playerHubStats} />

        <Footer />
      </div>
    </main>
  );
}

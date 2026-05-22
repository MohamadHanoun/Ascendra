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

type SnapshotMember = {
  userId?: string;
  username?: string;
};

type PlayerHubStats = {
  isLoggedIn: boolean;
  teamsCount: number;
  pendingInvitesCount: number;
  activeRegistrationsCount: number;
  tournamentResultsCount: number;
  tournamentPoints: number;
  bestPlacement: number | null;
};

const playerJourney = [
  {
    title: "Create team",
    description: "Build your roster and invite players.",
  },
  {
    title: "Register",
    description: "Enter eligible teams into open tournaments.",
  },
  {
    title: "Admin review",
    description: "Applications are reviewed before approval.",
  },
  {
    title: "Compete",
    description: "Play official events with confirmed teams.",
  },
  {
    title: "Earn points",
    description: "Results update rankings and history.",
  },
];

function parseSnapshotMembers(snapshotMembers: unknown): SnapshotMember[] {
  if (!Array.isArray(snapshotMembers)) {
    return [];
  }

  return snapshotMembers
    .filter((member): member is Record<string, unknown> => {
      return Boolean(member) && typeof member === "object";
    })
    .map((member) => ({
      userId: typeof member.userId === "string" ? member.userId : undefined,
      username:
        typeof member.username === "string" ? member.username : undefined,
    }))
    .filter((member) => Boolean(member.userId));
}

function getTournamentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Tournament open",
    upcoming: "Upcoming",
    closed: "Tournament closed",
    ended: "Ended",
    cancelled: "Cancelled",
  };

  return labels[status.toLowerCase()] || status;
}

function getRegistrationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Registration open",
    closed: "Registration closed",
  };

  return labels[status.toLowerCase()] || status;
}

function getTournamentSortPriority(status: string) {
  const priorities: Record<string, number> = {
    open: 0,
    upcoming: 1,
    closed: 2,
    ended: 3,
    cancelled: 4,
  };

  return priorities[status.toLowerCase()] ?? 10;
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalized = status.toLowerCase().replace("registration ", "");

  const tone =
    normalized === "open" || normalized === "approved"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
      : normalized === "upcoming" || normalized === "registered"
        ? "border-yellow-400/25 bg-yellow-500/10 text-yellow-300"
        : normalized === "closed" || normalized === "rejected"
          ? "border-red-400/25 bg-red-500/10 text-red-300"
          : normalized === "ended"
            ? "border-blue-400/25 bg-blue-500/10 text-blue-300"
            : "border-white/10 bg-white/5 text-gray-300";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${tone}`}
    >
      {label || status}
    </span>
  );
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
      className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
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
    <div className="mb-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
        {label}
      </p>

      <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">
        {title}
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
        {description}
      </p>
    </div>
  );
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

function ProgressBar({
  approvedSlots,
  maxSlots,
}: {
  approvedSlots: number;
  maxSlots: number;
}) {
  const progress =
    maxSlots > 0 ? Math.min((approvedSlots / maxSlots) * 100, 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs font-bold text-gray-500">
        <span>
          {approvedSlots}/{maxSlots} approved
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 shadow-lg shadow-violet-500/25"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
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
    registrations: {
      id: string;
      status: string;
    }[];
  };
}) {
  const approvedSlots = tournament.registrations.filter(
    (registration) => registration.status === "approved",
  ).length;

  const applications = tournament.registrations.length;
  const imageSrc = getTournamentImageUrl(tournament.game, tournament.imageUrl);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition hover:bg-white/[0.06]">
      <div
        className="h-44 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(7,8,17,0.10), rgba(7,8,17,0.82)), url("${imageSrc}")`,
        }}
      />

      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            status={tournament.status}
            label={getTournamentStatusLabel(tournament.status)}
          />

          <StatusBadge
            status={tournament.registrationStatus}
            label={getRegistrationStatusLabel(tournament.registrationStatus)}
          />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            {tournament.game}
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            {tournament.title}
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            {tournament.date} · {tournament.teamSize}v{tournament.teamSize}
          </p>
        </div>

        <ProgressBar
          approvedSlots={approvedSlots}
          maxSlots={tournament.maxSlots}
        />

        <p className="text-xs font-bold text-gray-500">
          {applications} application{applications === 1 ? "" : "s"} submitted.
        </p>

        <Link
          href={`/tournaments/${tournament.id}`}
          className="rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-violet-500"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

function JourneyRow({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <article className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[80px_180px_minmax(0,1fr)] md:items-center">
      <p className="text-sm font-black text-violet-300">
        {String(index).padStart(2, "0")}
      </p>

      <h3 className="font-black text-white">{title}</h3>

      <p className="text-sm leading-6 text-gray-400">{description}</p>
    </article>
  );
}

function PlayerHubSection({ stats }: { stats: PlayerHubStats }) {
  return (
    <section className="relative py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                Player hub
              </p>

              <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">
                {stats.isLoggedIn
                  ? "Your activity in one place."
                  : "Teams, entries, and results."}
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400">
                {stats.isLoggedIn
                  ? "Open your profile to manage teams, invitations, registrations, and tournament history."
                  : "Login with Discord to create teams, register for tournaments, and follow your progress."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryLink href={stats.isLoggedIn ? "/profile" : "/login"}>
                  {stats.isLoggedIn ? "Open profile" : "Login with Discord"}
                </PrimaryLink>

                <SecondaryLink href="/tournaments">
                  View tournaments
                </SecondaryLink>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Stat label="Teams" value={stats.teamsCount} />
              <Stat label="Invites" value={stats.pendingInvitesCount} />
              <Stat label="Entries" value={stats.activeRegistrationsCount} />
              <Stat label="Points" value={stats.tournamentPoints} />
              <Stat label="Results" value={stats.tournamentResultsCount} />
              <Stat
                label="Best"
                value={stats.bestPlacement ? `#${stats.bestPlacement}` : "-"}
              />
            </div>
          </div>
        </section>
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
    tournamentResults,
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
        tournament: {
          status: {
            notIn: ["ended", "cancelled"],
          },
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

    prisma.tournamentResult.findMany({
      select: {
        points: true,
        placement: true,
        snapshotMembers: true,
        team: {
          select: {
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let tournamentResultsCount = 0;
  let tournamentPoints = 0;
  let bestPlacement: number | null = null;

  for (const result of tournamentResults) {
    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);

    const resultUserIds =
      snapshotMembers.length > 0
        ? snapshotMembers
            .map((member) => member.userId)
            .filter((memberUserId): memberUserId is string =>
              Boolean(memberUserId),
            )
        : result.team.members.map((member) => member.userId);

    if (!resultUserIds.includes(userId)) {
      continue;
    }

    tournamentResultsCount += 1;
    tournamentPoints += result.points;
    bestPlacement =
      bestPlacement === null
        ? result.placement
        : Math.min(bestPlacement, result.placement);
  }

  return {
    isLoggedIn: true,
    teamsCount,
    pendingInvitesCount,
    activeRegistrationsCount,
    tournamentResultsCount,
    tournamentPoints,
    bestPlacement,
  };
}

export default async function HomePage() {
  const [rawTournaments, playerHubStats] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
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
        createdAt: true,
        registrations: {
          where: {
            status: {
              in: ["registered", "approved", "rejected"],
            },
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),

    getPlayerHubStats(),
  ]);

  const tournaments = [...rawTournaments]
    .sort((a, b) => {
      const priorityA = getTournamentSortPriority(a.status);
      const priorityB = getTournamentSortPriority(b.status);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 3);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[720px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/home-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.86)_0%,rgba(7,8,17,0.50)_44%,rgba(7,8,17,0.68)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 flex min-h-[720px] items-center px-6 pb-32 pt-20 lg:px-10 2xl:px-14">
            <div className="max-w-5xl">
              <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
                Ascendra tournament platform
              </p>

              <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
                Compete in organized tournaments.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-gray-300">
                Create teams, register for events, and track official results
                through one clean competitive platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
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
              title="Latest tournaments"
              description="Browse current events, check available approved slots, and open details before registering."
            />

            {tournaments.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-gray-300 shadow-2xl shadow-black/20">
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
            <SectionHeader
              label="Flow"
              title="Simple competition workflow"
              description="From creating a team to earning official tournament points."
            />

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              {playerJourney.map((step, index) => (
                <JourneyRow
                  key={step.title}
                  index={index + 1}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </section>
          </div>
        </section>

        <PlayerHubSection stats={playerHubStats} />

        <Footer />
      </div>
    </main>
  );
}

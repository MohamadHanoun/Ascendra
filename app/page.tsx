import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getDictionary, type HomeMessages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).home.metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

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

function getTournamentStatusLabel(
  status: string,
  messages: HomeMessages["statuses"],
) {
  const labels: Record<string, string> = {
    open: messages.tournamentOpen,
    upcoming: messages.upcoming,
    closed: messages.tournamentClosed,
    ended: messages.ended,
    cancelled: messages.cancelled,
  };

  return labels[status.toLowerCase()] || status;
}

function getRegistrationStatusLabel(
  status: string,
  messages: HomeMessages["statuses"],
) {
  const labels: Record<string, string> = {
    open: messages.registrationOpen,
    closed: messages.registrationClosed,
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

function formatApplications(
  applications: number,
  messages: HomeMessages["tournaments"],
  locale: Locale,
) {
  if (locale === "ar") {
    return `${applications} ${
      applications === 1
        ? messages.applicationSubmitted
        : messages.applicationsSubmitted
    }`;
  }

  return `${applications} ${
    applications === 1
      ? messages.applicationSubmitted
      : messages.applicationsSubmitted
  }`;
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalized = status.toLowerCase().replace("registration ", "");

  const style =
    normalized === "open" || normalized === "approved"
      ? { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" }
      : normalized === "upcoming" || normalized === "registered"
        ? { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" }
        : normalized === "closed" || normalized === "rejected"
          ? { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" }
          : normalized === "ended"
            ? { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" }
            : { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" };

  return (
    <span
      className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black"
      style={style}
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
      className="inline-flex justify-center px-6 py-3 text-sm font-black text-white transition"
      style={{ background: "var(--asc-accent-2)", boxShadow: "0 0 20px var(--asc-accent-glow)" }}
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
      className="inline-flex justify-center px-6 py-3 text-sm font-black transition"
      style={{ border: "1px solid var(--asc-line)", color: "var(--asc-fg-2)" }}
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
      <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
        {label}
      </p>
      <h2 className="mt-2 text-3xl md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
        {description}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4" style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)" }}>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function ProgressBar({
  approvedSlots,
  maxSlots,
  approvedLabel,
}: {
  approvedSlots: number;
  maxSlots: number;
  approvedLabel: string;
}) {
  const progress =
    maxSlots > 0 ? Math.min((approvedSlots / maxSlots) * 100, 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs font-bold text-gray-500">
        <span>
          {approvedSlots}/{maxSlots} {approvedLabel}
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="asc-progress-track">
        <div className="asc-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function TournamentMiniCard({
  tournament,
  locale,
  messages,
}: {
  tournament: {
    id: string;
    title: string;
    game: { name: string; slug: string } | null;
    startsAt: Date | null;
    imageUrl: string | null;
    maxTeams: number;
    teamSize: number;
    status: string;
    registrationStatus: string;
    registrations: {
      id: string;
      status: string;
    }[];
  };
  locale: Locale;
  messages: HomeMessages;
}) {
  const approvedSlots = tournament.registrations.filter(
    (registration) => registration.status === "approved",
  ).length;

  const applications = tournament.registrations.length;
  const imageSrc = getTournamentImageUrl(tournament.game?.slug ?? null, tournament.imageUrl);

  return (
    <article
      className="overflow-hidden border transition"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="h-44 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, oklch(0.06 0.03 287 / 0.10), oklch(0.06 0.03 287 / 0.88)), url("${imageSrc}")`,
        }}
      />

      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            status={tournament.status}
            label={getTournamentStatusLabel(tournament.status, messages.statuses)}
          />
          <StatusBadge
            status={tournament.registrationStatus}
            label={getRegistrationStatusLabel(tournament.registrationStatus, messages.statuses)}
          />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
            {tournament.game?.name ?? "—"}
          </p>
          <h3 className="mt-2 text-2xl" style={{ color: "var(--asc-fg-0)" }}>
            {tournament.title}
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {tournament.startsAt?.toLocaleDateString() ?? "—"} · {tournament.teamSize}v{tournament.teamSize}
          </p>
        </div>

        <ProgressBar
          approvedSlots={approvedSlots}
          maxSlots={tournament.maxTeams}
          approvedLabel={messages.tournaments.approved}
        />

        <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
          {formatApplications(applications, messages.tournaments, locale)}
        </p>

        <Link
          href={`/tournaments/${tournament.id}`}
          className="px-5 py-3 text-center text-sm font-black text-white transition"
          style={{ background: "var(--asc-accent-2)" }}
        >
          {messages.tournaments.viewDetails}
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
    <article
      className="grid gap-3 px-5 py-4 last:border-b-0 md:grid-cols-[80px_180px_minmax(0,1fr)] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <p className="text-sm font-black" style={{ color: "var(--asc-accent)" }}>
        {String(index).padStart(2, "0")}
      </p>
      <h3 className="font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h3>
      <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{description}</p>
    </article>
  );
}

function PlayerHubSection({
  stats,
  messages,
}: {
  stats: PlayerHubStats;
  messages: HomeMessages["playerHub"];
}) {
  return (
    <section className="relative py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <section
          className="overflow-hidden border p-6 shadow-2xl"
          style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--asc-accent)" }}>
                {messages.label}
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
                {stats.isLoggedIn ? messages.loggedInTitle : messages.guestTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
                {stats.isLoggedIn ? messages.loggedInDescription : messages.guestDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryLink href={stats.isLoggedIn ? "/profile" : "/login"}>
                  {stats.isLoggedIn ? messages.openProfile : messages.loginWithDiscord}
                </PrimaryLink>
                <SecondaryLink href="/tournaments">
                  {messages.viewTournaments}
                </SecondaryLink>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label={messages.stats.teams} value={stats.teamsCount} />
              <Stat label={messages.stats.invites} value={stats.pendingInvitesCount} />
              <Stat label={messages.stats.entries} value={stats.activeRegistrationsCount} />
              <Stat label={messages.stats.points} value={stats.tournamentPoints} />
              <Stat label={messages.stats.results} value={stats.tournamentResultsCount} />
              <Stat label={messages.stats.best} value={stats.bestPlacement ? `#${stats.bestPlacement}` : "-"} />
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
  const locale = await getLocale();
  const messages = getDictionary(locale).home;

  const [rawTournaments, playerHubStats] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        title: true,
        game: { select: { name: true, slug: true } },
        startsAt: true,
        imageUrl: true,
        maxTeams: true,
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
    <main className="asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="relative min-h-[720px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/images/backgrounds/home-hero.webp")' }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, oklch(0.06 0.03 287 / 0.90) 0%, oklch(0.06 0.03 287 / 0.50) 44%, oklch(0.06 0.03 287 / 0.72) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-56" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

          <div className="relative z-10 flex min-h-[720px] items-center px-6 pb-32 pt-20 lg:px-10 2xl:px-14">
            <div className="max-w-5xl">
              <p className="mb-5 text-sm font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>
                {messages.hero.label}
              </p>
              <h1 className="max-w-5xl text-5xl md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
                {messages.hero.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>
                {messages.hero.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href="/tournaments">{messages.hero.primary}</PrimaryLink>
                <SecondaryLink href="/profile">{messages.hero.secondary}</SecondaryLink>
              </div>
            </div>
          </div>
        </section>

        {/* Tournaments */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label={messages.tournaments.label}
              title={messages.tournaments.title}
              description={messages.tournaments.description}
            />

            {tournaments.length === 0 ? (
              <div className="border p-6" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-2)" }}>
                {messages.tournaments.empty}
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {tournaments.map((tournament) => (
                  <TournamentMiniCard
                    key={tournament.id}
                    tournament={tournament}
                    locale={locale}
                    messages={messages}
                  />
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <SecondaryLink href="/tournaments">{messages.tournaments.viewAll}</SecondaryLink>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label={messages.flow.label}
              title={messages.flow.title}
              description={messages.flow.description}
            />

            <section
              className="overflow-hidden border shadow-2xl"
              style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
            >
              {messages.flow.steps.map((step, index) => (
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

        <PlayerHubSection stats={playerHubStats} messages={messages.playerHub} />

        <Footer />
      </div>
    </main>
  );
}

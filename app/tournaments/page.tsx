import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileNotice from "@/components/ProfileNotice";
import { getDictionary, type TournamentsMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

type TournamentsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).tournaments.metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function getTournamentStatusLabel(
  status: string,
  messages: TournamentsMessages["statuses"],
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
  messages: TournamentsMessages["statuses"],
) {
  const labels: Record<string, string> = {
    open: messages.registrationOpen,
    closed: messages.registrationClosed,
  };

  return labels[status.toLowerCase()] || status;
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalizedStatus = status.toLowerCase().replace("registration ", "");

  const styleMap: Record<string, React.CSSProperties> = {
    open: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
    approved: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
    upcoming: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    pending: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    closed: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
    rejected: { color: "var(--asc-live)", borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)" },
    registered: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
    cancelled: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    ended: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
  };

  const style: React.CSSProperties = styleMap[normalizedStatus] ?? { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" };

  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={style}>
      {label || status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function DetailLine({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold" style={{ color: "var(--asc-fg-2)" }}>{children}</p>;
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
      <div className="flex items-center justify-between text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
        <span>{approvedSlots}/{maxSlots} {approvedLabel}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="asc-progress-track">
        <div className="asc-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function getTournamentCountLabel(
  count: number,
  labels: TournamentsMessages["labels"],
) {
  return `${count} ${
    count === 1 ? labels.tournamentSingular : labels.tournamentPlural
  }`;
}

function SectionTitle({
  title,
  count,
  labels,
}: {
  title: string;
  count: number;
  labels: TournamentsMessages["labels"];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl" style={{ color: "var(--asc-fg-0)" }}>{title}</h2>
      <span
        className="border px-3 py-1 text-xs font-black"
        style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
      >
        {getTournamentCountLabel(count, labels)}
      </span>
    </div>
  );
}

function TournamentArchive({
  title,
  count,
  labels,
  children,
}: {
  title: string;
  count: number;
  labels: TournamentsMessages["labels"];
  children: ReactNode;
}) {
  return (
    <details className="group grid gap-4">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 shadow-2xl transition"
        style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
      >
        <SectionTitle title={title} count={count} labels={labels} />
        <span
          className="grid h-10 w-10 shrink-0 place-items-center text-lg font-black transition group-open:rotate-45"
          style={{ border: "1px solid var(--asc-line-soft)", color: "var(--asc-fg-2)" }}
        >
          +
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default async function TournamentsPage({
  searchParams,
}: TournamentsPageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const messages = getDictionary(locale).tournaments;

  const tournaments = await prisma.tournament.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      game: { select: { name: true, slug: true } },
      startsAt: true,
      prize: true,
      imageUrl: true,
      maxTeams: true,
      teamSize: true,
      status: true,
      registrationStatus: true,
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
      results: {
        select: {
          id: true,
        },
      },
    },
  });

  const sortedTournaments = [...tournaments].sort((a, b) => {
    const priority: Record<string, number> = {
      open: 0,
      upcoming: 1,
      closed: 2,
      ended: 3,
      cancelled: 4,
    };

    const statusA = priority[a.status] ?? 10;
    const statusB = priority[b.status] ?? 10;

    if (statusA !== statusB) {
      return statusA - statusB;
    }

    return a.title.localeCompare(b.title);
  });

  const activeTournaments = sortedTournaments.filter(
    (tournament) => !["ended", "cancelled"].includes(tournament.status),
  );

  const archivedTournaments = sortedTournaments.filter((tournament) =>
    ["ended", "cancelled"].includes(tournament.status),
  );

  const openTournamentCount = tournaments.filter(
    (tournament) => tournament.status === "open",
  ).length;

  const openRegistrationCount = tournaments.filter(
    (tournament) =>
      tournament.registrationStatus === "open" &&
      !["ended", "cancelled"].includes(tournament.status),
  ).length;

  const approvedSlotsCount = tournaments.reduce(
    (total, tournament) =>
      total +
      tournament.registrations.filter(
        (registration) => registration.status === "approved",
      ).length,
    0,
  );

  const applicationsCount = tournaments.reduce(
    (total, tournament) => total + tournament.registrations.length,
    0,
  );

  function renderTournamentList(
    list: typeof sortedTournaments,
    emptyTitle: string,
  ) {
    if (list.length === 0) {
      return (
        <div className="border p-6" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)", color: "var(--asc-fg-2)" }}>
          {emptyTitle}
        </div>
      );
    }

    return (
      <div className="overflow-hidden border shadow-2xl" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div style={{ borderColor: "var(--asc-line-soft)" }}>
          {list.map((tournament) => {
            const approvedSlots = tournament.registrations.filter(
              (registration) => registration.status === "approved",
            ).length;

            const applications = tournament.registrations.length;
            const remainingSlots = Math.max(tournament.maxTeams - approvedSlots, 0);
            const tournamentImage = getTournamentImageUrl(tournament.game?.slug ?? null, tournament.imageUrl);
            const shouldShowRegistrationStatus = !["ended", "cancelled"].includes(tournament.status);

            return (
              <article
                key={tournament.id}
                className="grid gap-5 p-5 transition lg:grid-cols-[160px_minmax(0,1fr)_230px_130px] lg:items-center"
                style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
              >
                <div
                  className="h-28 border bg-cover bg-center lg:h-24"
                  style={{
                    borderColor: "var(--asc-line-soft)",
                    backgroundImage: `linear-gradient(to bottom, oklch(0.06 0.03 287 / 0.05), oklch(0.06 0.03 287 / 0.70)), url("${tournamentImage}")`,
                  }}
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-2xl" style={{ color: "var(--asc-fg-0)" }}>
                      {tournament.title}
                    </h3>
                    <StatusBadge
                      status={tournament.status}
                      label={getTournamentStatusLabel(tournament.status, messages.statuses)}
                    />
                    {shouldShowRegistrationStatus && (
                      <StatusBadge
                        status={tournament.registrationStatus}
                        label={getRegistrationStatusLabel(tournament.registrationStatus, messages.statuses)}
                      />
                    )}
                  </div>

                  <div className="mt-3 grid gap-1">
                    <DetailLine>
                      {tournament.game?.name ?? "—"}
                      {tournament.startsAt ? ` · ${tournament.startsAt.toLocaleDateString()}` : ""}
                    </DetailLine>
                    <DetailLine>
                      {messages.labels.prize}:{" "}
                      <span style={{ color: "var(--asc-prize)" }}>{tournament.prize ?? "—"}</span>
                      {" · "}{messages.labels.team}: {tournament.teamSize}v{tournament.teamSize}
                    </DetailLine>
                  </div>
                </div>

                <div className="grid gap-3">
                  <ProgressBar
                    approvedSlots={approvedSlots}
                    maxSlots={tournament.maxTeams}
                    approvedLabel={messages.labels.approved}
                  />
                  <p className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
                    {remainingSlots}{" "}
                    {remainingSlots === 1 ? messages.labels.slotLeft : messages.labels.slotsLeft}{" "}
                    · {applications}{" "}
                    {applications === 1 ? messages.labels.application : messages.labels.applications}
                  </p>
                  {tournament.results.length > 0 && (
                    <p className="text-xs font-black" style={{ color: "var(--asc-green)" }}>
                      {tournament.results.length}{" "}
                      {tournament.results.length === 1 ? messages.labels.resultSaved : messages.labels.resultsSaved}
                    </p>
                  )}
                </div>

                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="inline-flex justify-center px-5 py-3 text-sm font-black text-white transition"
                  style={{ background: "var(--asc-accent-2)" }}
                >
                  {messages.labels.details}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main className="asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="relative min-h-[400px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/images/backgrounds/tournaments-hero.webp")' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.60) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.40) 35%, transparent 70%)",
              ].join(", "),
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-accent)" }}>
              ▲ OPEN REGISTRATION · SEASON 7
            </p>
            <h1 className="max-w-4xl text-5xl md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
              {messages.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>
              {messages.hero.description}
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <ProfileNotice message={params.message} error={params.error} />

          {/* Stats bar */}
          <section
            className="grid gap-5 border p-5 shadow-2xl md:grid-cols-2 xl:grid-cols-4"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <Stat label={messages.stats.tournaments} value={tournaments.length} />
            <Stat label={messages.stats.open} value={openTournamentCount} />
            <Stat label={messages.stats.applications} value={applicationsCount} />
            <Stat label={messages.stats.approved} value={approvedSlotsCount} />
          </section>

          {tournaments.length === 0 ? (
            <EmptyState
              title={messages.empty.noTournamentsTitle}
              description={messages.empty.noTournamentsDescription}
            />
          ) : (
            <>
              <section className="grid gap-4">
                <SectionTitle
                  title={messages.sections.active}
                  count={activeTournaments.length}
                  labels={messages.labels}
                />
                {renderTournamentList(activeTournaments, messages.empty.noActive)}
              </section>

              {archivedTournaments.length > 0 && (
                <TournamentArchive
                  title={messages.sections.archive}
                  count={archivedTournaments.length}
                  labels={messages.labels}
                >
                  {renderTournamentList(archivedTournaments, messages.empty.noArchived)}
                </TournamentArchive>
              )}
            </>
          )}

          {openRegistrationCount > 0 && (
            <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {openRegistrationCount}{" "}
              {openRegistrationCount === 1 ? messages.labels.currentlyAccept : messages.labels.currentlyAcceptPlural}
            </p>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}

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

  const styles: Record<string, string> = {
    open: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    approved: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    upcoming: "border-sky-400/25 bg-sky-500/10 text-sky-300",
    pending: "border-sky-400/25 bg-sky-500/10 text-sky-300",
    closed: "border-red-400/25 bg-red-500/10 text-red-300",
    rejected: "border-red-400/25 bg-red-500/10 text-red-300",
    registered: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    cancelled: "border-white/10 bg-white/5 text-gray-300",
    ended: "border-blue-400/25 bg-blue-500/10 text-blue-300",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
        styles[normalizedStatus] || "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {label || status}
    </span>
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

function DetailLine({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold text-gray-300">{children}</p>;
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

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
          style={{
            width: `${progress}%`,
          }}
        />
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
      <h2 className="text-2xl font-black text-white">{title}</h2>

      <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-gray-400">
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
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 shadow-2xl shadow-black/20 transition hover:bg-white/[0.06]">
        <SectionTitle title={title} count={count} labels={labels} />

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/25 text-lg font-black text-gray-300 transition group-open:rotate-45 group-hover:border-violet-400/30 group-hover:text-white">
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
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-gray-300">
          {emptyTitle}
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
        <div className="divide-y divide-white/10">
          {list.map((tournament) => {
            const approvedSlots = tournament.registrations.filter(
              (registration) => registration.status === "approved",
            ).length;

            const applications = tournament.registrations.length;
            const remainingSlots = Math.max(
              tournament.maxTeams - approvedSlots,
              0,
            );

            const tournamentImage = getTournamentImageUrl(
              tournament.game?.slug ?? null,
              tournament.imageUrl,
            );

            const shouldShowRegistrationStatus = ![
              "ended",
              "cancelled",
            ].includes(tournament.status);

            return (
              <article
                key={tournament.id}
                className="grid gap-5 p-5 transition hover:bg-white/[0.035] lg:grid-cols-[160px_minmax(0,1fr)_230px_130px] lg:items-center"
              >
                <div
                  className="h-28 rounded-2xl border border-white/10 bg-cover bg-center lg:h-24"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(7,8,17,0.05), rgba(7,8,17,0.65)), url("${tournamentImage}")`,
                  }}
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-2xl font-black text-white">
                      {tournament.title}
                    </h3>

                    <StatusBadge
                      status={tournament.status}
                      label={getTournamentStatusLabel(
                        tournament.status,
                        messages.statuses,
                      )}
                    />

                    {shouldShowRegistrationStatus && (
                      <StatusBadge
                        status={tournament.registrationStatus}
                        label={getRegistrationStatusLabel(
                          tournament.registrationStatus,
                          messages.statuses,
                        )}
                      />
                    )}
                  </div>

                  <div className="mt-3 grid gap-1">
                    <DetailLine>
                      {tournament.game?.name ?? "—"}
                      {tournament.startsAt
                        ? ` · ${tournament.startsAt.toLocaleDateString()}`
                        : ""}
                    </DetailLine>

                    <DetailLine>
                      {messages.labels.prize}: {tournament.prize ?? "—"} ·{" "}
                      {messages.labels.team}: {tournament.teamSize}v
                      {tournament.teamSize}
                    </DetailLine>
                  </div>
                </div>

                <div className="grid gap-3">
                  <ProgressBar
                    approvedSlots={approvedSlots}
                    maxSlots={tournament.maxTeams}
                    approvedLabel={messages.labels.approved}
                  />

                  <p className="text-xs font-bold text-gray-500">
                    {remainingSlots}{" "}
                    {remainingSlots === 1
                      ? messages.labels.slotLeft
                      : messages.labels.slotsLeft}{" "}
                    · {applications}{" "}
                    {applications === 1
                      ? messages.labels.application
                      : messages.labels.applications}
                  </p>

                  {tournament.results.length > 0 && (
                    <p className="text-xs font-black text-emerald-300">
                      {tournament.results.length}{" "}
                      {tournament.results.length === 1
                        ? messages.labels.resultSaved
                        : messages.labels.resultsSaved}
                    </p>
                  )}
                </div>

                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="inline-flex justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
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
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("/images/backgrounds/tournaments-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.88)_0%,rgba(7,8,17,0.58)_44%,rgba(7,8,17,0.74)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.20),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              {messages.hero.label}
            </p>

            <h1 className="max-w-4xl text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
              {messages.hero.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              {messages.hero.description}
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <ProfileNotice message={params.message} error={params.error} />

          <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 md:grid-cols-2 xl:grid-cols-4">
            <Stat
              label={messages.stats.tournaments}
              value={tournaments.length}
            />
            <Stat label={messages.stats.open} value={openTournamentCount} />
            <Stat
              label={messages.stats.applications}
              value={applicationsCount}
            />
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

                {renderTournamentList(
                  activeTournaments,
                  messages.empty.noActive,
                )}
              </section>

              {archivedTournaments.length > 0 && (
                <TournamentArchive
                  title={messages.sections.archive}
                  count={archivedTournaments.length}
                  labels={messages.labels}
                >
                  {renderTournamentList(
                    archivedTournaments,
                    messages.empty.noArchived,
                  )}
                </TournamentArchive>
              )}
            </>
          )}

          {openRegistrationCount > 0 && (
            <p className="text-sm text-gray-500">
              {openRegistrationCount}{" "}
              {openRegistrationCount === 1
                ? messages.labels.currentlyAccept
                : messages.labels.currentlyAcceptPlural}
            </p>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}

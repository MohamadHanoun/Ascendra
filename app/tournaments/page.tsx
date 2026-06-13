import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SectionReveal from "@/components/SectionReveal";
import CommandRail from "@/components/public/CommandRail";
import TournamentsRealtimeRefresh from "@/components/TournamentsRealtimeRefresh";
import TournamentsListRealtime from "@/components/TournamentsListRealtime";
import ProfileNotice from "@/components/ProfileNotice";
import {
  getDictionary,
  type Locale,
  type TournamentsMessages,
} from "@/lib/i18n";
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

type TournamentListItem = {
  id: string;
  title: string;
  game: {
    name: string;
    slug: string;
  } | null;
  startsAt: Date | null;
  prize: string | null;
  imageUrl: string | null;
  maxTeams: number;
  teamSize: number;
  status: string;
  registrationStatus: string;
  registrations: {
    id: string;
    status: string;
  }[];
  results: {
    id: string;
  }[];
};

const pageCopy: Record<
  Locale,
  {
    heroEyebrow: string;
    featuredEyebrow: string;
    featuredTitle: string;
    directoryEyebrow: string;
    directoryTitle: string;
    activeEvents: string;
    archivedEvents: string;
    event: string;
    game: string;
    format: string;
    teams: string;
    prize: string;
    starts: string;
    status: string;
    openEvent: string;
    noFeatured: string;
    totalEvents: string;
    activeEventsStat: string;
    openRegistration: string;
    approvedTeams: string;
    applicationsStat: string;
  }
> = {
  en: {
    heroEyebrow: "Competitive events",
    featuredEyebrow: "Featured",
    featuredTitle: "Marquee event",
    directoryEyebrow: "All events",
    directoryTitle: "Tournament directory",
    activeEvents: "Active events",
    archivedEvents: "Archived events",
    event: "Event",
    game: "Game",
    format: "Format",
    teams: "Teams",
    prize: "Prize",
    starts: "Starts",
    status: "Status",
    openEvent: "Open event",
    noFeatured: "No featured tournament is available right now.",
    totalEvents: "Total events",
    activeEventsStat: "Active events",
    openRegistration: "Registration open",
    approvedTeams: "Approved teams",
    applicationsStat: "Applications",
  },
  ar: {
    heroEyebrow: "الأحداث التنافسية",
    featuredEyebrow: "مميز",
    featuredTitle: "البطولة الأبرز",
    directoryEyebrow: "كل البطولات",
    directoryTitle: "دليل البطولات",
    activeEvents: "البطولات النشطة",
    archivedEvents: "البطولات المؤرشفة",
    event: "البطولة",
    game: "اللعبة",
    format: "النظام",
    teams: "الفرق",
    prize: "الجائزة",
    starts: "البداية",
    status: "الحالة",
    openEvent: "فتح البطولة",
    noFeatured: "لا توجد بطولة مميزة حاليًا.",
    totalEvents: "إجمالي البطولات",
    activeEventsStat: "البطولات النشطة",
    openRegistration: "التسجيل المفتوح",
    approvedTeams: "الفرق المقبولة",
    applicationsStat: "الطلبات",
  },
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

function getTournamentCountLabel(
  count: number,
  labels: TournamentsMessages["labels"],
) {
  return `${count} ${
    count === 1 ? labels.tournamentSingular : labels.tournamentPlural
  }`;
}

function getApprovedSlots(tournament: TournamentListItem) {
  return tournament.registrations.filter(
    (registration) => registration.status === "approved",
  ).length;
}

function getSubmittedApplications(tournament: TournamentListItem) {
  return tournament.registrations.length;
}

function formatTournamentDate(date: Date | null, locale: Locale) {
  if (!date) {
    return "—";
  }

  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortTournamentDate(date: Date | null, locale: Locale) {
  if (!date) {
    return "—";
  }

  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalizedStatus = status.toLowerCase().replace("registration ", "");

  const styleMap: Record<string, CSSProperties> = {
    open: {
      color: "var(--asc-green)",
      borderColor: "var(--asc-green-border)",
      background: "var(--asc-green-bg)",
    },
    approved: {
      color: "var(--asc-green)",
      borderColor: "var(--asc-green-border)",
      background: "var(--asc-green-bg)",
    },
    upcoming: {
      color: "var(--asc-blue)",
      borderColor: "var(--asc-blue-border)",
      background: "var(--asc-blue-bg)",
    },
    pending: {
      color: "var(--asc-blue)",
      borderColor: "var(--asc-blue-border)",
      background: "var(--asc-blue-bg)",
    },
    closed: {
      color: "var(--asc-live)",
      borderColor: "var(--asc-live-border)",
      background: "var(--asc-live-bg)",
    },
    rejected: {
      color: "var(--asc-live)",
      borderColor: "var(--asc-live-border)",
      background: "var(--asc-live-bg)",
    },
    registered: {
      color: "var(--asc-accent)",
      borderColor: "var(--asc-accent-border)",
      background: "var(--asc-accent-dim)",
    },
    cancelled: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
    ended: {
      color: "var(--asc-blue)",
      borderColor: "var(--asc-blue-border)",
      background: "var(--asc-blue-bg)",
    },
  };

  const style: CSSProperties = styleMap[normalizedStatus] ?? {
    color: "var(--asc-fg-3)",
    borderColor: "var(--asc-line-soft)",
    background: "transparent",
  };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
      style={style}
    >
      {label || status}
    </span>
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
      <div
        className="flex items-center justify-between gap-4 text-xs font-bold"
        style={{ color: "var(--asc-fg-3)" }}
      >
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

function SectionHeader({
  eyebrow,
  title,
  count,
  children,
}: {
  eyebrow: string;
  title: string;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p
          className="asc-section-label"
        >
          ▲ {eyebrow}
          {typeof count === "number" ? ` · ${count}` : ""}
        </p>

        <h2
          className="mt-2 text-3xl md:text-4xl"
          style={{ color: "var(--asc-fg-0)" }}
        >
          {title}
        </h2>
      </div>

      {children}
    </div>
  );
}

function FeaturedTournament({
  tournament,
  locale,
  messages,
  copy,
}: {
  tournament: TournamentListItem | null;
  locale: Locale;
  messages: TournamentsMessages;
  copy: (typeof pageCopy)[Locale];
}) {
  if (!tournament) {
    return (
      <div
        className="relative border p-8"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-1)",
          color: "var(--asc-fg-2)",
          clipPath:
            "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
        }}
      >
        {copy.noFeatured}
      </div>
    );
  }

  const approvedSlots = getApprovedSlots(tournament);
  const tournamentImage = getTournamentImageUrl(
    tournament.game?.slug ?? null,
    tournament.imageUrl,
  );

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="asc-image-card group relative block min-h-[260px] overflow-hidden border transition hover:opacity-95"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
        style={{
          backgroundImage: `url("${tournamentImage}")`,
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgb(var(--asc-scrim-rgb) / 0.98) 0%, rgb(var(--asc-scrim-rgb) / 0.72) 48%, rgb(var(--asc-scrim-rgb) / 0.18) 100%)",
        }}
      />

      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="relative z-10 grid min-h-[260px] gap-8 p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={tournament.status}
              label={getTournamentStatusLabel(
                tournament.status,
                messages.statuses,
              )}
            />
            <StatusBadge
              status={tournament.registrationStatus}
              label={getRegistrationStatusLabel(
                tournament.registrationStatus,
                messages.statuses,
              )}
            />
            {tournament.game && (
              <span
                className="border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                style={{
                  color: "var(--asc-accent)",
                  borderColor: "var(--asc-accent-border)",
                  background: "var(--asc-accent-dim)",
                }}
              >
                {tournament.game.name}
              </span>
            )}
          </div>

          <h3
            className="mt-5 max-w-3xl text-4xl md:text-5xl"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {tournament.title}
          </h3>

          <p
            className="mt-3 max-w-xl text-sm leading-6"
            style={{ color: "var(--asc-fg-2)" }}
          >
            {tournament.game?.name ?? "—"} · {tournament.teamSize}v
            {tournament.teamSize} ·{" "}
            {formatTournamentDate(tournament.startsAt, locale)}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span
              className="inline-flex items-center justify-center px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white"
              style={{
                background: "var(--asc-accent-2)",
                clipPath:
                  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              }}
            >
              {copy.openEvent} ›
            </span>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                {copy.prize}
              </p>
              <p
                className="mt-1 text-2xl font-black"
                style={{
                  color: "var(--asc-prize)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {tournament.prize ?? "—"}
              </p>
            </div>

            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                {copy.teams}
              </p>
              <p
                className="mt-1 text-2xl font-black"
                style={{
                  color: "var(--asc-fg-0)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {approvedSlots}
                <span
                  className="text-base"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  /{tournament.maxTeams}
                </span>
              </p>
            </div>

            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.16em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                {copy.starts}
              </p>
              <p
                className="mt-1 text-2xl font-black"
                style={{
                  color: "var(--asc-fg-0)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {formatShortTournamentDate(tournament.startsAt, locale)}
              </p>
            </div>
          </div>

          <ProgressBar
            approvedSlots={approvedSlots}
            maxSlots={tournament.maxTeams}
            approvedLabel={messages.labels.approved}
          />
        </div>
      </div>
    </Link>
  );
}

function TournamentDesktopRow({
  tournament,
  locale,
  messages,
  copy,
}: {
  tournament: TournamentListItem;
  locale: Locale;
  messages: TournamentsMessages;
  copy: (typeof pageCopy)[Locale];
}) {
  const approvedSlots = getApprovedSlots(tournament);
  const applications = getSubmittedApplications(tournament);
  const tournamentImage = getTournamentImageUrl(
    tournament.game?.slug ?? null,
    tournament.imageUrl,
  );

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group hidden grid-cols-[2fr_1fr_0.8fr_0.8fr_0.9fr_0.9fr_1fr_0.4fr] items-center gap-4 px-5 py-4 transition hover:bg-[var(--asc-hover-soft)] lg:grid"
      style={{ borderTop: "1px solid var(--asc-line-soft)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="h-12 w-12 shrink-0 border bg-cover bg-center"
          style={{
            borderColor: "var(--asc-line-soft)",
            backgroundImage: `linear-gradient(to bottom, rgb(var(--asc-scrim-rgb) / 0.05), rgb(var(--asc-scrim-rgb) / 0.55)), url("${tournamentImage}")`,
            clipPath:
              "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
          }}
        />

        <div className="min-w-0">
          <p
            className="truncate text-sm font-black"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {tournament.title}
          </p>
          <p
            className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {applications}{" "}
            {applications === 1
              ? messages.labels.application
              : messages.labels.applications}
          </p>
        </div>
      </div>

      <span
        className="truncate text-xs font-bold"
        style={{ color: "var(--asc-fg-1)" }}
      >
        {tournament.game?.name ?? "—"}
      </span>

      <span
        className="text-xs font-bold tabular-nums"
        style={{ color: "var(--asc-fg-2)" }}
      >
        {tournament.teamSize}v{tournament.teamSize}
      </span>

      <span
        className="text-sm font-black tabular-nums"
        style={{ color: "var(--asc-fg-0)", fontFamily: "var(--font-display)" }}
      >
        {approvedSlots}
        <span style={{ color: "var(--asc-fg-3)" }}>/{tournament.maxTeams}</span>
      </span>

      <span
        className="text-sm font-black"
        style={{ color: "var(--asc-prize)", fontFamily: "var(--font-display)" }}
      >
        {tournament.prize ?? "—"}
      </span>

      <span className="text-xs font-bold" style={{ color: "var(--asc-fg-2)" }}>
        {formatShortTournamentDate(tournament.startsAt, locale)}
      </span>

      <span className="flex flex-wrap gap-2">
        <StatusBadge
          status={tournament.status}
          label={getTournamentStatusLabel(tournament.status, messages.statuses)}
        />
      </span>

      <span
        className="text-right text-lg transition group-hover:translate-x-1"
        style={{ color: "var(--asc-fg-3)" }}
      >
        ›
      </span>
    </Link>
  );
}

function TournamentMobileCard({
  tournament,
  locale,
  messages,
  copy,
}: {
  tournament: TournamentListItem;
  locale: Locale;
  messages: TournamentsMessages;
  copy: (typeof pageCopy)[Locale];
}) {
  const approvedSlots = getApprovedSlots(tournament);
  const applications = getSubmittedApplications(tournament);
  const tournamentImage = getTournamentImageUrl(
    tournament.game?.slug ?? null,
    tournament.imageUrl,
  );

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="asc-pub-panel block lg:hidden"
    >
      <div
        className="h-40 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgb(var(--asc-scrim-rgb) / 0.08), rgb(var(--asc-scrim-rgb) / 0.86)), url("${tournamentImage}")`,
        }}
      />

      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            status={tournament.status}
            label={getTournamentStatusLabel(
              tournament.status,
              messages.statuses,
            )}
          />
          <StatusBadge
            status={tournament.registrationStatus}
            label={getRegistrationStatusLabel(
              tournament.registrationStatus,
              messages.statuses,
            )}
          />
        </div>

        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--asc-accent)" }}
          >
            {tournament.game?.name ?? "—"}
          </p>

          <h3 className="mt-2 text-2xl" style={{ color: "var(--asc-fg-0)" }}>
            {tournament.title}
          </h3>

          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {formatTournamentDate(tournament.startsAt, locale)} ·{" "}
            {tournament.teamSize}v{tournament.teamSize}
          </p>
        </div>

        <ProgressBar
          approvedSlots={approvedSlots}
          maxSlots={tournament.maxTeams}
          approvedLabel={messages.labels.approved}
        />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {copy.prize}
            </p>
            <p
              className="mt-1 text-sm font-black"
              style={{ color: "var(--asc-prize)" }}
            >
              {tournament.prize ?? "—"}
            </p>
          </div>

          <div>
            <p
              className="text-[9px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {copy.teams}
            </p>
            <p
              className="mt-1 text-sm font-black"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {approvedSlots}/{tournament.maxTeams}
            </p>
          </div>

          <div>
            <p
              className="text-[9px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {copy.applicationsStat}
            </p>
            <p
              className="mt-1 text-sm font-black"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {applications}
            </p>
          </div>
        </div>

        <span
          className="inline-flex justify-center px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white"
          style={{
            background: "var(--asc-accent-2)",
            clipPath:
              "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
          }}
        >
          {copy.openEvent} ›
        </span>
      </div>
    </Link>
  );
}

function TournamentDirectory({
  title,
  eyebrow,
  tournaments,
  locale,
  messages,
  copy,
  emptyTitle,
}: {
  title: string;
  eyebrow: string;
  tournaments: TournamentListItem[];
  locale: Locale;
  messages: TournamentsMessages;
  copy: (typeof pageCopy)[Locale];
  emptyTitle: string;
}) {
  return (
    <section>
      <SectionHeader eyebrow={eyebrow} title={title} count={tournaments.length}>
        <span className="asc-info-pill">
          {getTournamentCountLabel(tournaments.length, messages.labels)}
        </span>
      </SectionHeader>

      {tournaments.length === 0 ? (
        <div
          className="border p-6"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-1)",
            color: "var(--asc-fg-2)",
          }}
        >
          {emptyTitle}
        </div>
      ) : (
        <>
          <div
            className="asc-pub-surface hidden lg:block"
          >
            <div
              className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_0.9fr_0.9fr_1fr_0.4fr] gap-4 px-5 py-3"
              style={{
                borderBottom: "1px solid var(--asc-line-soft)",
                background: "var(--asc-table-head-bg)",
              }}
            >
              {[
                copy.event,
                copy.game,
                copy.format,
                copy.teams,
                copy.prize,
                copy.starts,
                copy.status,
                "",
              ].map((heading, index) => (
                <span
                  key={`${heading}-${index}`}
                  className="text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{
                    color: "var(--asc-fg-3)",
                    textAlign: index === 7 ? "right" : "left",
                  }}
                >
                  {heading}
                </span>
              ))}
            </div>

            {tournaments.map((tournament) => (
              <TournamentDesktopRow
                key={tournament.id}
                tournament={tournament}
                locale={locale}
                messages={messages}
                copy={copy}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:hidden">
            {tournaments.map((tournament) => (
              <TournamentMobileCard
                key={tournament.id}
                tournament={tournament}
                locale={locale}
                messages={messages}
                copy={copy}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default async function TournamentsPage({
  searchParams,
}: TournamentsPageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const messages = getDictionary(locale).tournaments;
  const copy = pageCopy[locale];

  const tournaments: TournamentListItem[] = await prisma.tournament.findMany({
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
    const statusA = getTournamentSortPriority(a.status);
    const statusB = getTournamentSortPriority(b.status);

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

  const featuredTournament =
    activeTournaments.find(
      (tournament) =>
        tournament.status === "open" ||
        tournament.registrationStatus === "open",
    ) ??
    activeTournaments[0] ??
    null;

  const openTournamentCount = tournaments.filter(
    (tournament) => tournament.status === "open",
  ).length;

  const openRegistrationCount = tournaments.filter(
    (tournament) =>
      tournament.registrationStatus === "open" &&
      !["ended", "cancelled"].includes(tournament.status),
  ).length;

  const approvedSlotsCount = tournaments.reduce(
    (total, tournament) => total + getApprovedSlots(tournament),
    0,
  );

  const applicationsCount = tournaments.reduce(
    (total, tournament) => total + getSubmittedApplications(tournament),
    0,
  );

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="asc-image-hero relative min-h-[360px] overflow-hidden">
          <div
            className="asc-hero-media absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("/images/backgrounds/tournaments-hero.webp")',
            }}
          />

          <div
            className="asc-hero-overlay absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(var(--asc-scrim-rgb) / 0.36) 0%, rgb(var(--asc-scrim-rgb) / 0.70) 58%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(var(--asc-scrim-rgb) / 0.46) 38%, transparent 72%)",
              ].join(", "),
            }}
          />

          <div className="asc-image-hero-content relative z-10 mx-auto max-w-[1680px] px-6 pb-24 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4">
              <span className="asc-cmd-eyebrow">
                <span aria-hidden="true" className="asc-cmd-eyebrow__dot" />
                {copy.heroEyebrow} · {activeTournaments.length}{" "}
                {copy.activeEvents.toUpperCase()}
              </span>
            </p>

            <h1
              className="max-w-4xl text-5xl md:text-7xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {messages.hero.title}
            </h1>

            <p
              className="mt-5 max-w-2xl text-base leading-7"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {messages.hero.description}
            </p>
          </div>
        </section>

        <section className="asc-pub-shell relative -mt-12 mx-auto grid max-w-[1680px] gap-10 px-6 pb-16 lg:px-10 2xl:px-14">
          <ProfileNotice message={params.message} error={params.error} />

          {/* Command rail */}
          <SectionReveal>
            <CommandRail
              columns={4}
              items={[
                { label: copy.totalEvents, value: tournaments.length },
                { label: copy.activeEventsStat, value: openTournamentCount },
                {
                  label: copy.openRegistration,
                  value: openRegistrationCount,
                  accent: true,
                },
                { label: copy.approvedTeams, value: approvedSlotsCount },
              ]}
            />
          </SectionReveal>

          {/* Featured */}
          <SectionReveal delay={0.06}>
            <section>
              <SectionHeader
                eyebrow={copy.featuredEyebrow}
                title={copy.featuredTitle}
              />

              <FeaturedTournament
                tournament={featuredTournament}
                locale={locale}
                messages={messages}
                copy={copy}
              />
            </section>
          </SectionReveal>

          {tournaments.length === 0 ? (
            <EmptyState
              title={messages.empty.noTournamentsTitle}
              description={messages.empty.noTournamentsDescription}
            />
          ) : (
            <>
              <SectionReveal delay={0.1}>
                <TournamentDirectory
                  title={copy.directoryTitle}
                  eyebrow={copy.directoryEyebrow}
                  tournaments={activeTournaments}
                  locale={locale}
                  messages={messages}
                  copy={copy}
                  emptyTitle={messages.empty.noActive}
                />
              </SectionReveal>

              {archivedTournaments.length > 0 && (
                <details className="group">
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-4 border px-5 py-4 transition"
                    style={{
                      borderColor: "var(--asc-line-soft)",
                      background: "var(--asc-bg-1)",
                    }}
                  >
                    <div>
                      <p
                        className="asc-section-label"
                      >
                        ▲ {copy.archivedEvents}
                      </p>
                      <h2
                        className="mt-1 text-2xl"
                        style={{ color: "var(--asc-fg-0)" }}
                      >
                        {messages.sections.archive}
                      </h2>
                    </div>

                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center text-lg font-black transition group-open:rotate-45"
                      style={{
                        border: "1px solid var(--asc-line-soft)",
                        color: "var(--asc-fg-2)",
                      }}
                    >
                      +
                    </span>
                  </summary>

                  <div className="mt-6">
                    <TournamentDirectory
                      title={messages.sections.archive}
                      eyebrow={copy.archivedEvents}
                      tournaments={archivedTournaments}
                      locale={locale}
                      messages={messages}
                      copy={copy}
                      emptyTitle={messages.empty.noArchived}
                    />
                  </div>
                </details>
              )}
            </>
          )}

          {openRegistrationCount > 0 && (
            <p className="text-sm" style={{ color: "var(--asc-fg-3)" }}>
              {openRegistrationCount}{" "}
              {openRegistrationCount === 1
                ? messages.labels.currentlyAccept
                : messages.labels.currentlyAcceptPlural}
            </p>
          )}

          {applicationsCount > 0 && (
            <p
              className="text-xs font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {applicationsCount} {copy.applicationsStat}
            </p>
          )}
        </section>

        <Footer />
      </div>
      <TournamentsRealtimeRefresh />
      <TournamentsListRealtime />
    </main>
  );
}

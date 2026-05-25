import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

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

type LiveMatchData = {
  id: string;
  round: number;
  matchNumber: number;
  status: string;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  teamA: { id: string; name: string } | null;
  teamB: { id: string; name: string } | null;
  tournament: { id: string; title: string };
};

type GameData = {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  defaultTeamSize: number;
  _count: { tournaments: number; teams: number };
};

type TopPlayer = {
  username: string;
  userId: string;
  points: number;
  placement: number | null;
};

type AnnouncementData = {
  id: string;
  title: string;
  category: string;
  description: string;
  createdAt: Date;
};

type LadderPreviewPlayer = {
  id: string;
  rank: number;
  name: string;
  initials: string;
  meta: string;
  score: number;
  scoreLabel: string;
  accent: string;
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

function formatCompact(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return String(value);
}

function getCountdownParts(startsAt: Date | null) {
  if (!startsAt) {
    return {
      days: "21",
      hours: "00",
      minutes: "00",
    };
  }

  const diff = Math.max(0, startsAt.getTime() - Date.now());
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
  };
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normalized = status.toLowerCase().replace("registration ", "");

  const style =
    normalized === "open" || normalized === "approved"
      ? {
          color: "var(--asc-green)",
          borderColor: "oklch(0.55 0.14 150 / 0.5)",
          background: "oklch(0.25 0.12 150 / 0.18)",
        }
      : normalized === "upcoming" || normalized === "registered"
        ? {
            color: "var(--asc-blue)",
            borderColor: "oklch(0.55 0.12 220 / 0.5)",
            background: "oklch(0.25 0.10 220 / 0.18)",
          }
        : normalized === "closed" || normalized === "rejected"
          ? {
              color: "var(--asc-live)",
              borderColor: "oklch(0.50 0.20 25 / 0.5)",
              background: "oklch(0.25 0.18 25 / 0.18)",
            }
          : normalized === "ended"
            ? {
                color: "var(--asc-blue)",
                borderColor: "oklch(0.55 0.12 220 / 0.5)",
                background: "oklch(0.25 0.10 220 / 0.18)",
              }
            : {
                color: "var(--asc-fg-3)",
                borderColor: "var(--asc-line-soft)",
                background: "transparent",
              };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black uppercase tracking-[0.08em]"
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
      className="inline-flex items-center justify-center px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:opacity-90"
      style={{
        background: "var(--asc-accent-2)",
        boxShadow: "0 0 20px var(--asc-accent-glow)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      {children}
      <span className="ml-2">›</span>
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
      className="inline-flex items-center justify-center border px-6 py-3 text-sm font-black uppercase tracking-[0.08em] transition hover:opacity-80"
      style={{
        borderColor: "var(--asc-line)",
        color: "var(--asc-fg-2)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      {children}
    </Link>
  );
}

function SectionHeader({
  label,
  title,
  count,
  children,
}: {
  label: string;
  title: string;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p
          className="text-xs font-black uppercase tracking-[0.18em]"
          style={{ color: "var(--asc-accent)" }}
        >
          ▲ {label}
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
        className="flex items-center justify-between text-xs font-bold"
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

function FeaturedEventCard({
  featuredTournament,
  approvedSlots,
  countdown,
}: {
  featuredTournament: {
    id: string;
    title: string;
    game: { name: string; slug: string } | null;
    startsAt: Date | null;
    prize: string | null;
    maxTeams: number;
    registrations: { id: string; status: string }[];
  } | null;
  approvedSlots: number;
  countdown: { days: string; hours: string; minutes: string };
}) {
  return (
    <div
      className="relative border p-6 shadow-2xl backdrop-blur"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "oklch(0.09 0.035 287 / 0.86)",
        clipPath:
          "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="flex items-center gap-2">
        <span className="asc-live-dot" />
        <span
          className="text-xs font-black uppercase tracking-[0.14em]"
          style={{ color: "var(--asc-accent)" }}
        >
          Featured · Season 7
        </span>
      </div>

      <h2
        className="mt-4 text-2xl font-black uppercase leading-tight md:text-3xl"
        style={{ color: "var(--asc-fg-0)" }}
      >
        {featuredTournament?.title ?? "ASCENDRA MAJOR · SEASON 7"}
      </h2>

      <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-2)" }}>
        {featuredTournament?.game?.name
          ? `${featuredTournament.game.name} · Open qualifier`
          : "The crown returns to the arena"}
      </p>

      <p
        className="mt-5 text-xs font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--asc-accent)" }}
      >
        ▲ Group stage begins in
      </p>

      <div className="mt-2 flex gap-5">
        {[
          { value: countdown.days, label: "DAYS" },
          { value: countdown.hours, label: "HRS" },
          { value: countdown.minutes, label: "MIN" },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p
              className="text-3xl font-black tabular-nums"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {item.value}
            </p>
            <p
              className="text-[9px] font-black uppercase tracking-[0.14em]"
              style={{ color: "var(--asc-fg-3)" }}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          margin: "22px 0 16px",
          height: 1,
          background: "var(--asc-line-soft)",
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Prize
          </p>
          <p
            className="mt-1 text-sm font-black"
            style={{ color: "var(--asc-prize)" }}
          >
            {featuredTournament?.prize ?? "—"}
          </p>
        </div>

        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Slots
          </p>
          <p
            className="mt-1 text-sm font-black"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {featuredTournament
              ? `${approvedSlots}/${featuredTournament.maxTeams}`
              : "—"}
          </p>
        </div>

        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            Region
          </p>
          <p
            className="mt-1 text-sm font-black"
            style={{ color: "var(--asc-fg-0)" }}
          >
            Global
          </p>
        </div>
      </div>

      {featuredTournament && (
        <div className="mt-5">
          <ProgressBar
            approvedSlots={approvedSlots}
            maxSlots={featuredTournament.maxTeams}
            approvedLabel="locked"
          />
        </div>
      )}

      <Link
        href={
          featuredTournament
            ? `/tournaments/${featuredTournament.id}`
            : "/tournaments"
        }
        className="mt-5 flex w-full items-center justify-center py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:opacity-90"
        style={{
          background: "var(--asc-accent-2)",
          clipPath:
            "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
      >
        Register team ›
      </Link>
    </div>
  );
}

function LiveMatchCard({ match }: { match: LiveMatchData }) {
  const isLive = match.status === "live";
  const teamATag = match.teamA
    ? match.teamA.name.slice(0, 2).toUpperCase()
    : "??";
  const teamBTag = match.teamB
    ? match.teamB.name.slice(0, 2).toUpperCase()
    : "??";

  return (
    <article
      className="relative overflow-hidden border"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        {isLive ? (
          <span
            className="inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
            style={{
              color: "var(--asc-live)",
              borderColor: "oklch(0.50 0.20 25 / 0.5)",
              background: "oklch(0.25 0.18 25 / 0.18)",
            }}
          >
            <span className="asc-live-dot" />
            LIVE
          </span>
        ) : (
          <span
            className="inline-flex border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
            style={{
              color: "var(--asc-fg-3)",
              borderColor: "var(--asc-line-soft)",
            }}
          >
            Completed
          </span>
        )}

        <span
          className="truncate text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {match.tournament.title}
        </span>
      </div>

      <div className="grid gap-4 px-5 py-5">
        {[
          {
            tag: teamATag,
            name: match.teamA?.name ?? "TBD",
            score: match.scoreA,
          },
          {
            tag: teamBTag,
            name: match.teamB?.name ?? "TBD",
            score: match.scoreB,
          },
        ].map((team, index) => (
          <div key={`${team.tag}-${index}`} className="flex items-center gap-3">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center text-[11px] font-black text-white"
              style={{
                background:
                  index === 0 ? "var(--asc-accent-2)" : "oklch(0.45 0.14 220)",
                clipPath:
                  "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
              }}
            >
              {team.tag}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-black"
                style={{ color: "var(--asc-fg-0)" }}
              >
                {team.name}
              </p>
              <p
                className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                Team
              </p>
            </div>

            <p
              className="text-3xl font-black tabular-nums"
              style={{
                color: "var(--asc-fg-0)",
                fontFamily: "var(--font-display)",
              }}
            >
              {team.score}
            </p>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          borderTop: "1px solid var(--asc-line-soft)",
          background: "oklch(0.09 0.03 285)",
        }}
      >
        <span
          className="text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-2)" }}
        >
          Round {match.round}
        </span>
        <span style={{ color: "var(--asc-line)" }}>·</span>
        <span
          className="text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-2)" }}
        >
          BO{match.bestOf}
        </span>
        <span
          className="ml-auto text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-accent)" }}
        >
          Match {match.matchNumber}
        </span>
      </div>
    </article>
  );
}

function TournamentFeatureCard({
  tournament,
  compact = false,
  locale,
  messages,
}: {
  tournament: {
    id: string;
    title: string;
    game: { name: string; slug: string } | null;
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
  };
  compact?: boolean;
  locale: Locale;
  messages: HomeMessages;
}) {
  const approvedSlots = tournament.registrations.filter(
    (registration) => registration.status === "approved",
  ).length;

  const applications = tournament.registrations.length;
  const imageSrc = getTournamentImageUrl(
    tournament.game?.slug ?? null,
    tournament.imageUrl,
  );

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group relative block min-h-[240px] overflow-hidden border transition hover:opacity-95"
      style={{
        minHeight: compact ? 190 : 285,
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
        style={{
          backgroundImage: `url("${imageSrc}")`,
          opacity: 0.82,
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.06 0.03 287 / 0.22) 0%, oklch(0.06 0.03 287 / 0.96) 100%)",
        }}
      />

      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="relative z-10 flex h-full min-h-[inherit] flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status={tournament.status}
            label={getTournamentStatusLabel(
              tournament.status,
              messages.statuses,
            )}
          />
          <span
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-2)" }}
          >
            {tournament.game?.name ?? "—"}
          </span>
        </div>

        <div className="mt-auto">
          <h3
            className="text-2xl md:text-3xl"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {tournament.title}
          </h3>

          <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-2)" }}>
            {tournament.startsAt?.toLocaleDateString() ?? "—"} ·{" "}
            {tournament.teamSize}v{tournament.teamSize} ·{" "}
            {formatApplications(applications, messages.tournaments, locale)}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.14em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                Prize
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
                Teams
              </p>
              <p
                className="mt-1 text-sm font-black"
                style={{ color: "var(--asc-fg-0)" }}
              >
                {approvedSlots}
                <span style={{ color: "var(--asc-fg-3)" }}>
                  /{tournament.maxTeams}
                </span>
              </p>
            </div>

            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.14em]"
                style={{ color: "var(--asc-fg-3)" }}
              >
                Format
              </p>
              <p
                className="mt-1 text-sm font-black"
                style={{ color: "var(--asc-fg-0)" }}
              >
                {tournament.teamSize}v{tournament.teamSize}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function GameTile({ game }: { game: GameData }) {
  const imageSrc = getTournamentImageUrl(game.slug, null);

  return (
    <Link
      href="/games"
      className="group relative block aspect-[3/4] overflow-hidden border transition hover:opacity-95"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url("${imageSrc}")` }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 25%, oklch(0.07 0.025 285 / 0.96) 100%)",
        }}
      />

      <div aria-hidden="true" className="asc-corner-mark" />

      {game._count.tournaments > 0 && (
        <div className="absolute right-4 top-4">
          <span
            className="border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
            style={{
              color: "var(--asc-fg-2)",
              borderColor: "var(--asc-line-soft)",
              background: "oklch(0.10 0.03 285 / 0.60)",
            }}
          >
            {game._count.tournaments} TOURNAMENTS
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-lg" style={{ color: "var(--asc-fg-0)" }}>
          {game.name}
        </h3>
        <p
          className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {game.defaultTeamSize}v{game.defaultTeamSize} · {game._count.teams}{" "}
          teams
        </p>
      </div>
    </Link>
  );
}

function DiscordGlyph() {
  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center"
      style={{
        background: "oklch(0.62 0.18 270)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      <svg
        width="24"
        height="18"
        viewBox="0 0 24 18"
        fill="oklch(0.98 0.01 290)"
      >
        <path d="M20.3 1.8a18 18 0 0 0-4.5-1.4l-.2.4c1.6.3 3 .9 4.3 1.7-1.6-.9-3.4-1.4-5.3-1.4S10.9.6 9.3 1.5c1.3-.8 2.7-1.4 4.3-1.7l-.2-.4A18 18 0 0 0 8.9 1.8C5.7 6.7 4.9 11.4 5.3 16c1.8 1.3 3.6 2 5.4 2.5l.4-.6a11 11 0 0 1-2.2-1.1c.2-.1.4-.2.5-.3 4.1 1.9 8.5 1.9 12.5 0 .2.1.4.2.5.3-.7.4-1.4.8-2.2 1.1l.4.6c1.8-.5 3.6-1.2 5.4-2.5.5-5.4-.8-10-2.7-14.2zM9.7 13.5c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2zm6.6 0c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2z" />
      </svg>
    </div>
  );
}

function DiscordPreviewCard({ inviteUrl }: { inviteUrl: string | null }) {
  return (
    <div
      className="relative overflow-hidden border p-0"
      style={{
        borderColor: "var(--asc-line-soft)",
        background:
          "linear-gradient(135deg, oklch(0.30 0.18 270 / 0.88) 0%, oklch(0.12 0.05 280 / 0.96) 58%, oklch(0.08 0.03 285) 100%)",
        clipPath:
          "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 82% 18%, oklch(0.62 0.18 270 / 0.24), transparent 42%)",
        }}
      />

      <div className="relative z-10 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <DiscordGlyph />

          <div>
            <p
              className="text-[10px] font-black uppercase tracking-[0.18em]"
              style={{ color: "oklch(0.85 0.10 270)" }}
            >
              Community
            </p>
            <h3 className="text-xl" style={{ color: "var(--asc-fg-0)" }}>
              The Ascendra Discord
            </h3>
          </div>
        </div>

        <p
          className="mt-4 text-sm leading-6"
          style={{ color: "var(--asc-fg-1)" }}
        >
          Join Discord for live community coordination while tournaments,
          rules, roles, and rankings stay available here on Ascendra.
        </p>

        <div
          className="mt-5 border px-4 py-3 text-xs leading-5"
          style={{
            borderColor: "var(--asc-line-soft)",
            background: "oklch(0.10 0.035 285 / 0.54)",
            color: "var(--asc-fg-2)",
          }}
        >
          Live Discord stats unavailable
        </div>

        {inviteUrl ? (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center justify-center px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:opacity-90"
            style={{
              background: "oklch(0.62 0.18 270)",
              clipPath:
                "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            }}
          >
            Join the server
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="mt-7 inline-flex items-center justify-center border px-5 py-3 text-xs font-black uppercase tracking-[0.14em]"
            style={{
              borderColor: "var(--asc-line-soft)",
              color: "var(--asc-fg-3)",
              background: "oklch(0.14 0.04 285 / 0.65)",
              clipPath:
                "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            }}
          >
            Join server unavailable
          </span>
        )}
      </div>
    </div>
  );
}

function HomeMetricTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div
      className="relative border p-5"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />

      <p
        className="text-[10px] font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>

      <p
        className="mt-3 text-3xl font-black tabular-nums"
        style={{ color: "var(--asc-fg-0)", fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>

      <p
        className="mt-2 text-[10px] font-bold"
        style={{ color: "var(--asc-green)" }}
      >
        {sub}
      </p>
    </div>
  );
}

function LeaderboardPreview({ players }: { players: TopPlayer[] }) {
  const accents = [
    "oklch(0.62 0.22 285)",
    "oklch(0.58 0.18 220)",
    "oklch(0.60 0.22 320)",
    "oklch(0.58 0.20 250)",
    "oklch(0.62 0.22 25)",
  ];

  const displayPlayers: LadderPreviewPlayer[] = players.slice(0, 5).map(
    (player, index) => ({
      id: player.userId,
      rank: index + 1,
      name: player.username,
      initials: player.username.slice(0, 2).toUpperCase(),
      meta:
        player.placement !== null
          ? `Best #${player.placement} · Tournament points`
          : "Tournament points",
      score: player.points,
      scoreLabel: "PTS",
      accent: accents[index] ?? accents[4],
    }),
  );

  return (
    <div>
      <SectionHeader label="APEX 100" title="Top of the ladder">
        <Link
          href="/leaderboard"
          className="border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition hover:opacity-75"
          style={{
            borderColor: "var(--asc-line-soft)",
            color: "var(--asc-fg-2)",
          }}
        >
          Full ladder ›
        </Link>
      </SectionHeader>

      <div
        className="relative overflow-hidden border"
        style={{
          borderColor: "var(--asc-line-soft)",
          background: "var(--asc-bg-1)",
        }}
      >
        {displayPlayers.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p
              className="text-sm font-black uppercase tracking-[0.12em]"
              style={{ color: "var(--asc-fg-0)" }}
            >
              No ranked players yet
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--asc-fg-3)" }}>
              Rankings will appear here once tournament results are recorded.
            </p>
          </div>
        ) : (
          displayPlayers.map((player, index) => (
            <Link
              key={player.id}
              href="/leaderboard"
              className="flex items-center gap-4 px-5 py-4 transition hover:opacity-90"
              style={{
                borderTop: index ? "1px solid var(--asc-line-soft)" : "0",
                background:
                  index === 0
                    ? "oklch(0.20 0.12 285 / 0.08)"
                    : "transparent",
              }}
            >
              <span
                className="w-8 shrink-0 text-sm font-black tabular-nums"
                style={{
                  color: index < 3 ? "var(--asc-accent)" : "var(--asc-fg-3)",
                }}
              >
                {String(player.rank).padStart(2, "0")}
              </span>

              <span
                className="grid h-9 w-9 shrink-0 place-items-center text-[11px] font-black text-white"
                style={{
                  background: player.accent,
                  clipPath:
                    "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
                }}
              >
                {player.initials}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-sm font-black"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  {player.name}
                </span>
                <span
                  className="mt-1 block truncate text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {player.meta}
                </span>
              </span>

              <span className="w-20 shrink-0 text-right">
                <span
                  className="block text-lg font-black tabular-nums"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  {player.score.toLocaleString()}
                </span>
                <span
                  className="text-[9px] font-black uppercase tracking-[0.14em]"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {player.scoreLabel}
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({
  item,
  index,
}: {
  item: AnnouncementData;
  index: number;
}) {
  const msAgo = Date.now() - item.createdAt.getTime();
  const hoursAgo = Math.max(1, Math.round(msAgo / 3600000));
  const timeLabel =
    hoursAgo < 24 ? `${hoursAgo}H AGO` : `${Math.round(hoursAgo / 24)}D AGO`;

  return (
    <Link
      href="/announcements"
      className="relative flex gap-4 overflow-hidden border p-5 transition hover:opacity-90"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <p
        className="shrink-0 text-5xl font-black leading-none tabular-nums"
        style={{
          color: "var(--asc-accent)",
          fontFamily: "var(--font-display)",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </p>

      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {item.category} · {timeLabel}
        </p>

        <h3
          className="mt-2 text-lg leading-tight"
          style={{ color: "var(--asc-fg-0)" }}
        >
          {item.title}
        </h3>

        <p
          className="mt-3 text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          2 min read
        </p>
      </div>

      <span
        className="mt-1 shrink-0 text-lg"
        style={{ color: "var(--asc-fg-3)" }}
      >
        ›
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const locale = await getLocale();
  const messages = getDictionary(locale).home;

  const [
    rawTournaments,
    liveMatches,
    games,
    allResults,
    recentAnnouncements,
    totalUsers,
    totalTeams,
    activeTournamentCount,
    publicTournamentCount,
  ] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
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
        createdAt: true,
        registrations: {
          where: { status: { in: ["registered", "approved", "rejected"] } },
          select: { id: true, status: true },
        },
      },
    }),

    prisma.match.findMany({
      where: { status: { in: ["live", "completed"] } },
      select: {
        id: true,
        round: true,
        matchNumber: true,
        status: true,
        bestOf: true,
        scoreA: true,
        scoreB: true,
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
        tournament: { select: { id: true, title: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 6,
    }),

    prisma.game.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        shortName: true,
        defaultTeamSize: true,
        _count: { select: { tournaments: true, teams: true } },
      },
      orderBy: { name: "asc" },
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
                user: { select: { id: true, username: true } },
              },
            },
          },
        },
      },
    }),

    prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        createdAt: true,
      },
    }),

    prisma.user.count(),

    prisma.team.count(),

    prisma.tournament.count({
      where: { visibility: "public", status: { in: ["open", "upcoming"] } },
    }),

    prisma.tournament.count({
      where: { visibility: "public" },
    }),
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
    .slice(0, 4);

  const sortedMatches = [...liveMatches]
    .sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (a.status !== "live" && b.status === "live") return 1;

      return 0;
    })
    .slice(0, 3);

  const playerMap = new Map<
    string,
    { username: string; points: number; placements: number[] }
  >();

  for (const result of allResults) {
    const snapshotMembers = parseSnapshotMembers(result.snapshotMembers);
    const members =
      snapshotMembers.length > 0
        ? snapshotMembers
            .filter((member) => Boolean(member.userId))
            .map((member) => ({
              id: member.userId!,
              username: member.username ?? "Unknown",
            }))
        : result.team.members.map((member) => ({
            id: member.user.id,
            username: member.user.username,
          }));

    for (const member of members) {
      const existing = playerMap.get(member.id) ?? {
        username: member.username,
        points: 0,
        placements: [],
      };

      playerMap.set(member.id, {
        username: existing.username,
        points: existing.points + result.points,
        placements: [...existing.placements, result.placement],
      });
    }
  }

  const topPlayers: TopPlayer[] = Array.from(playerMap.entries())
    .map(([userId, data]) => ({
      userId,
      username: data.username,
      points: data.points,
      placement:
        data.placements.length > 0 ? Math.min(...data.placements) : null,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const displayGames = games;

  const displayAnnouncements = recentAnnouncements;

  const featuredTournament = tournaments[0] ?? null;

  const featuredApprovedSlots = featuredTournament
    ? featuredTournament.registrations.filter(
        (registration) => registration.status === "approved",
      ).length
    : 0;

  const featuredCountdown = getCountdownParts(
    featuredTournament?.startsAt ?? null,
  );
  const discordInviteUrl =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() || null;

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="relative min-h-[720px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/home-hero.webp")',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.20) 0%, oklch(0.07 0.025 285 / 0.55) 55%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.30) 40%, transparent 65%)",
              ].join(", "),
            }}
          />

          <div className="relative z-10 mx-auto flex min-h-[720px] max-w-[1680px] items-end px-6 pb-20 pt-24 lg:px-10 2xl:px-14">
            <div className="grid w-full gap-10 lg:grid-cols-[3fr_2fr] lg:items-end">
              <div>
                <p
                  className="mb-5 text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: "var(--asc-accent)" }}
                >
                  ▲ ASCENDRA · SEASON 07 · A PREMIUM ESPORTS PLATFORM
                </p>

                <h1
                  className="text-6xl font-black uppercase leading-none md:text-8xl"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  RISE
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(92deg, var(--asc-accent) 0%, oklch(0.85 0.10 245) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    BEYOND LIMITS.
                  </span>
                </h1>

                <p
                  className="mt-6 max-w-xl text-base leading-7"
                  style={{ color: "var(--asc-fg-2)" }}
                >
                  {messages.hero.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <PrimaryLink href="/tournaments">
                    Browse tournaments
                  </PrimaryLink>
                  <SecondaryLink href="/community">Join Discord</SecondaryLink>
                </div>
              </div>

              <FeaturedEventCard
                featuredTournament={featuredTournament}
                approvedSlots={featuredApprovedSlots}
                countdown={featuredCountdown}
              />
            </div>
          </div>
        </section>

        {/* Ticker */}
        <div
          className="asc-ticker-track"
          style={{
            background: "oklch(0.12 0.03 287 / 0.60)",
            borderTop: "1px solid var(--asc-line-soft)",
            borderBottom: "1px solid var(--asc-line-soft)",
            padding: "10px 0",
          }}
        >
          <div className="asc-ticker-inner">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="inline-flex items-center gap-0"
                aria-hidden={copy === 1 ? true : undefined}
              >
                {[
                  { text: "◈ TOURNAMENTS", highlight: true },
                  { text: "  REGISTER YOUR TEAM AND COMPETE", highlight: false },
                  { text: "  ◈ RANKINGS", highlight: true },
                  { text: "  SEASONAL LEADERBOARD", highlight: false },
                  { text: "  ◈ RESULTS", highlight: true },
                  { text: "  VERIFIED MATCH RESULTS", highlight: false },
                  { text: "  ◈ GAMES", highlight: true },
                  { text: "  MULTI-TITLE COMPETITIVE PLATFORM", highlight: false },
                  { text: "  ◈ COMMUNITY", highlight: true },
                  { text: "  TEAM MANAGEMENT AND MATCH CENTER", highlight: false },
                  { text: "  ◈ ASCENDRA", highlight: true },
                  { text: "  PREMIUM ESPORTS PLATFORM", highlight: false },
                  { text: "  ✦ ", highlight: false },
                ].map((segment, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "0 4px",
                      color: segment.highlight
                        ? "var(--asc-accent)"
                        : "var(--asc-fg-3)",
                    }}
                  >
                    {segment.text}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* How Ascendra Works */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div
              className="mb-8 h-px w-full"
              style={{ background: "var(--asc-line-soft)" }}
            >
              <span
                className="relative -top-2 bg-[var(--asc-bg-0)] pr-4 text-xs font-black uppercase tracking-[0.18em]"
                style={{ color: "var(--asc-accent)" }}
              >
                ▲ How Ascendra works
              </span>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Register your team",
                  description:
                    "Form your roster, choose the tournament you want in, and submit your team for review.",
                },
                {
                  number: "02",
                  title: "Climb the brackets",
                  description:
                    "Compete through verified matches, structured rounds, and transparent tournament progress.",
                },
                {
                  number: "03",
                  title: "Earn your rank",
                  description:
                    "Results feed the leaderboard and build your long-term Ascendra competitive record.",
                },
              ].map((step) => (
                <article key={step.number}>
                  <p
                    className="text-6xl font-black leading-none"
                    style={{
                      color: "var(--asc-accent)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {step.number}
                  </p>
                  <h3
                    className="mt-4 text-lg"
                    style={{ color: "var(--asc-fg-0)" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="mt-3 max-w-sm text-sm leading-6"
                    style={{ color: "var(--asc-fg-2)" }}
                  >
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Live Matches */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label="Broadcasts"
              title="Live now"
              count={sortedMatches.length}
            >
              <Link
                href="/tournaments"
                className="border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition hover:opacity-75"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  color: "var(--asc-fg-2)",
                }}
              >
                All matches ›
              </Link>
            </SectionHeader>

            {sortedMatches.length === 0 ? (
              <div
                className="relative border p-8 text-center"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-1)",
                  clipPath:
                    "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                }}
              >
                <p
                  className="text-sm font-black uppercase tracking-[0.12em]"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  No live matches right now
                </p>
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  Check back during tournament events.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedMatches.map((match) => (
                  <LiveMatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tournaments */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label="Open registration"
              title="Compete this season"
            >
              <Link
                href="/tournaments"
                className="border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition hover:opacity-75"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  color: "var(--asc-fg-2)",
                }}
              >
                All tournaments ›
              </Link>
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
                {messages.tournaments.empty}
              </div>
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  {tournaments.slice(0, 2).map((tournament) => (
                    <TournamentFeatureCard
                      key={tournament.id}
                      tournament={tournament}
                      locale={locale}
                      messages={messages}
                    />
                  ))}
                </div>

                {tournaments.length > 2 && (
                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    {tournaments.slice(2, 4).map((tournament) => (
                      <TournamentFeatureCard
                        key={tournament.id}
                        tournament={tournament}
                        compact
                        locale={locale}
                        messages={messages}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Games */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label={`Competitive titles · ${String(displayGames.length).padStart(2, "0")}`}
              title="Pick your arena"
            >
              <Link
                href="/games"
                className="border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition hover:opacity-75"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  color: "var(--asc-fg-2)",
                }}
              >
                Games registry ›
              </Link>
            </SectionHeader>

            {displayGames.length === 0 ? (
              <div
                className="border p-6 text-center"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-1)",
                  clipPath:
                    "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                }}
              >
                <p
                  className="text-sm font-black uppercase tracking-[0.12em]"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  No games configured yet
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                  Supported titles will appear here once added to the registry.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {displayGames.slice(0, 5).map((game) => (
                  <GameTile key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Leaderboard + Community */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              <LeaderboardPreview players={topPlayers} />

              <div className="grid gap-4">
                <DiscordPreviewCard inviteUrl={discordInviteUrl} />

                <div className="grid grid-cols-2 gap-4">
                  <HomeMetricTile
                    label="Players"
                    value={formatCompact(totalUsers)}
                    sub="Registered accounts"
                  />
                  <HomeMetricTile
                    label="Teams"
                    value={formatCompact(totalTeams)}
                    sub="Registered teams"
                  />
                  <HomeMetricTile
                    label="Active tournaments"
                    value={activeTournamentCount}
                    sub={`${publicTournamentCount} public total`}
                  />
                  <HomeMetricTile
                    label="Results"
                    value={formatCompact(allResults.length)}
                    sub="Tournament results"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader label="From the desk" title="Latest announcements" />

            {displayAnnouncements.length === 0 ? (
              <div
                className="border p-6 text-center"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-bg-1)",
                  clipPath:
                    "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                }}
              >
                <p
                  className="text-sm font-black uppercase tracking-[0.12em]"
                  style={{ color: "var(--asc-fg-0)" }}
                >
                  No announcements yet
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                  Published announcements will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {displayAnnouncements.map((item, index) => (
                  <AnnouncementCard key={item.id} item={item} index={index} />
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <SecondaryLink href="/announcements">
                All announcements ›
              </SecondaryLink>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}

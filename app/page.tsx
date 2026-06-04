import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import LeaderboardAvatar from "@/components/LeaderboardAvatar";
import Footer from "@/components/Footer";
import HomeRealtimeRefresh from "@/components/HomeRealtimeRefresh";
import HeroTextAnimated from "@/components/HeroTextAnimated";
import HeroScene3DWrapper from "@/components/HeroScene3DWrapper";
import SectionReveal from "@/components/SectionReveal";
import Navbar from "@/components/Navbar";
import { getDictionary, type HomeMessages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { getDiscordStats, type DiscordStats } from "@/lib/discordStats";
import { prisma } from "@/lib/prisma";
import {
  aggregatePlayerLeaderboard,
  getActiveRankingSeason,
} from "@/lib/ranking/rankingService";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

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
  tier: string;
  rank: number;
  avatar: string | null;
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
  avatar: string | null;
};

function getNavArrow(locale: Locale) {
  return locale === "ar" ? "‹" : "›";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).home.metadata;

  return {
    title: { absolute: messages.title },
    description: messages.description,
  };
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
      days: "--",
      hours: "--",
      minutes: "--",
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
          borderColor: "var(--asc-green-border)",
          background: "var(--asc-green-bg)",
        }
      : normalized === "upcoming" || normalized === "registered"
        ? {
            color: "var(--asc-blue)",
            borderColor: "var(--asc-blue-border)",
            background: "var(--asc-blue-bg)",
          }
        : normalized === "closed" || normalized === "rejected"
          ? {
              color: "var(--asc-live)",
              borderColor: "var(--asc-live-border)",
              background: "var(--asc-live-bg)",
            }
          : normalized === "ended"
            ? {
                color: "var(--asc-blue)",
                borderColor: "var(--asc-blue-border)",
                background: "var(--asc-blue-bg)",
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
  locale = "en",
}: {
  href: string;
  children: ReactNode;
  locale?: Locale;
}) {
  const arrow = getNavArrow(locale);
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
      <span className={locale === "ar" ? "mr-2" : "ml-2"}>{arrow}</span>
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
          className="asc-section-label"
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
  messages,
  locale,
}: {
  featuredTournament: {
    id: string;
    title: string;
    game: { name: string; slug: string } | null;
    startsAt: Date | null;
    prize: string | null;
    maxTeams: number;
    registrations: { id: string; status: string }[];
    status: string;
  } | null;
  approvedSlots: number;
  countdown: { days: string; hours: string; minutes: string };
  messages: HomeMessages;
  locale: Locale;
}) {
  const arrow = getNavArrow(locale);
  const f = messages.featured;

  const countdownItems = [
    { value: countdown.days, label: f.days },
    { value: countdown.hours, label: f.hours },
    { value: countdown.minutes, label: f.minutes },
  ];

  return (
    <div
      className="asc-hero-light-card relative border p-6 shadow-2xl backdrop-blur"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-card)",
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
          {f.label}
        </span>
      </div>

      <h2
        className="mt-4 text-2xl font-black uppercase leading-tight md:text-3xl"
        style={{ color: "var(--asc-fg-0)" }}
      >
        {featuredTournament?.title ?? f.noFeaturedTitle}
      </h2>

      <p className="mt-2 text-sm" style={{ color: "var(--asc-fg-2)" }}>
        {featuredTournament?.game?.name
          ? `${featuredTournament.game.name} · ${f.qualifierSuffix}`
          : f.noFeaturedSub}
      </p>

      <p
        className="mt-5 text-xs font-black uppercase tracking-[0.16em]"
        style={{ color: "var(--asc-accent)" }}
      >
        ▲ {f.startsIn}
      </p>

      <div className="mt-2 flex gap-5">
        {countdownItems.map((item) => (
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
            {f.prize}
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
            {f.slots}
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
            {f.status}
          </p>
          <p
            className="mt-1 text-sm font-black"
            style={{ color: "var(--asc-fg-0)" }}
          >
            {featuredTournament
              ? getTournamentStatusLabel(featuredTournament.status, messages.statuses)
              : "—"}
          </p>
        </div>
      </div>

      {featuredTournament && (
        <div className="mt-5">
          <ProgressBar
            approvedSlots={approvedSlots}
            maxSlots={featuredTournament.maxTeams}
            approvedLabel={f.locked}
          />
        </div>
      )}

      <Link
        href={
          featuredTournament
            ? `/tournaments/${featuredTournament.id}`
            : "/tournaments"
        }
        className="mt-5 flex w-full items-center justify-center gap-2 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:opacity-90"
        style={{
          background: "var(--asc-accent-2)",
          clipPath:
            "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
      >
        {f.registerButton} {arrow}
      </Link>
    </div>
  );
}

function LiveMatchCard({
  match,
  messages,
}: {
  match: LiveMatchData;
  messages: HomeMessages;
}) {
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
              borderColor: "var(--asc-live-border)",
              background: "var(--asc-live-bg)",
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
            {messages.matches.completed}
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
                  index === 0 ? "var(--asc-accent-2)" : "var(--asc-blue)",
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
                {messages.matches.team}
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
          background: "var(--asc-bg-2)",
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
            "linear-gradient(180deg, rgb(12 11 9 / 0.22) 0%, rgb(12 11 9 / 0.96) 100%)",
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
                {messages.tournaments.prize}
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
                {messages.tournaments.teamsLabel}
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
                {messages.tournaments.formatLabel}
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

function GameTile({ game, messages }: { game: GameData; messages: HomeMessages }) {
  const imageSrc = getTournamentImageUrl(game.slug, null);

  return (
    <Link
      href="/games"
      className="asc-image-card group relative block aspect-[3/4] overflow-hidden border transition hover:opacity-95"
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
            "linear-gradient(180deg, transparent 25%, rgb(12 11 9 / 0.96) 100%)",
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
              background: "var(--asc-card-muted)",
            }}
          >
            {game._count.tournaments} {messages.games.tournamentsLabel}
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
          {messages.games.teamsLabel}
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
        background: "linear-gradient(135deg, #b8893d, #8f642f)",
        clipPath:
          "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
      }}
    >
      <svg
        width="24"
        height="18"
        viewBox="0 0 24 18"
        fill="#ffffff"
      >
        <path d="M20.3 1.8a18 18 0 0 0-4.5-1.4l-.2.4c1.6.3 3 .9 4.3 1.7-1.6-.9-3.4-1.4-5.3-1.4S10.9.6 9.3 1.5c1.3-.8 2.7-1.4 4.3-1.7l-.2-.4A18 18 0 0 0 8.9 1.8C5.7 6.7 4.9 11.4 5.3 16c1.8 1.3 3.6 2 5.4 2.5l.4-.6a11 11 0 0 1-2.2-1.1c.2-.1.4-.2.5-.3 4.1 1.9 8.5 1.9 12.5 0 .2.1.4.2.5.3-.7.4-1.4.8-2.2 1.1l.4.6c1.8-.5 3.6-1.2 5.4-2.5.5-5.4-.8-10-2.7-14.2zM9.7 13.5c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2zm6.6 0c-1 0-1.9-1-1.9-2.2s.9-2.2 1.9-2.2 1.9 1 1.9 2.2-.9 2.2-1.9 2.2z" />
      </svg>
    </div>
  );
}

function DiscordPreviewCard({
  stats,
  messages,
}: {
  stats: DiscordStats;
  messages: HomeMessages;
}) {
  const d = messages.discord;
  const metrics = [
    stats.memberCount !== null
      ? { label: d.membersLabel, value: formatCompact(stats.memberCount) }
      : null,
    stats.onlineCount !== null
      ? { label: d.onlineLabel, value: formatCompact(stats.onlineCount) }
      : null,
    stats.lastHeartbeatAt
      ? { label: d.botLabel, value: stats.botStatusLabel }
      : null,
  ].filter(
    (metric): metric is { label: string; value: string } => Boolean(metric),
  );

  return (
    <div
      className="relative overflow-hidden border p-0"
      style={{
        borderColor: "var(--asc-line-soft)",
        background:
          "var(--asc-discord-card-bg)",
        clipPath:
          "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 82% 18%, rgba(184, 137, 61, 0.18), transparent 42%)",
        }}
      />

      <div className="relative z-10 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <DiscordGlyph />

          <div>
            <p
              className="text-[10px] font-black uppercase tracking-[0.18em]"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {d.label}
            </p>
            <h3 className="text-xl" style={{ color: "var(--asc-fg-0)" }}>
              {d.title}
            </h3>
          </div>
        </div>

        <p
          className="mt-4 text-sm leading-6"
          style={{ color: "var(--asc-fg-1)" }}
        >
          {d.description}
        </p>

        {metrics.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="border px-3 py-3"
                style={{
                  borderColor: "var(--asc-line-soft)",
                  background: "var(--asc-card-muted)",
                  clipPath:
                    "polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)",
                }}
              >
                <p
                  className="text-[9px] font-black uppercase tracking-[0.12em]"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {metric.label}
                </p>
                <p
                  className="mt-1 text-lg font-black tabular-nums"
                  style={{ color: "var(--asc-fg-0)", fontFamily: "var(--font-display)" }}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/discord"
            className="inline-flex items-center justify-center px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #b8893d, #8f642f)",
              clipPath:
                "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
            }}
          >
            {d.openHub}
          </Link>

          {stats.inviteUrl && (
            <a
              href={stats.inviteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center border px-5 py-3 text-xs font-black uppercase tracking-[0.14em] transition hover:opacity-90"
              style={{
                borderColor: "var(--asc-line-soft)",
                color: "var(--asc-fg-2)",
                clipPath:
                  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              }}
            >
              {d.joinServer}
            </a>
          )}
        </div>
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

function LeaderboardPreview({
  players,
  messages,
  locale,
}: {
  players: TopPlayer[];
  messages: HomeMessages;
  locale: Locale;
}) {
  const lp = messages.leaderboardPreview;
  const arrow = getNavArrow(locale);

  const displayPlayers: LadderPreviewPlayer[] = players.map(
    (player, index) => ({
      id: player.userId,
      rank: player.rank,
      name: player.username,
      initials: player.username.slice(0, 2).toUpperCase(),
      meta: player.tier,
      score: player.points,
      scoreLabel: "PTS",
      accent: "var(--asc-accent)",
      avatar: player.avatar,
    }),
  );

  return (
    <div>
      <SectionHeader label={lp.label} title={lp.title}>
        <Link
          href="/leaderboard"
          className="border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition hover:opacity-75"
          style={{
            borderColor: "var(--asc-line-soft)",
            color: "var(--asc-fg-2)",
          }}
        >
          {lp.viewAll} {arrow}
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
              {lp.emptyTitle}
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
                    ? "var(--asc-hover-soft)"
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

              <LeaderboardAvatar name={player.name} src={player.avatar} size={36} />

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
  locale = "en",
  now,
}: {
  item: AnnouncementData;
  index: number;
  locale?: Locale;
  now: number;
}) {
  const msAgo = now - item.createdAt.getTime();
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

      </div>

      <span
        className="mt-1 shrink-0 text-lg"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {getNavArrow(locale)}
      </span>
    </Link>
  );
}

function currentTimeMs(): number {
  return Date.now();
}

export default async function HomePage() {
  const now = currentTimeMs();
  const locale = await getLocale();
  const messages = getDictionary(locale).home;

  const [
    rawTournaments,
    liveMatches,
    games,
    leaderboardEntries,
    activeSeason,
    recentAnnouncements,
    totalUsers,
    totalTeams,
    activeTournamentCount,
    publicTournamentCount,
    discordStats,
    totalResults,
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

    aggregatePlayerLeaderboard({ limit: 5 }),
    getActiveRankingSeason(),

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

    getDiscordStats(),

    prisma.tournamentResult.count(),
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

  const topPlayers: TopPlayer[] = leaderboardEntries.map((entry) => ({
    userId: entry.userId,
    username: entry.user?.username ?? "Unknown",
    points: entry.totalPoints,
    tier: entry.tier.name,
    rank: entry.rank,
    avatar: entry.user?.avatar ?? null,
  }));

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
  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="asc-image-hero relative min-h-[720px] overflow-hidden">
          <div
            className="asc-hero-media absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/home-hero.webp")',
            }}
          />

          <HeroScene3DWrapper />

          <div
            className="asc-hero-overlay absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(12 11 9 / 0.20) 0%, rgb(12 11 9 / 0.55) 55%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(12 11 9 / 0.30) 40%, transparent 65%)",
              ].join(", "),
              zIndex: 3,
            }}
          />

          <div className="asc-image-hero-content relative z-10 mx-auto flex min-h-[720px] max-w-[1680px] items-end px-6 pb-20 pt-24 lg:px-10 2xl:px-14">
            <div className="grid w-full gap-10 lg:grid-cols-[3fr_2fr] lg:items-end">
              <HeroTextAnimated
                eyebrow={`▲ ASCENDRA · ${activeSeason?.name ?? messages.hero.seasonLabel} · ${messages.hero.platformTagline}`}
                description={messages.hero.description}
                primaryHref="/tournaments"
                primaryLabel={messages.hero.primary}
                secondaryHref="/discord"
                secondaryLabel={messages.hero.discordButton}
                locale={locale}
              />

              <FeaturedEventCard
                featuredTournament={featuredTournament}
                approvedSlots={featuredApprovedSlots}
                countdown={featuredCountdown}
                messages={messages}
                locale={locale}
              />
            </div>
          </div>
        </section>

        {/* Ticker */}
        <div
          className="asc-ticker-track"
          style={{
            background: "var(--asc-card-muted)",
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

        {/* How it works */}
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
                ▲ {messages.flow.label}
              </span>
            </div>

            <SectionReveal>
              <div className="grid gap-8 md:grid-cols-3">
                {messages.flow.steps.map((step, index) => (
                  <article key={index}>
                    <p
                      className="text-6xl font-black leading-none"
                      style={{
                        color: "var(--asc-accent)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
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
            </SectionReveal>
          </div>
        </section>

        {/* Live Matches */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label={messages.matches.label}
              title={messages.matches.title}
              count={sortedMatches.length}
            >
              <Link
                href="/tournaments"
                className="asc-mini-button"
              >
                {messages.matches.viewAll} {getNavArrow(locale)}
              </Link>
            </SectionHeader>

            <SectionReveal>
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
                    {messages.matches.emptyTitle}
                  </p>
                  <p
                    className="mt-2 text-xs"
                    style={{ color: "var(--asc-fg-3)" }}
                  >
                    {messages.matches.emptySub}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sortedMatches.map((match) => (
                    <LiveMatchCard key={match.id} match={match} messages={messages} />
                  ))}
                </div>
              )}
            </SectionReveal>
          </div>
        </section>

        {/* Tournaments */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label={messages.tournaments.label}
              title={messages.tournaments.title}
            >
              <Link
                href="/tournaments"
                className="asc-mini-button"
              >
                {messages.tournaments.viewAll} {getNavArrow(locale)}
              </Link>
            </SectionHeader>

            <SectionReveal>
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
            </SectionReveal>
          </div>
        </section>

        {/* Games */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader
              label={`${messages.games.label} · ${String(displayGames.length).padStart(2, "0")}`}
              title={messages.games.title}
            >
              <Link
                href="/games"
                className="asc-mini-button"
              >
                {messages.games.viewAll} {getNavArrow(locale)}
              </Link>
            </SectionHeader>

            <SectionReveal>
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
                    {messages.games.emptyTitle}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {displayGames.slice(0, 5).map((game) => (
                    <GameTile key={game.id} game={game} messages={messages} />
                  ))}
                </div>
              )}
            </SectionReveal>
          </div>
        </section>

        {/* Leaderboard + Community */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionReveal>
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              <LeaderboardPreview players={topPlayers} messages={messages} locale={locale} />

              <div className="grid gap-4">
                <DiscordPreviewCard stats={discordStats} messages={messages} />

                <div className="grid grid-cols-2 gap-4">
                  <HomeMetricTile
                    label={messages.metrics.players}
                    value={formatCompact(totalUsers)}
                    sub={messages.metrics.playersSub}
                  />
                  <HomeMetricTile
                    label={messages.metrics.teams}
                    value={formatCompact(totalTeams)}
                    sub={messages.metrics.teamsSub}
                  />
                  <HomeMetricTile
                    label={messages.metrics.activeTournaments}
                    value={activeTournamentCount}
                    sub={`${publicTournamentCount} ${messages.metrics.publicTotalSuffix}`}
                  />
                  <HomeMetricTile
                    label={messages.metrics.results}
                    value={formatCompact(totalResults)}
                    sub={messages.metrics.resultsSub}
                  />
                </div>
              </div>
            </div>
            </SectionReveal>
          </div>
        </section>

        {/* Announcements */}
        <section className="relative py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <SectionHeader label={messages.announcements.label} title={messages.announcements.title} />

            <SectionReveal>
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
                    {messages.announcements.emptyTitle}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: "var(--asc-fg-3)" }}>
                    {messages.announcements.emptySub}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayAnnouncements.map((item, index) => (
                    <AnnouncementCard key={item.id} item={item} index={index} locale={locale} now={now} />
                  ))}
                </div>
              )}
            </SectionReveal>

            <div className="mt-8 flex justify-center">
              <SecondaryLink href="/announcements">
                {messages.announcements.viewAll} {getNavArrow(locale)}
              </SecondaryLink>
            </div>
          </div>
        </section>

        <Footer />
      </div>
      <HomeRealtimeRefresh />
    </main>
  );
}

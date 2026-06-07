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
import HomeCinematicBackdrop from "@/components/home/HomeCinematicBackdrop";
import HomePremiumSurface from "@/components/home/HomePremiumSurface";
import HomeSectionShell from "@/components/home/HomeSectionShell";
import HomeSignalRail from "@/components/home/HomeSignalRail";
import { getDictionary, type HomeMessages, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { getDiscordStats, type DiscordStats } from "@/lib/discordStats";
import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@prisma/client";
import {
  aggregatePlayerLeaderboard,
  getActiveRankingSeason,
} from "@/lib/ranking/rankingService";
import { getTournamentImageUrl } from "@/lib/tournamentImages";

export const dynamic = "force-dynamic";

type LiveMatchData = {
  id: string;
  roundNumber: number;
  matchNumber: number;
  status: string;
  bestOf: number;
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
            color: "var(--asc-silver)",
            borderColor: "rgba(183, 187, 193, 0.34)",
            background: "rgba(183, 187, 193, 0.10)",
          }
        : normalized === "closed" || normalized === "rejected"
          ? {
              color: "var(--asc-live)",
              borderColor: "var(--asc-live-border)",
              background: "var(--asc-live-bg)",
            }
          : normalized === "ended"
            ? {
                color: "var(--asc-fg-3)",
                borderColor: "var(--asc-line)",
                background: "var(--asc-card-muted)",
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
  const emptyValue = "—";
  const eventMeta = featuredTournament?.game?.name
    ? `${featuredTournament.game.name} · ${f.qualifierSuffix}`
    : f.noFeaturedSub;
  const eventStatus = featuredTournament
    ? getTournamentStatusLabel(featuredTournament.status, messages.statuses)
    : emptyValue;

  return (
    <HomePremiumSurface
      className="asc-hero-light-card asc-home-featured-event p-0 shadow-2xl backdrop-blur"
      tone="hero"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-card)",
        clipPath:
          "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)",
      }}
    >
      <div className="asc-home-event-shell">
        <div className="asc-home-event-topbar">
          <span className="asc-home-event-live">
            <span className="asc-live-dot" />
            <span>{f.label}</span>
          </span>
          <span className="asc-home-event-status">{eventStatus}</span>
        </div>

        <div className="asc-home-event-title-block">
          <h2 className="asc-home-event-title">
            {featuredTournament?.title ?? f.noFeaturedTitle}
          </h2>
          <p className="asc-home-event-meta">{eventMeta}</p>
        </div>

        <div className="asc-home-event-countdown-wrap">
          <p className="asc-home-event-kicker">{f.startsIn}</p>
          <div className="asc-home-event-countdown">
            {countdownItems.map((item) => (
              <div className="asc-home-event-countdown-item" key={item.label}>
                <p className="asc-home-event-countdown-value">{item.value}</p>
                <p className="asc-home-event-countdown-label">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="asc-home-event-divider" />

        <div className="asc-home-event-stats">
          <div className="asc-home-event-stat">
            <p className="asc-home-event-stat-label">{f.prize}</p>
            <p className="asc-home-event-stat-value asc-home-event-stat-value--prize">
              {featuredTournament?.prize ?? emptyValue}
            </p>
          </div>

          <div className="asc-home-event-stat">
            <p className="asc-home-event-stat-label">{f.slots}</p>
            <p className="asc-home-event-stat-value">
              {featuredTournament
                ? `${approvedSlots}/${featuredTournament.maxTeams}`
                : emptyValue}
            </p>
          </div>

          <div className="asc-home-event-stat">
            <p className="asc-home-event-stat-label">{f.status}</p>
            <p className="asc-home-event-stat-value">{eventStatus}</p>
          </div>
        </div>

        {featuredTournament && (
          <div className="asc-home-event-progress">
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
          className="asc-home-event-cta"
        >
          <span>{f.registerButton}</span>
          <span aria-hidden="true">{arrow}</span>
        </Link>
      </div>
    </HomePremiumSurface>
  );
}

function LiveMatchCard({
  match,
  messages,
}: {
  match: LiveMatchData;
  messages: HomeMessages;
}) {
  const statusKey = match.status.toLowerCase();
  const isLive = statusKey === "in_progress";
  const isCompleted = statusKey === "completed";
  const matchTone = isLive ? "live" : isCompleted ? "completed" : "standby";
  const statusLabel = isLive
    ? "LIVE"
    : isCompleted
      ? messages.matches.completed
      : match.status.replace(/_/g, " ").toUpperCase();
  const teamATag = match.teamA
    ? match.teamA.name.slice(0, 2).toUpperCase()
    : "??";
  const teamBTag = match.teamB
    ? match.teamB.name.slice(0, 2).toUpperCase()
    : "??";

  return (
    <article
      className={`asc-home-broadcast-card asc-home-broadcast-card--${matchTone}`}
    >
      <div aria-hidden="true" className="asc-home-broadcast-card__grid" />
      <div aria-hidden="true" className="asc-home-broadcast-card__signal" />

      <div className="asc-home-broadcast-card__header">
        <span className="asc-home-broadcast-card__status">
          {isLive && <span className="asc-live-dot" />}
          <span>{statusLabel}</span>
        </span>

        <span className="asc-home-broadcast-card__tournament">
          {match.tournament.title}
        </span>
      </div>

      <div className="asc-home-broadcast-card__body">
        {[
          {
            tag: teamATag,
            name: match.teamA?.name ?? "TBD",
          },
          {
            tag: teamBTag,
            name: match.teamB?.name ?? "TBD",
          },
        ].map((team, index) => (
          <div
            key={`${team.tag}-${index}`}
            className="asc-home-broadcast-team"
          >
            <div className={`asc-home-broadcast-team__tag asc-home-broadcast-team__tag--${index + 1}`}>
              {team.tag}
            </div>

            <div className="min-w-0 flex-1">
              <p className="asc-home-broadcast-team__name">
                {team.name}
              </p>
              <p className="asc-home-broadcast-team__label">
                {messages.matches.team}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="asc-home-broadcast-card__footer">
        <span>Round {match.roundNumber}</span>
        <span>BO{match.bestOf}</span>
        <span>Match {match.matchNumber}</span>
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
  const registrationLabel = getRegistrationStatusLabel(
    tournament.registrationStatus,
    messages.statuses,
  );

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={`asc-home-command-card ${compact ? "asc-home-command-card--compact" : "asc-home-command-card--featured"} group`}
    >
      <div
        aria-hidden="true"
        className="asc-home-command-card__image"
        style={{
          backgroundImage: `url("${imageSrc}")`,
        }}
      />

      <div aria-hidden="true" className="asc-home-command-card__scrim" />
      <div aria-hidden="true" className="asc-home-command-card__grid" />
      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="asc-home-command-card__content">
        <div className="asc-home-command-card__topbar">
          <StatusBadge
            status={tournament.status}
            label={getTournamentStatusLabel(
              tournament.status,
              messages.statuses,
            )}
          />
          <span className="asc-home-command-card__registration">
            {registrationLabel}
          </span>
        </div>

        <div className="asc-home-command-card__body">
          <p className="asc-home-command-card__game">
            {tournament.game?.name ?? "—"}
          </p>

          <h3 className="asc-home-command-card__title">
            {tournament.title}
          </h3>

          <p className="asc-home-command-card__meta">
            {tournament.startsAt?.toLocaleDateString() ?? "—"} ·{" "}
            {tournament.teamSize}v{tournament.teamSize} ·{" "}
            {formatApplications(applications, messages.tournaments, locale)}
          </p>

          <div className="asc-home-command-card__stats">
            <div className="asc-home-command-card__stat">
              <p className="asc-home-command-card__stat-label">
                {messages.tournaments.prize}
              </p>
              <p className="asc-home-command-card__stat-value asc-home-command-card__stat-value--prize">
                {tournament.prize ?? "—"}
              </p>
            </div>

            <div className="asc-home-command-card__stat">
              <p className="asc-home-command-card__stat-label">
                {messages.tournaments.teamsLabel}
              </p>
              <p className="asc-home-command-card__stat-value">
                {approvedSlots}
                <span>/{tournament.maxTeams}</span>
              </p>
            </div>

            <div className="asc-home-command-card__stat">
              <p className="asc-home-command-card__stat-label">
                {messages.tournaments.formatLabel}
              </p>
              <p className="asc-home-command-card__stat-value">
                {tournament.teamSize}v{tournament.teamSize}
              </p>
            </div>
          </div>

          {!compact && (
            <div className="asc-home-command-card__progress">
              <ProgressBar
                approvedSlots={approvedSlots}
                maxSlots={tournament.maxTeams}
                approvedLabel={messages.featured.locked}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function GameTile({
  game,
  index,
  messages,
}: {
  game: GameData;
  index: number;
  messages: HomeMessages;
}) {
  const imageSrc = getTournamentImageUrl(game.slug, null);

  return (
    <Link
      href="/games"
      className="asc-home-registry-tile group"
    >
      <div
        aria-hidden="true"
        className="asc-home-registry-tile__image"
        style={{ backgroundImage: `url("${imageSrc}")` }}
      />

      <div aria-hidden="true" className="asc-home-registry-tile__scrim" />
      <div aria-hidden="true" className="asc-home-registry-tile__grid" />
      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="asc-home-registry-tile__index">
        {String(index + 1).padStart(2, "0")}
      </div>

      {game._count.tournaments > 0 && (
        <div className="asc-home-registry-tile__badge">
          <span>
            {game._count.tournaments} {messages.games.tournamentsLabel}
          </span>
        </div>
      )}

      <div className="asc-home-registry-tile__content">
        <h3>{game.name}</h3>
        <p>
          {game.defaultTeamSize}v{game.defaultTeamSize} · {game._count.teams}{" "}
          {messages.games.teamsLabel}
        </p>
      </div>
    </Link>
  );
}

function DiscordGlyph() {
  return (
    <div aria-hidden="true" className="asc-home-discord-glyph">
      <svg
        width="24"
        height="18"
        viewBox="0 0 24 18"
        fill="currentColor"
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
    <article className="asc-home-community-card">
      <div aria-hidden="true" className="asc-home-community-card__grid" />
      <div aria-hidden="true" className="asc-home-community-card__flare" />
      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="asc-home-community-card__content">
        <div className="asc-home-community-card__header">
          <DiscordGlyph />

          <div>
            <p className="asc-home-community-card__label">
              {d.label}
            </p>
            <h3 className="asc-home-community-card__title">
              {d.title}
            </h3>
          </div>
        </div>

        <p className="asc-home-community-card__description">
          {d.description}
        </p>

        {metrics.length > 0 && (
          <div className="asc-home-community-card__metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="asc-home-community-metric">
                <p className="asc-home-community-metric__label">
                  {metric.label}
                </p>
                <p className="asc-home-community-metric__value">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="asc-home-community-card__actions">
          <Link
            href="/discord"
            className="asc-home-community-cta asc-home-community-cta--primary"
          >
            {d.openHub}
          </Link>

          {stats.inviteUrl && (
            <a
              href={stats.inviteUrl}
              target="_blank"
              rel="noreferrer"
              className="asc-home-community-cta asc-home-community-cta--secondary"
            >
              {d.joinServer}
            </a>
          )}
        </div>
      </div>
    </article>
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
    <div className="asc-home-command-metric">
      <div aria-hidden="true" className="asc-corner-mark" />

      <p className="asc-home-command-metric__label">
        {label}
      </p>

      <p className="asc-home-command-metric__value">
        {value}
      </p>

      <p className="asc-home-command-metric__sub">
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
    (player) => ({
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
    <div className="asc-home-ranking-stage">
      <SectionHeader label={lp.label} title={lp.title}>
        <Link
          href="/leaderboard"
          className="asc-mini-button"
        >
          {lp.viewAll} {arrow}
        </Link>
      </SectionHeader>

      <div className="asc-home-ranking-board">
        <div aria-hidden="true" className="asc-home-ranking-board__grid" />
        <div aria-hidden="true" className="asc-home-ranking-board__rail" />

        {displayPlayers.length === 0 ? (
          <div className="asc-home-ranking-empty">
            <p>
              {lp.emptyTitle}
            </p>
          </div>
        ) : (
          displayPlayers.map((player, index) => (
            <Link
              key={player.id}
              href="/leaderboard"
              className={`asc-home-ranking-row ${index === 0 ? "asc-home-ranking-row--leader" : ""}`}
            >
              <span className="asc-home-ranking-row__rank">
                {String(player.rank).padStart(2, "0")}
              </span>

              <LeaderboardAvatar name={player.name} src={player.avatar} size={36} />

              <span className="asc-home-ranking-row__identity">
                <span className="asc-home-ranking-row__name">
                  {player.name}
                </span>
                <span className="asc-home-ranking-row__meta">
                  {player.meta}
                </span>
              </span>

              <span className="asc-home-ranking-row__score">
                <span>
                  {player.score.toLocaleString()}
                </span>
                <span>
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
      className="asc-home-briefing-card group"
    >
      <div aria-hidden="true" className="asc-home-briefing-card__grid" />

      <p className="asc-home-briefing-card__index">
        {String(index + 1).padStart(2, "0")}
      </p>

      <div className="asc-home-briefing-card__body">
        <p className="asc-home-briefing-card__meta">
          <span>{item.category}</span>
          <span>{timeLabel}</span>
        </p>

        <h3>
          {item.title}
        </h3>

        <p className="asc-home-briefing-card__description">
          {item.description}
        </p>
      </div>

      <span className="asc-home-briefing-card__arrow">
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
    rawLiveMatches,
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

    prisma.tournamentMatch.findMany({
      where: {
        status: {
          in: [
            MatchStatus.in_progress,
            MatchStatus.ready,
            MatchStatus.room_created,
            MatchStatus.result_pending,
            MatchStatus.disputed,
          ],
        },
        teamAId: { not: null },
        teamBId: { not: null },
      },
      select: {
        id: true,
        roundNumber: true,
        matchNumber: true,
        status: true,
        bestOf: true,
        teamAId: true,
        teamBId: true,
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

  // TournamentMatch stores only team IDs — resolve names with a batch lookup.
  const liveMatchTeamIds = [
    ...new Set(
      rawLiveMatches
        .flatMap((match) => [match.teamAId, match.teamBId])
        .filter((teamId): teamId is string => Boolean(teamId)),
    ),
  ];
  const liveMatchTeamRows =
    liveMatchTeamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: liveMatchTeamIds } },
          select: { id: true, name: true },
        })
      : [];
  const liveMatchTeamName = new Map(
    liveMatchTeamRows.map((team) => [team.id, team.name]),
  );

  const liveMatches: LiveMatchData[] = rawLiveMatches.map((match) => ({
    id: match.id,
    roundNumber: match.roundNumber,
    matchNumber: match.matchNumber,
    status: match.status,
    bestOf: match.bestOf,
    teamA: match.teamAId
      ? { id: match.teamAId, name: liveMatchTeamName.get(match.teamAId) ?? "TBD" }
      : null,
    teamB: match.teamBId
      ? { id: match.teamBId, name: liveMatchTeamName.get(match.teamBId) ?? "TBD" }
      : null,
    tournament: match.tournament,
  }));

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
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (a.status !== "in_progress" && b.status === "in_progress") return 1;

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

  const heroStats = [
    { label: messages.metrics.players, value: formatCompact(totalUsers) },
    { label: messages.metrics.teams, value: formatCompact(totalTeams) },
    {
      label: messages.metrics.activeTournaments,
      value: formatCompact(activeTournamentCount),
    },
  ];

  const signalSegments = [
    { label: messages.tournaments.label, value: formatCompact(tournaments.length) },
    { label: messages.matches.label, value: formatCompact(sortedMatches.length) },
    { label: messages.games.label, value: formatCompact(displayGames.length) },
    {
      label: messages.leaderboardPreview.label,
      value: formatCompact(topPlayers.length),
    },
    { label: messages.metrics.players, value: formatCompact(totalUsers) },
    { label: messages.metrics.teams, value: formatCompact(totalTeams) },
    { label: messages.metrics.results, value: formatCompact(totalResults) },
    {
      label: messages.announcements.label,
      value: formatCompact(displayAnnouncements.length),
    },
  ];

  return (
    <main
      className="asc-public-page asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="asc-image-hero asc-home-hero relative min-h-[760px] overflow-hidden">
          <div
            className="asc-hero-media absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/home-hero.webp")',
            }}
          />

          <HomeCinematicBackdrop
            eventLabel={featuredTournament?.title ?? messages.featured.noFeaturedTitle}
            seasonLabel={activeSeason?.name ?? messages.hero.seasonLabel}
          />

          <HeroScene3DWrapper />

          <div
            className="asc-hero-overlay absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, rgb(var(--asc-scrim-rgb) / 0.20) 0%, rgb(var(--asc-scrim-rgb) / 0.55) 55%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, rgb(var(--asc-scrim-rgb) / 0.30) 40%, transparent 65%)",
              ].join(", "),
              zIndex: 3,
            }}
          />

          <div className="asc-image-hero-content asc-home-hero-content relative z-10 mx-auto flex min-h-[760px] max-w-[1680px] items-end px-6 pb-20 pt-24 lg:px-10 2xl:px-14">
            <div className="asc-home-hero-grid grid w-full gap-10 lg:grid-cols-[3fr_2fr] lg:items-end">
              <HeroTextAnimated
                eyebrow={`ASCENDRA / ${activeSeason?.name ?? messages.hero.seasonLabel} / ${messages.hero.platformTagline}`}
                description={messages.hero.description}
                primaryHref="/tournaments"
                primaryLabel={messages.hero.primary}
                secondaryHref="/discord"
                secondaryLabel={messages.hero.discordButton}
                locale={locale}
                stats={heroStats}
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

        {/* Live signal rail */}
        <HomeSignalRail segments={signalSegments} />

        {/* How it works */}
        <HomeSectionShell variant="flow" className="asc-home-flow-section">
          <div className="asc-home-flow-heading">
            <p className="asc-section-label">
              ▲ {messages.flow.label}
            </p>
            <h2>{messages.flow.title}</h2>
            <p>{messages.flow.description}</p>
          </div>

          <SectionReveal>
            <div className="asc-home-flow-grid">
              {messages.flow.steps.map((step, index) => (
                <article className="asc-home-flow-card" key={index}>
                  <div aria-hidden="true" className="asc-home-flow-card__rail" />
                  <p className="asc-home-flow-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </SectionReveal>
        </HomeSectionShell>

        {/* Live Matches */}
        <HomeSectionShell variant="broadcast" className="asc-home-broadcast-section">
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
                <HomePremiumSurface className="asc-home-empty-panel asc-home-empty-panel--broadcast p-8 text-center">
                  <p className="asc-home-empty-panel__title">
                    {messages.matches.emptyTitle}
                  </p>
                  <p className="asc-home-empty-panel__text">
                    {messages.matches.emptySub}
                  </p>
                </HomePremiumSurface>
              ) : (
                <div className="asc-home-broadcast-wall">
                  {sortedMatches.map((match) => (
                    <LiveMatchCard key={match.id} match={match} messages={messages} />
                  ))}
                </div>
              )}
            </SectionReveal>
        </HomeSectionShell>

        {/* Tournaments */}
        <HomeSectionShell variant="command" className="asc-home-command-section">
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
                <HomePremiumSurface className="asc-home-empty-panel p-8">
                  {messages.tournaments.empty}
                </HomePremiumSurface>
              ) : (
                <div className="asc-home-command-deck">
                  <div className="asc-home-command-deck__primary">
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
                    <div className="asc-home-command-deck__secondary">
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
                </div>
              )}
            </SectionReveal>
        </HomeSectionShell>

        {/* Games */}
        <HomeSectionShell variant="registry" className="asc-home-registry-section">
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
                <HomePremiumSurface className="asc-home-empty-panel p-8 text-center">
                  <p className="asc-home-empty-panel__title">
                    {messages.games.emptyTitle}
                  </p>
                </HomePremiumSurface>
              ) : (
                <div className="asc-home-registry-grid">
                  {displayGames.slice(0, 5).map((game, index) => (
                    <GameTile
                      key={game.id}
                      game={game}
                      index={index}
                      messages={messages}
                    />
                  ))}
                </div>
              )}
            </SectionReveal>
        </HomeSectionShell>

        {/* Leaderboard + Community */}
        <HomeSectionShell variant="rankings" className="asc-home-rankings-section">
          <SectionReveal>
            <div className="asc-home-rankings-layout">
              <LeaderboardPreview players={topPlayers} messages={messages} locale={locale} />

              <aside className="asc-home-community-command">
                <DiscordPreviewCard stats={discordStats} messages={messages} />

                <div className="asc-home-command-metrics-grid">
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
              </aside>
            </div>
          </SectionReveal>
        </HomeSectionShell>

        {/* Announcements */}
        <HomeSectionShell variant="briefing" className="asc-home-briefing-section">
            <SectionHeader label={messages.announcements.label} title={messages.announcements.title} />

            <SectionReveal>
              {displayAnnouncements.length === 0 ? (
                <HomePremiumSurface className="asc-home-empty-panel p-8 text-center">
                  <p className="asc-home-empty-panel__title">
                    {messages.announcements.emptyTitle}
                  </p>
                  <p className="asc-home-empty-panel__text">
                    {messages.announcements.emptySub}
                  </p>
                </HomePremiumSurface>
              ) : (
                <div className="asc-home-briefing-grid">
                  {displayAnnouncements.map((item, index) => (
                    <AnnouncementCard key={item.id} item={item} index={index} locale={locale} now={now} />
                  ))}
                </div>
              )}
            </SectionReveal>

            <div className="asc-home-briefing-actions">
              <Link href="/announcements" className="asc-mini-button">
                {messages.announcements.viewAll} {getNavArrow(locale)}
              </Link>
            </div>
        </HomeSectionShell>

        {/* Final CTA */}
        <HomeSectionShell variant="final" className="asc-home-final-section">
          <SectionReveal>
            <div className="asc-home-final-cta">
              <div aria-hidden="true" className="asc-home-final-cta__grid" />
              <div aria-hidden="true" className="asc-home-final-cta__flare" />
              <div aria-hidden="true" className="asc-corner-mark" />

              <div className="asc-home-final-cta__copy">
                <p className="asc-section-label">
                  ▲ {messages.playerHub.label}
                </p>
                <h2>{messages.playerHub.guestTitle}</h2>
                <p>{messages.playerHub.guestDescription}</p>
              </div>

              <div className="asc-home-final-cta__actions">
                <Link
                  href="/login"
                  className="asc-home-final-cta__button asc-home-final-cta__button--primary"
                >
                  {messages.playerHub.loginWithDiscord}
                </Link>
                <Link
                  href="/tournaments"
                  className="asc-home-final-cta__button asc-home-final-cta__button--secondary"
                >
                  {messages.playerHub.viewTournaments}
                </Link>
              </div>
            </div>
          </SectionReveal>
        </HomeSectionShell>

        <Footer />
      </div>
      <HomeRealtimeRefresh />
    </main>
  );
}

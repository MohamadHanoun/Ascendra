import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { getGameImageUrl } from "@/lib/tournamentImages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GameIntegrationData = {
  enabled: boolean;
  provider: string;
};

type GameRegistryItem = {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  description: string | null;
  iconUrl: string | null;
  coverImageUrl: string | null;
  platform: string | null;
  defaultTeamSize: number;
  defaultSubstitutes: number;
  isActive: boolean;
  tournaments: {
    status: string;
    registrationStatus: string;
  }[];
  integrations: GameIntegrationData[];
  _count: {
    tournaments: number;
    teams: number;
  };
};

type IntegrationView = {
  label: "Configured" | "Manual" | "Not configured";
  tone: "configured" | "manual" | "empty";
};

const shellStyle: CSSProperties = {
  background: "var(--asc-bg-0)",
  color: "var(--asc-fg-1)",
};

const clippedCardStyle: CSSProperties = {
  clipPath:
    "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
};

const monoStyle: CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
};

export const metadata: Metadata = {
  title: "Games Registry | Ascendra",
  description: "Browse the competitive titles configured for Ascendra.",
};

function cssUrl(url: string) {
  return `url(${JSON.stringify(url)})`;
}

function getGameArt(game: GameRegistryItem) {
  const cover = game.coverImageUrl?.trim();
  if (cover) {
    return cover;
  }

  return getGameImageUrl(game.slug);
}

function getIntegrationView(
  integrations: GameIntegrationData[],
): IntegrationView {
  const enabled = integrations.filter((integration) => integration.enabled);

  if (enabled.length === 0) {
    return integrations.length > 0
      ? { label: "Not configured", tone: "empty" }
      : { label: "Manual", tone: "manual" };
  }

  const hasExternalProvider = enabled.some(
    (integration) => integration.provider !== "manual",
  );

  return hasExternalProvider
    ? { label: "Configured", tone: "configured" }
    : { label: "Manual", tone: "manual" };
}

function getIntegrationColor(tone: IntegrationView["tone"]) {
  if (tone === "configured") {
    return "var(--asc-green)";
  }

  if (tone === "manual") {
    return "var(--asc-blue)";
  }

  return "var(--asc-fg-3)";
}

function formatRoster(game: GameRegistryItem) {
  const base = `${game.defaultTeamSize}v${game.defaultTeamSize}`;

  if (game.defaultSubstitutes > 0) {
    return `${base} + ${game.defaultSubstitutes} sub`;
  }

  return base;
}

function countOpenTournaments(game: GameRegistryItem) {
  return game.tournaments.filter((tournament) => tournament.status === "open")
    .length;
}

function countUpcomingTournaments(game: GameRegistryItem) {
  return game.tournaments.filter(
    (tournament) => tournament.status === "upcoming",
  ).length;
}

function countOpenRegistrations(game: GameRegistryItem) {
  return game.tournaments.filter(
    (tournament) =>
      tournament.registrationStatus === "open" &&
      !["cancelled", "ended"].includes(tournament.status),
  ).length;
}

function CornerMark() {
  return <div aria-hidden="true" className="asc-corner-mark" />;
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
      style={{
        ...monoStyle,
        border: active
          ? "1px solid oklch(0.55 0.14 150 / 0.5)"
          : "1px solid var(--asc-line-soft)",
        background: active
          ? "oklch(0.25 0.12 150 / 0.18)"
          : "transparent",
        color: active ? "var(--asc-green)" : "var(--asc-fg-3)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: active ? "var(--asc-green)" : "var(--asc-fg-3)" }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StatBlock({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="grid justify-items-end gap-1">
      <span
        className="text-[10px] uppercase tracking-[0.16em]"
        style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-black leading-none"
        style={{
          fontFamily: "var(--font-display)",
          color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionLink({
  href,
  children,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
}) {
  const isGhost = variant === "ghost";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition hover:opacity-90"
      style={{
        ...clippedCardStyle,
        fontFamily: "var(--font-display)",
        background: isGhost ? "transparent" : "var(--asc-bg-2)",
        border: `1px solid ${isGhost ? "var(--asc-line)" : "var(--asc-line)"}`,
        color: "var(--asc-fg-0)",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

function GameRow({ game, index }: { game: GameRegistryItem; index: number }) {
  const integration = getIntegrationView(game.integrations);
  const integrationColor = getIntegrationColor(integration.tone);
  const openTournaments = countOpenTournaments(game);
  const upcomingTournaments = countUpcomingTournaments(game);
  const openRegistrations = countOpenRegistrations(game);
  const artUrl = getGameArt(game);
  const leaderboardHref = game.isActive
    ? `/leaderboard?game=${encodeURIComponent(game.slug)}`
    : "/leaderboard";

  return (
    <article
      className="relative min-h-[180px] overflow-hidden border"
      style={{
        ...clippedCardStyle,
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        boxShadow: "0 26px 80px rgb(0 0 0 / 0.22)",
      }}
    >
      <CornerMark />

      <div
        className="grid min-h-[180px] lg:grid-cols-[360px_minmax(0,1fr)]"
      >
        <div className="relative min-h-[210px] overflow-hidden lg:min-h-[180px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: cssUrl(artUrl) }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--asc-bg-1) 100%)",
            }}
          />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span
              className="px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
              style={{
                ...monoStyle,
                color: "var(--asc-fg-2)",
                background: "rgb(0 0 0 / 0.50)",
                backdropFilter: "blur(8px)",
              }}
            >
              {String(index).padStart(2, "0")} ·{" "}
              {game.isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col px-6 py-6 md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
                >
                  {(game.platform ?? "Not available").toUpperCase()} ·{" "}
                  {formatRoster(game).toUpperCase()}
                </span>

                <span
                  className="inline-flex items-center gap-2 text-[10px] uppercase"
                  style={{
                    ...monoStyle,
                    color: "var(--asc-fg-2)",
                    letterSpacing: "0.12em",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: integrationColor }}
                  />
                  {integration.label.toUpperCase()}
                </span>

                <StatusPill active={game.isActive} />
              </div>

              <h2
                className="text-4xl leading-none md:text-[42px]"
                style={{ color: "var(--asc-fg-0)" }}
              >
                {game.name}
              </h2>

              <p
                className="mt-3 max-w-3xl text-sm leading-6"
                style={{ color: "var(--asc-fg-2)" }}
              >
                {game.description?.trim() || "Not available"}
              </p>

              <p
                className="mt-4 text-[11px] uppercase tracking-[0.12em]"
                style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
              >
                {game.shortName ? `${game.shortName} · ` : ""}
                {game.slug}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 xl:flex xl:items-start xl:gap-8">
              <StatBlock
                label="Total"
                value={game._count.tournaments}
              />
              <StatBlock
                label="Active"
                value={openTournaments}
                accent={openTournaments > 0}
              />
              <StatBlock label="Upcoming" value={upcomingTournaments} />
              <StatBlock label="Teams" value={game._count.teams} />
            </div>
          </div>

          <div
            className="mt-auto flex flex-wrap items-center gap-3 pt-6"
            style={{ borderTop: "1px solid var(--asc-line-soft)" }}
          >
            <ActionLink href="/tournaments">
              View tournaments <span aria-hidden="true">›</span>
            </ActionLink>
            <ActionLink href={leaderboardHref} variant="ghost">
              Leaderboard
            </ActionLink>

            <span className="flex-1" />

            <span
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
            >
              Registration open · {openRegistrations}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyGamesState() {
  return (
    <section
      className="relative overflow-hidden border px-6 py-14 text-center"
      style={{
        ...clippedCardStyle,
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
      }}
    >
      <CornerMark />
      <p
        className="text-xs font-black uppercase tracking-[0.18em]"
        style={{ ...monoStyle, color: "var(--asc-accent)" }}
      >
        Registry empty
      </p>
      <h2 className="mt-3 text-3xl" style={{ color: "var(--asc-fg-0)" }}>
        No games are available yet.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
        Supported titles will appear here after they are added in the games
        registry.
      </p>
    </section>
  );
}

async function getGames(): Promise<GameRegistryItem[]> {
  return prisma.game.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      shortName: true,
      description: true,
      iconUrl: true,
      coverImageUrl: true,
      platform: true,
      defaultTeamSize: true,
      defaultSubstitutes: true,
      isActive: true,
      tournaments: {
        select: {
          status: true,
          registrationStatus: true,
        },
      },
      integrations: {
        select: {
          enabled: true,
          provider: true,
        },
      },
      _count: {
        select: {
          tournaments: true,
          teams: true,
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export default async function GamesPage() {
  const games = await getGames();
  const activeGamesCount = games.filter((game) => game.isActive).length;
  const totalTournaments = games.reduce(
    (total, game) => total + game._count.tournaments,
    0,
  );

  return (
    <main className="asc-ambient min-h-screen overflow-hidden" style={shellStyle}>
      <div className="relative z-10">
        <Navbar />

        <section className="relative flex min-h-[360px] items-end overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{
              backgroundImage: 'url("/images/backgrounds/tournaments-hero.webp")',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.56) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.42) 35%, transparent 70%)",
              ].join(", "),
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-[1680px] px-6 pb-9 pt-24 lg:px-10 2xl:px-14">
            <p
              className="mb-[18px] text-[11px] uppercase tracking-[0.18em]"
              style={{ ...monoStyle, color: "var(--asc-fg-2)" }}
            >
              <span style={{ color: "var(--asc-accent)" }}>▲</span>{" "}
              Competitive Titles · {activeGamesCount} Supported
            </p>
            <h1
              className="max-w-5xl text-[clamp(48px,6.4vw,108px)] leading-[0.92]"
              style={{ color: "var(--asc-fg-0)" }}
            >
              Games Registry
            </h1>
            <p
              className="mt-[18px] max-w-[580px] text-base leading-[1.55]"
              style={{ color: "var(--asc-fg-1)" }}
            >
              Browse the competitive titles configured for Ascendra tournaments,
              team rosters, and leaderboard filters.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 pt-10 lg:px-10 2xl:px-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ ...monoStyle, color: "var(--asc-fg-3)" }}
              >
                ▲ Registry
              </p>
              <h2 className="mt-2 text-2xl" style={{ color: "var(--asc-fg-0)" }}>
                Supported titles
              </h2>
            </div>

            <div className="flex flex-wrap gap-6">
              <StatBlock label="Games" value={games.length} />
              <StatBlock label="Active" value={activeGamesCount} accent />
              <StatBlock label="Tournaments" value={totalTournaments} />
            </div>
          </div>

          {games.length === 0 ? (
            <EmptyGamesState />
          ) : (
            <div className="flex flex-col gap-6">
              {games.map((game, index) => (
                <GameRow key={game.id} game={game} index={index + 1} />
              ))}
            </div>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import LeaderboardTable from "@/components/LeaderboardTable";
import Navbar from "@/components/Navbar";
import TeamLeaderboardTable from "@/components/TeamLeaderboardTable";
import type { LeaderboardTeam, LeaderboardUser } from "@/data/leaderboard";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import {
  getLeaderboardData,
  type LeaderboardGameOption,
  type LeaderboardSeasonScope,
  type LeaderboardType,
} from "@/lib/leaderboardData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeaderboardPageProps = {
  searchParams: Promise<{
    game?: string;
    type?: string;
    season?: string;
  }>;
};

const leaderboardDisclaimer =
  "Ascendra ranks are based only on community tournament points. They are not official game ranks, MMR, ELO, matchmaking ratings, or skill ratings.";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).leaderboard.metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

function buildLeaderboardHref(input: {
  gameSlug?: string | null;
  type: LeaderboardType;
  scope: LeaderboardSeasonScope;
}) {
  const params = new URLSearchParams();

  if (input.gameSlug) {
    params.set("game", input.gameSlug);
  }

  if (input.type === "teams") {
    params.set("type", "teams");
  }

  if (input.scope === "all") {
    params.set("season", "all");
  }

  const query = params.toString();
  return query ? `/leaderboard?${query}` : "/leaderboard";
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className="text-[11px] uppercase tracking-[0.12em]"
      style={{
        fontFamily: "var(--font-mono, monospace)",
        padding: "6px 12px",
        border: `1px solid ${
          active ? "var(--asc-accent)" : "var(--asc-line-soft)"
        }`,
        background: active ? "var(--asc-accent-dim)" : "transparent",
        color: active ? "var(--asc-fg-0)" : "var(--asc-fg-3)",
        clipPath:
          "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}

function GameFilters({
  games,
  selectedGame,
  selectedType,
  selectedScope,
  overallLabel,
}: {
  games: LeaderboardGameOption[];
  selectedGame: LeaderboardGameOption | null;
  selectedType: LeaderboardType;
  selectedScope: LeaderboardSeasonScope;
  overallLabel: string;
}) {
  return (
    <>
      <FilterPill
        href={buildLeaderboardHref({
          type: selectedType,
          scope: selectedScope,
        })}
        label={overallLabel}
        active={!selectedGame}
      />
      {games.map((game) => (
        <FilterPill
          key={game.id}
          href={buildLeaderboardHref({
            gameSlug: game.slug,
            type: selectedType,
            scope: selectedScope,
          })}
          label={game.name}
          active={selectedGame?.id === game.id}
        />
      ))}
    </>
  );
}

function LeaderboardDisclaimer() {
  return (
    <p
      className="mb-4 border px-4 py-3 text-xs leading-5"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "oklch(0.10 0.035 287 / 0.72)",
        color: "var(--asc-fg-2)",
      }}
    >
      {leaderboardDisclaimer}
    </p>
  );
}

function LeaderboardContent({
  type,
  data,
  messages,
  currentUserId,
  selectedGame,
}: {
  type: LeaderboardType;
  data: LeaderboardUser[] | LeaderboardTeam[];
  messages: ReturnType<typeof getDictionary>["leaderboard"];
  currentUserId?: string;
  selectedGame: LeaderboardGameOption | null;
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={messages.empty.title}
        description={
          selectedGame
            ? messages.empty.gameDescription
            : messages.empty.overallDescription
        }
        actionLabel={messages.empty.action}
        actionHref="/tournaments"
      />
    );
  }

  if (type === "teams") {
    return (
      <TeamLeaderboardTable
        teams={data as LeaderboardTeam[]}
        messages={messages.table}
      />
    );
  }

  return (
    <LeaderboardTable
      users={data as LeaderboardUser[]}
      messages={messages.table}
      currentUserId={currentUserId}
    />
  );
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const [params, locale, session] = await Promise.all([
    searchParams,
    getLocale(),
    auth(),
  ]);

  const messages = getDictionary(locale).leaderboard;
  const currentUserId = session?.user?.databaseId ?? undefined;
  const leaderboard = await getLeaderboardData({
    game: params.game,
    type: params.type,
    season: params.season,
  });

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="relative flex min-h-[430px] items-end overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("/images/backgrounds/leaderboard-hero.webp")',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.35) 0%, oklch(0.07 0.025 285 / 0.58) 45%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.42) 35%, transparent 70%)",
              ].join(", "),
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-14 pt-28 lg:px-8">
            <p
              className="mb-4 text-xs font-black uppercase tracking-[0.18em]"
              style={{ color: "var(--asc-accent)" }}
            >
              ▲ {messages.hero.label}
            </p>

            <h1
              className="text-5xl md:text-6xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {messages.hero.title}
            </h1>

            <p
              className="mt-4 max-w-xl text-sm leading-6"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {messages.hero.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <FilterPill
                href={buildLeaderboardHref({
                  gameSlug: leaderboard.selectedGame?.slug,
                  type: "players",
                  scope: leaderboard.scope,
                })}
                label={messages.types.playerRanking}
                active={leaderboard.type === "players"}
              />

              <FilterPill
                href={buildLeaderboardHref({
                  gameSlug: leaderboard.selectedGame?.slug,
                  type: "teams",
                  scope: leaderboard.scope,
                })}
                label={messages.types.teamRanking}
                active={leaderboard.type === "teams"}
              />

              <div
                className="mx-1 h-6 w-px"
                style={{ background: "var(--asc-line-soft)" }}
              />

              <FilterPill
                href={buildLeaderboardHref({
                  gameSlug: leaderboard.selectedGame?.slug,
                  type: leaderboard.type,
                  scope: "current",
                })}
                label={messages.filters.currentSeason}
                active={leaderboard.scope === "current"}
              />

              <FilterPill
                href={buildLeaderboardHref({
                  gameSlug: leaderboard.selectedGame?.slug,
                  type: leaderboard.type,
                  scope: "all",
                })}
                label={messages.filters.lifetime}
                active={leaderboard.scope === "all"}
              />

              <div
                className="mx-1 h-6 w-px"
                style={{ background: "var(--asc-line-soft)" }}
              />

              <GameFilters
                games={leaderboard.games}
                selectedGame={leaderboard.selectedGame}
                selectedType={leaderboard.type}
                selectedScope={leaderboard.scope}
                overallLabel={messages.filters.overall}
              />
            </div>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-10 max-w-[1440px] px-6 pb-24 lg:px-8">
          <LeaderboardDisclaimer />
          <LeaderboardContent
            type={leaderboard.type}
            data={leaderboard.data}
            messages={messages}
            currentUserId={currentUserId}
            selectedGame={leaderboard.selectedGame}
          />
        </div>

        <Footer />
      </div>
    </main>
  );
}

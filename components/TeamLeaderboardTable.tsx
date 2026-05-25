import LeaderboardAvatar from "@/components/LeaderboardAvatar";
import type { LeaderboardTeam } from "@/data/leaderboard";
import type { LeaderboardMessages } from "@/lib/i18n";

type TeamLeaderboardTableProps = {
  teams: LeaderboardTeam[];
  messages: LeaderboardMessages["table"];
};

type TeamPodiumEntry = {
  team: LeaderboardTeam;
  visualPlace: 1 | 2 | 3;
};

function CrownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="m3 7 4.5 4 4.5-7 4.5 7L21 7l-2 11H5L3 7Z" />
      <path d="M5 21h14" />
    </svg>
  );
}

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "gray" | "violet";
}) {
  const styleMap: Record<string, React.CSSProperties> = {
    green: {
      color: "var(--asc-green)",
      borderColor: "oklch(0.55 0.14 150 / 0.5)",
      background: "oklch(0.25 0.12 150 / 0.18)",
    },
    blue: {
      color: "var(--asc-blue)",
      borderColor: "oklch(0.55 0.12 220 / 0.5)",
      background: "oklch(0.25 0.10 220 / 0.18)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
    violet: {
      color: "var(--asc-accent)",
      borderColor: "oklch(0.50 0.20 285 / 0.4)",
      background: "var(--asc-accent-dim)",
    },
  };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black"
      style={styleMap[tone]}
    >
      {children}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
      style={{
        color: "var(--asc-accent)",
        borderColor: "oklch(0.50 0.20 285 / 0.4)",
        background: "var(--asc-accent-dim)",
      }}
    >
      {tier}
    </span>
  );
}

function getMemberLabel(count: number, messages: LeaderboardMessages["table"]) {
  return count === 1 ? messages.memberSingular : messages.memberPlural;
}

function RankingRow({
  team,
  messages,
}: {
  team: LeaderboardTeam;
  messages: LeaderboardMessages["table"];
}) {
  return (
    <article
      className="asc-leaderboard-row grid gap-4 px-[18px] py-3 md:grid-cols-[64px_minmax(0,1fr)_130px_110px_120px_120px] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <span
        className="text-xs font-black tabular-nums"
        style={{
          color: "var(--asc-fg-3)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {String(team.rank).padStart(2, "0")}
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <LeaderboardAvatar name={team.name} size={38} />
        <div className="min-w-0">
          <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>
            {team.name}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
            {messages.ledBy} {team.leaderName ?? "-"} - {team.membersCount}{" "}
            {getMemberLabel(team.membersCount, messages)}
          </p>
          <div className="mt-2 md:hidden">
            <TierBadge tier={team.tier} />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <TierBadge tier={team.tier} />
      </div>

      <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
        <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
          {team.tournamentPoints.toLocaleString()}
        </span>
        <span className="ml-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
          {messages.pointsSuffix}
        </span>
      </p>

      <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
        <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
          {team.tournamentResults}
        </span>{" "}
        {team.tournamentResults === 1
          ? messages.resultSingular
          : messages.resultPlural}
      </p>

      <Pill tone="blue">
        {messages.best} {team.bestPlacement ? `#${team.bestPlacement}` : "-"}
      </Pill>
    </article>
  );
}

function PodiumCard({
  team,
  messages,
  visualPlace,
}: {
  team: LeaderboardTeam;
  messages: LeaderboardMessages["table"];
  visualPlace: 1 | 2 | 3;
}) {
  const isFirst = visualPlace === 1;
  const rankTone = isFirst
    ? "oklch(0.84 0.14 85)"
    : visualPlace === 2
      ? "oklch(0.78 0.04 290)"
      : "oklch(0.72 0.05 285)";
  const ghostSize = isFirst ? 200 : 140;

  return (
    <article
      className="relative border shadow-2xl"
      style={{
        overflow: "hidden",
        borderColor: isFirst
          ? "oklch(0.50 0.20 285 / 0.45)"
          : "var(--asc-line-soft)",
        background: isFirst
          ? "linear-gradient(180deg, oklch(0.18 0.10 285 / 0.62) 0%, var(--asc-bg-1) 100%)"
          : "var(--asc-bg-1)",
        boxShadow: isFirst
          ? "0 24px 70px oklch(0.50 0.20 285 / 0.18)"
          : "0 18px 48px oklch(0.05 0.02 285 / 0.34)",
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
        marginBottom: visualPlace !== 1 ? 24 : 0,
        minHeight: isFirst ? 286 : 244,
        padding: isFirst ? "32px 20px" : "20px",
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -10,
          right: -8,
          color: "oklch(1 0 0)",
          fontFamily: "var(--font-display)",
          fontSize: ghostSize,
          fontWeight: 700,
          lineHeight: 0.9,
          letterSpacing: "-0.02em",
          opacity: 0.04,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        0{visualPlace}
      </div>
      {isFirst && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            background:
              "radial-gradient(circle, var(--asc-accent-glow) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative flex items-center gap-2">
        <span
          className="font-black"
          style={{
            color: rankTone,
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1,
            textShadow: isFirst ? `0 0 24px ${rankTone}` : "none",
          }}
        >
          #{visualPlace}
        </span>
        {isFirst && (
          <span style={{ color: rankTone }}>
            <CrownIcon />
          </span>
        )}
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        <LeaderboardAvatar name={team.name} size={isFirst ? 64 : 52} />
        <div className="min-w-0">
          <p
            className="truncate font-black uppercase"
            style={{
              color: "var(--asc-fg-0)",
              fontSize: isFirst ? 22 : 18,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "0.04em",
              lineHeight: 1.1,
            }}
          >
            {team.name}
          </p>
          <div className="mt-2">
            <TierBadge tier={team.tier} />
          </div>
        </div>
      </div>

      <p className="relative mt-4 text-sm" style={{ color: "var(--asc-fg-3)" }}>
        {messages.ledBy} {team.leaderName ?? "-"} - {team.membersCount}{" "}
        {getMemberLabel(team.membersCount, messages)}
      </p>

      <div
        style={{
          margin: "16px 0",
          height: 1,
          background: "var(--asc-line-soft)",
        }}
      />

      <div className="relative grid grid-cols-3 gap-3">
        <div>
          <p
            className="asc-leaderboard-stat-label text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {messages.points}
          </p>
          <p
            className="mt-1 font-black tabular-nums"
            style={{
              color: "var(--asc-accent)",
              fontSize: isFirst ? 24 : 20,
              fontFamily: "var(--font-display)",
            }}
          >
            {team.tournamentPoints.toLocaleString()}
          </p>
        </div>
        <div>
          <p
            className="asc-leaderboard-stat-label text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {messages.results}
          </p>
          <p
            className="mt-1 font-black tabular-nums"
            style={{
              color: "var(--asc-fg-0)",
              fontSize: isFirst ? 24 : 20,
              fontFamily: "var(--font-display)",
            }}
          >
            {team.tournamentResults}
          </p>
        </div>
        <div>
          <p
            className="asc-leaderboard-stat-label text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {messages.best}
          </p>
          <p
            className="mt-1 font-black tabular-nums"
            style={{
              color: "var(--asc-fg-0)",
              fontSize: isFirst ? 24 : 20,
              fontFamily: "var(--font-display)",
            }}
          >
            {team.bestPlacement ? `#${team.bestPlacement}` : "-"}
          </p>
        </div>
      </div>
    </article>
  );
}

function getPodiumEntries(teams: LeaderboardTeam[]): TeamPodiumEntry[] {
  const topThree = teams.slice(0, 3);

  if (topThree.length >= 3) {
    return [
      { team: topThree[1], visualPlace: 2 },
      { team: topThree[0], visualPlace: 1 },
      { team: topThree[2], visualPlace: 3 },
    ];
  }

  if (topThree.length === 2) {
    return [
      { team: topThree[1], visualPlace: 2 },
      { team: topThree[0], visualPlace: 1 },
    ];
  }

  if (topThree.length === 1) {
    return [{ team: topThree[0], visualPlace: 1 }];
  }

  return [];
}

function PodiumSection({
  teams,
  messages,
}: TeamLeaderboardTableProps) {
  const podiumEntries = getPodiumEntries(teams);

  if (podiumEntries.length === 0) {
    return null;
  }

  const gridClassName =
    podiumEntries.length === 1
      ? "grid gap-4 lg:mx-auto lg:max-w-[460px]"
      : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end";

  return (
    <section className="mb-8">
      <div className={gridClassName}>
        {podiumEntries.map(({ team, visualPlace }) => (
          <PodiumCard
            key={team.id}
            team={team}
            messages={messages}
            visualPlace={visualPlace}
          />
        ))}
      </div>
    </section>
  );
}

export default function TeamLeaderboardTable({
  teams,
  messages,
}: TeamLeaderboardTableProps) {
  const remaining = teams.slice(3);

  return (
    <>
      <PodiumSection teams={teams} messages={messages} />

      {remaining.length > 0 && (
        <div className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.16em]"
                style={{
                  color: "var(--asc-accent)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                Ranks 4 &ndash; 100
              </p>
              <h2 className="mt-1 text-3xl" style={{ color: "var(--asc-fg-0)" }}>
                Ascendra Ladder
              </h2>
            </div>
          </div>

          <section
            className="relative border shadow-2xl"
            style={{
              overflow: "hidden",
              borderColor: "var(--asc-line-soft)",
              background: "var(--asc-bg-1)",
              clipPath:
                "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
            }}
          >
            <div aria-hidden="true" className="asc-corner-mark" />
            <div
              className="hidden px-[18px] py-[10px] text-[10px] font-black uppercase tracking-[0.16em] md:grid md:grid-cols-[64px_minmax(0,1fr)_130px_110px_120px_120px]"
              style={{
                borderBottom: "1px solid var(--asc-line-soft)",
                background: "oklch(0.08 0.03 285)",
                color: "var(--asc-fg-3)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <span>{messages.rank}</span>
              <span>{messages.team}</span>
              <span>{messages.tier}</span>
              <span>{messages.points}</span>
              <span>{messages.results}</span>
              <span>{messages.best}</span>
            </div>

            <div>
              {remaining.map((team) => (
                <RankingRow key={team.id} team={team} messages={messages} />
              ))}
            </div>
          </section>
        </div>
      )}

      {teams.length === 0 && (
        <div className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
          {messages.noRankedTeams}
        </div>
      )}
    </>
  );
}

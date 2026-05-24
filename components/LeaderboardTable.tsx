import type { LeaderboardUser } from "@/data/leaderboard";
import type { LeaderboardMessages } from "@/lib/i18n";
import Sparkline from "@/components/ui/Sparkline";
import TierBadge from "@/components/ui/TierBadge";

function generateTrend(points: number, rank: number, len = 9): number[] {
  return Array.from({ length: len }, (_, k) => {
    const base = points * 0.72;
    const wave = Math.sin(k * 1.3 + rank * 0.8) * points * 0.10;
    const rise = (k / (len - 1)) * points * 0.28;
    return Math.round(Math.max(0, base + wave + rise));
  });
}

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="text-xs font-black" style={{ color: "var(--asc-fg-3)" }}>
        —
      </span>
    );
  }
  const up = value > 0;
  return (
    <span className="text-xs font-black" style={{ color: up ? "var(--asc-green)" : "var(--asc-live)" }}>
      {up ? "+" : ""}{value}
    </span>
  );
}

type LeaderboardTableProps = {
  users: LeaderboardUser[];
  messages: LeaderboardMessages["table"];
  currentUserId?: string;
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "red" | "gray" | "violet";
}) {
  const styleMap: Record<string, React.CSSProperties> = {
    green:  { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
    blue:   { color: "var(--asc-blue)",  borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    red:    { color: "var(--asc-live)",  borderColor: "oklch(0.50 0.20 25 / 0.5)",  background: "oklch(0.25 0.18 25 / 0.18)" },
    gray:   { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)",         background: "transparent" },
    violet: { color: "var(--asc-accent)",borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
  };

  return (
    <span className="inline-flex w-fit border px-3 py-1 text-xs font-black" style={styleMap[tone]}>
      {children}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const tone = rank === 1 ? "green" : rank <= 3 ? "blue" : "violet";
  return <Pill tone={tone}>#{rank}</Pill>;
}

function getResultLabel(count: number, messages: LeaderboardMessages["table"]) {
  return count === 1 ? messages.resultSingular : messages.resultPlural;
}

function RankingRow({
  user,
  messages,
  isCurrentUser,
}: {
  user: LeaderboardUser;
  messages: LeaderboardMessages["table"];
  isCurrentUser: boolean;
}) {
  const trend = generateTrend(user.tournamentPoints, user.rank);
  const delta = Math.round(trend[trend.length - 1] - trend[0]);

  return (
    <article
      className="grid gap-4 px-5 py-4 transition md:grid-cols-[64px_minmax(0,1fr)_120px_100px_110px_72px_56px_120px] md:items-center"
      style={{
        borderBottom: "1px solid var(--asc-line-soft)",
        background: isCurrentUser ? "oklch(0.20 0.12 285 / 0.15)" : "transparent",
        borderLeft: isCurrentUser ? "2px solid var(--asc-accent)" : "2px solid transparent",
      }}
    >
      <RankBadge rank={user.rank} />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>{user.username}</p>
          {isCurrentUser && (
            <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-accent)" }}>
              YOU
            </span>
          )}
        </div>
        <div className="mt-2 md:hidden">
          <TierBadge rank={user.rank} />
        </div>
      </div>

      <div className="hidden md:block">
        <TierBadge rank={user.rank} />
      </div>

      <p className="text-sm tabular-nums" style={{ color: "var(--asc-fg-0)" }}>
        <span className="font-black">{user.tournamentPoints.toLocaleString()}</span>
        <span className="ml-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>pts</span>
      </p>

      <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
        <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>{user.tournamentResults}</span>{" "}
        {getResultLabel(user.tournamentResults, messages)}
      </p>

      <div className="hidden md:flex md:items-center">
        <Sparkline values={trend} id={user.id.toString()} width={64} height={18} />
      </div>

      <div className="hidden md:flex md:items-center">
        <Delta value={delta} />
      </div>

      <Pill tone="blue">
        {messages.best} {user.bestPlacement ? `#${user.bestPlacement}` : "-"}
      </Pill>
    </article>
  );
}

function PodiumCard({
  user,
  messages,
  isCurrentUser,
}: {
  user: LeaderboardUser;
  messages: LeaderboardMessages["table"];
  isCurrentUser: boolean;
}) {
  const rank = user.rank;
  const accentColor =
    rank === 1 ? "oklch(0.84 0.14 85)"
    : rank === 2 ? "oklch(0.78 0.04 290)"
    : "oklch(0.68 0.12 50)";

  const cardBorder =
    rank === 1
      ? "oklch(0.84 0.14 85 / 0.35)"
      : "var(--asc-line-soft)";

  const cardBg =
    rank === 1
      ? "linear-gradient(180deg, oklch(0.18 0.10 285 / 0.5) 0%, var(--asc-bg-1) 100%)"
      : "var(--asc-bg-1)";

  return (
    <article
      className="relative overflow-hidden border p-5 shadow-2xl"
      style={{
        borderColor: cardBorder,
        background: cardBg,
        marginBottom: rank !== 1 ? 24 : 0,
      }}
    >
      {/* L-bracket corner mark */}
      <div aria-hidden="true" className="asc-corner-mark" />

      {/* Ghost rank number */}
      <div aria-hidden="true" className="asc-corner-mark" />

      {/* Accent glow — rank 1 only */}
      {rank === 1 && <div aria-hidden="true" className="asc-corner-mark" />}

      {/* Rank number */}
      <div className="relative flex items-center gap-2">
        <span
          className="font-black"
          style={{
            fontSize: 32,
            color: accentColor,
            textShadow: rank === 1 ? `0 0 20px ${accentColor}` : "none",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          #{rank}
        </span>
      </div>

      {/* Avatar + username */}
      <div className="relative mt-5 flex items-center gap-3">
        <div
          className="flex shrink-0 items-center justify-center font-black uppercase"
          style={{
            width: rank === 1 ? 64 : 52,
            height: rank === 1 ? 64 : 52,
            background:
              "linear-gradient(135deg, oklch(0.55 0.22 285), oklch(0.30 0.16 325))",
            color: "oklch(0.97 0.01 290)",
            fontSize: rank === 1 ? 20 : 16,
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className="truncate font-black uppercase"
              style={{
                color: "var(--asc-fg-0)",
                fontSize: rank === 1 ? 22 : 18,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.04em",
                lineHeight: 1.1,
              }}
            >
              {user.username}
            </p>
            {isCurrentUser && (
              <span
                className="text-[9px] font-black uppercase tracking-[0.14em]"
                style={{ color: "var(--asc-accent)" }}
              >
                YOU
              </span>
            )}
          </div>
          <p
            className="mt-1 text-[10px] font-black uppercase tracking-[0.10em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            GLOBAL
          </p>
        </div>
      </div>

      <div
        style={{
          margin: "16px 0",
          height: 1,
          background: "var(--asc-line-soft)",
        }}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            PTS
          </p>
          <p
            className="mt-1 font-black tabular-nums"
            style={{
              color: "var(--asc-accent)",
              fontSize: rank === 1 ? 24 : 20,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {user.tournamentPoints.toLocaleString()}
          </p>
        </div>
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {messages.results}
          </p>
          <p
            className="mt-1 font-black tabular-nums"
            style={{
              color: "var(--asc-fg-0)",
              fontSize: rank === 1 ? 24 : 20,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {user.tournamentResults}
          </p>
        </div>
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--asc-fg-3)" }}
          >
            {messages.best}
          </p>
          <p
            className="mt-1 font-black tabular-nums"
            style={{
              color: "var(--asc-fg-0)",
              fontSize: rank === 1 ? 24 : 20,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {user.bestPlacement ? `#${user.bestPlacement}` : "–"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <TierBadge rank={rank} />
      </div>
    </article>
  );
}

export default function LeaderboardTable({
  users,
  messages,
  currentUserId,
}: LeaderboardTableProps) {
  const topThree = users.slice(0, 3);
  const remaining = users.slice(3);

  // Render podium 2nd · 1st · 3rd — aligned to bottom via marginBottom on 2nd/3rd
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(
    (u): u is LeaderboardUser => u !== undefined,
  );

  return (
    <section
      className="overflow-hidden border shadow-2xl"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
          {messages.playerRanking}
        </p>
        <h2 className="mt-1 text-xl" style={{ color: "var(--asc-fg-0)" }}>
          {messages.standings}
        </h2>
      </div>

      {topThree.length > 0 && (
        <div
          className="p-5"
          style={{
            borderBottom: "1px solid var(--asc-line-soft)",
            display: "grid",
            gridTemplateColumns: topThree.length === 3 ? "1fr 1.15fr 1fr" : `repeat(${topThree.length}, 1fr)`,
            gap: 12,
            alignItems: "end",
          }}
        >
          {podiumOrder.map((user) => (
            <PodiumCard
              key={user.id}
              user={user}
              messages={messages}
              isCurrentUser={currentUserId !== undefined && String(user.id) === currentUserId}
            />
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div>
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] md:grid md:grid-cols-[64px_minmax(0,1fr)_120px_100px_110px_72px_56px_120px]"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
          >
            <span>#</span>
            <span>{messages.player}</span>
            <span>Tier</span>
            <span>PTS</span>
            <span>{messages.results}</span>
            <span>Trend</span>
            <span>Δ7D</span>
            <span>{messages.best}</span>
          </div>

          <div>
            {remaining.map((user) => (
              <RankingRow
                key={user.id}
                user={user}
                messages={messages}
                isCurrentUser={currentUserId !== undefined && String(user.id) === currentUserId}
              />
            ))}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
          {messages.noRankedPlayers}
        </div>
      )}
    </section>
  );
}

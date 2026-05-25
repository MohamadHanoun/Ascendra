import LeaderboardAvatar from "@/components/LeaderboardAvatar";
import type { LeaderboardUser } from "@/data/leaderboard";
import type { LeaderboardMessages } from "@/lib/i18n";

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

function RankBadge({ rank }: { rank: number }) {
  const tone = rank === 1 ? "green" : rank <= 3 ? "blue" : "violet";
  return <Pill tone={tone}>#{rank}</Pill>;
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
  return (
    <article
      className="grid gap-4 px-5 py-4 transition md:grid-cols-[64px_minmax(0,1fr)_130px_110px_120px_120px] md:items-center"
      style={{
        borderBottom: "1px solid var(--asc-line-soft)",
        background: isCurrentUser ? "oklch(0.20 0.12 285 / 0.15)" : "transparent",
        borderLeft: isCurrentUser
          ? "2px solid var(--asc-accent)"
          : "2px solid transparent",
      }}
    >
      <RankBadge rank={user.rank} />

      <div className="flex min-w-0 items-center gap-3">
        <LeaderboardAvatar name={user.username} src={user.avatar} size={38} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>
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
          <div className="mt-2 md:hidden">
            <TierBadge tier={user.tier} />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <TierBadge tier={user.tier} />
      </div>

      <p className="text-sm tabular-nums" style={{ color: "var(--asc-fg-0)" }}>
        <span className="font-black">{user.tournamentPoints.toLocaleString()}</span>
        <span className="ml-1 text-xs" style={{ color: "var(--asc-fg-3)" }}>
          {messages.pointsSuffix}
        </span>
      </p>

      <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
        <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>
          {user.tournamentResults}
        </span>{" "}
        {getResultLabel(user.tournamentResults, messages)}
      </p>

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
  const isFirst = rank === 1;

  return (
    <article
      className="relative overflow-hidden border p-5 shadow-2xl"
      style={{
        borderColor: isFirst ? "oklch(0.50 0.20 285 / 0.45)" : "var(--asc-line-soft)",
        background: isFirst
          ? "linear-gradient(180deg, oklch(0.18 0.10 285 / 0.5) 0%, var(--asc-bg-1) 100%)"
          : "var(--asc-bg-1)",
        marginBottom: rank !== 1 ? 24 : 0,
      }}
    >
      <div aria-hidden="true" className="asc-corner-mark" />

      <div className="relative flex items-center gap-2">
        <span
          className="font-black"
          style={{
            fontSize: 32,
            color: isFirst ? "var(--asc-accent)" : "var(--asc-fg-0)",
            textShadow: isFirst ? "0 0 20px var(--asc-accent)" : "none",
            fontFamily: "var(--font-display)",
            lineHeight: 1,
          }}
        >
          #{rank}
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        <LeaderboardAvatar
          name={user.username}
          src={user.avatar}
          size={rank === 1 ? 64 : 52}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className="truncate font-black uppercase"
              style={{
                color: "var(--asc-fg-0)",
                fontSize: rank === 1 ? 22 : 18,
                fontFamily: "var(--font-display)",
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
          <div className="mt-2">
            <TierBadge tier={user.tier} />
          </div>
        </div>
      </div>

      <div
        style={{
          margin: "16px 0",
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
            {messages.points}
          </p>
          <p
            className="mt-1 font-black tabular-nums"
            style={{
              color: "var(--asc-accent)",
              fontSize: rank === 1 ? 24 : 20,
              fontFamily: "var(--font-display)",
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
              fontFamily: "var(--font-display)",
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
              fontFamily: "var(--font-display)",
            }}
          >
            {user.bestPlacement ? `#${user.bestPlacement}` : "-"}
          </p>
        </div>
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
  const podiumOrder =
    topThree.length === 3
      ? [topThree[1], topThree[0], topThree[2]]
      : topThree;

  return (
    <section
      className="overflow-hidden border shadow-2xl"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
      >
        <p
          className="text-xs font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          {messages.playerRanking}
        </p>
        <h2 className="mt-1 text-xl" style={{ color: "var(--asc-fg-0)" }}>
          {messages.standings}
        </h2>
      </div>

      {topThree.length > 0 && (
        <div
          className="grid gap-4 p-5 lg:items-end"
          style={{
            borderBottom: "1px solid var(--asc-line-soft)",
            gridTemplateColumns:
              topThree.length === 3 ? "1fr 1.15fr 1fr" : undefined,
          }}
        >
          {podiumOrder.map((user) => (
            <PodiumCard
              key={user.id}
              user={user}
              messages={messages}
              isCurrentUser={
                currentUserId !== undefined && String(user.id) === currentUserId
              }
            />
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div>
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] md:grid md:grid-cols-[64px_minmax(0,1fr)_130px_110px_120px_120px]"
            style={{
              borderBottom: "1px solid var(--asc-line-soft)",
              background: "var(--asc-bg-2)",
              color: "var(--asc-fg-3)",
            }}
          >
            <span>{messages.rank}</span>
            <span>{messages.player}</span>
            <span>{messages.tier}</span>
            <span>{messages.points}</span>
            <span>{messages.results}</span>
            <span>{messages.best}</span>
          </div>

          <div>
            {remaining.map((user) => (
              <RankingRow
                key={user.id}
                user={user}
                messages={messages}
                isCurrentUser={
                  currentUserId !== undefined && String(user.id) === currentUserId
                }
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

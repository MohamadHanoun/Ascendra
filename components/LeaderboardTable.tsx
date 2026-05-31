import LeaderboardAvatar from "@/components/LeaderboardAvatar";
import type { LeaderboardUser } from "@/data/leaderboard";
import type { LeaderboardMessages } from "@/lib/i18n";

type LeaderboardTableProps = {
  users: LeaderboardUser[];
  messages: LeaderboardMessages["table"];
  currentUserId?: string;
};

type PodiumEntry = {
  user: LeaderboardUser;
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
      borderColor: "var(--asc-green-border)",
      background: "var(--asc-green-bg)",
    },
    blue: {
      color: "var(--asc-blue)",
      borderColor: "var(--asc-blue-border)",
      background: "var(--asc-blue-bg)",
    },
    gray: {
      color: "var(--asc-fg-3)",
      borderColor: "var(--asc-line-soft)",
      background: "transparent",
    },
    violet: {
      color: "var(--asc-accent)",
      borderColor: "var(--asc-accent-border)",
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
        borderColor: "var(--asc-accent-border)",
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
      className="asc-leaderboard-row grid gap-4 px-[18px] py-3 md:grid-cols-[64px_minmax(0,1fr)_130px_110px_120px_120px] md:items-center"
      style={{
        borderBottom: "1px solid var(--asc-line-soft)",
        background: isCurrentUser ? "var(--asc-accent-dim)" : undefined,
        borderLeft: isCurrentUser
          ? "2px solid var(--asc-accent)"
          : "2px solid transparent",
      }}
    >
      <span
        className="text-xs font-black tabular-nums"
        style={{
          color: "var(--asc-fg-3)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {String(user.rank).padStart(2, "0")}
      </span>

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
                {messages.youBadge}
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
  visualPlace,
}: {
  user: LeaderboardUser;
  messages: LeaderboardMessages["table"];
  isCurrentUser: boolean;
  visualPlace: 1 | 2 | 3;
}) {
  const isFirst = visualPlace === 1;
  const rankTone = isFirst
    ? "var(--asc-accent)"
    : visualPlace === 2
      ? "var(--asc-fg-2)"
      : "var(--asc-fg-3)";
  const ghostSize = isFirst ? 200 : 140;

  return (
    <article
      className="relative border shadow-2xl"
      style={{
        overflow: "hidden",
        borderColor: isFirst
          ? "var(--asc-accent-border-strong)"
          : "var(--asc-line-soft)",
        background: isFirst
          ? "linear-gradient(180deg, var(--asc-accent-dim) 0%, var(--asc-bg-1) 100%)"
          : "var(--asc-bg-1)",
        boxShadow: isFirst
          ? "0 24px 70px var(--asc-accent-glow)"
          : "var(--asc-shadow)",
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
          color: "var(--asc-accent)",
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
        <LeaderboardAvatar
          name={user.username}
          src={user.avatar}
          size={isFirst ? 64 : 52}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
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
              {user.username}
            </p>
            {isCurrentUser && (
              <span
                className="text-[9px] font-black uppercase tracking-[0.14em]"
                style={{ color: "var(--asc-accent)" }}
              >
                {messages.youBadge}
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
            {user.tournamentPoints.toLocaleString()}
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
            {user.tournamentResults}
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
            {user.bestPlacement ? `#${user.bestPlacement}` : "-"}
          </p>
        </div>
      </div>
    </article>
  );
}

function getPodiumEntries(users: LeaderboardUser[]): PodiumEntry[] {
  const topThree = users.slice(0, 3);

  if (topThree.length >= 3) {
    return [
      { user: topThree[1], visualPlace: 2 },
      { user: topThree[0], visualPlace: 1 },
      { user: topThree[2], visualPlace: 3 },
    ];
  }

  if (topThree.length === 2) {
    return [
      { user: topThree[1], visualPlace: 2 },
      { user: topThree[0], visualPlace: 1 },
    ];
  }

  if (topThree.length === 1) {
    return [{ user: topThree[0], visualPlace: 1 }];
  }

  return [];
}

function PodiumSection({
  users,
  messages,
  currentUserId,
}: LeaderboardTableProps) {
  const podiumEntries = getPodiumEntries(users);

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
        {podiumEntries.map(({ user, visualPlace }) => (
          <PodiumCard
            key={user.id}
            user={user}
            messages={messages}
            visualPlace={visualPlace}
            isCurrentUser={
              currentUserId !== undefined && String(user.id) === currentUserId
            }
          />
        ))}
      </div>
    </section>
  );
}

export default function LeaderboardTable({
  users,
  messages,
  currentUserId,
}: LeaderboardTableProps) {
  const remaining = users.slice(3);

  return (
    <>
      <PodiumSection
        users={users}
        messages={messages}
        currentUserId={currentUserId}
      />

      {remaining.length > 0 && (
        <div className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="asc-section-label">
                {messages.ranksLabel}
              </p>
              <h2 className="mt-1 text-3xl" style={{ color: "var(--asc-fg-0)" }}>
                {messages.ladderTitle}
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
                background: "var(--asc-table-head-bg)",
                color: "var(--asc-fg-3)",
                fontFamily: "var(--font-mono, monospace)",
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
                    currentUserId !== undefined &&
                    String(user.id) === currentUserId
                  }
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {users.length === 0 && (
        <div className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
          {messages.noRankedPlayers}
        </div>
      )}
    </>
  );
}

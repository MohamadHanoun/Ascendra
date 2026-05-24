import type { LeaderboardTeam } from "@/data/leaderboard";
import type { LeaderboardMessages } from "@/lib/i18n";

type TeamLeaderboardTableProps = {
  teams: LeaderboardTeam[];
  messages: LeaderboardMessages["table"];
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "gray" | "violet";
}) {
  const styleMap: Record<string, React.CSSProperties> = {
    green: { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" },
    blue: { color: "var(--asc-blue)", borderColor: "oklch(0.55 0.12 220 / 0.5)", background: "oklch(0.25 0.10 220 / 0.18)" },
    gray: { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" },
    violet: { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" },
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
      className="grid gap-4 px-5 py-4 transition md:grid-cols-[80px_minmax(0,1fr)_130px_130px_100px_110px_120px] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <RankBadge rank={team.rank} />

      <div className="min-w-0">
        <p className="truncate font-black" style={{ color: "var(--asc-fg-0)" }}>{team.name}</p>
        <p className="mt-1 text-sm md:hidden" style={{ color: "var(--asc-fg-3)" }}>
          {team.game} · {messages.ledBy} {team.leaderName}
        </p>
      </div>

      <Pill tone="violet">{team.game}</Pill>

      <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>{team.leaderName}</p>

      <p className="text-sm" style={{ color: "var(--asc-fg-2)" }}>
        <span className="font-black" style={{ color: "var(--asc-fg-0)" }}>{team.membersCount}</span>{" "}
        {getMemberLabel(team.membersCount, messages)}
      </p>

      <Pill tone="blue">
        {messages.best} {team.bestPlacement ? `#${team.bestPlacement}` : "-"}
      </Pill>

      <Pill tone="green">
        {team.tournamentPoints.toLocaleString()} {messages.pointsSuffix}
      </Pill>
    </article>
  );
}

function PodiumCard({
  team,
  messages,
}: {
  team: LeaderboardTeam;
  messages: LeaderboardMessages["table"];
}) {
  const isFirst = team.rank === 1;

  return (
    <article
      className="border p-5 shadow-2xl"
      style={
        isFirst
          ? { borderColor: "oklch(0.55 0.14 150 / 0.4)", background: "oklch(0.25 0.12 150 / 0.10)" }
          : { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }
      }
    >
      <div className="flex items-center justify-between gap-3">
        <RankBadge rank={team.rank} />
        <Pill tone="violet">{team.game}</Pill>
      </div>

      <p className="mt-5 truncate text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>
        {team.name}
      </p>

      <p className="mt-1 text-sm" style={{ color: "var(--asc-fg-3)" }}>
        {messages.ledBy} {team.leaderName} · {team.membersCount}{" "}
        {getMemberLabel(team.membersCount, messages)}
      </p>

      <div className="mt-5">
        <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
          {messages.points}
        </p>
        <p className="mt-1 text-3xl font-black" style={{ color: "var(--asc-green)" }}>
          {team.tournamentPoints.toLocaleString()}
        </p>
      </div>
    </article>
  );
}

export default function TeamLeaderboardTable({
  teams,
  messages,
}: TeamLeaderboardTableProps) {
  const topThree = teams.slice(0, 3);
  const remaining = teams.slice(3);

  return (
    <section
      className="overflow-hidden border shadow-2xl"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
          {messages.teamRanking}
        </p>
        <h2 className="mt-1 text-xl" style={{ color: "var(--asc-fg-0)" }}>
          {messages.standings}
        </h2>
      </div>

      {topThree.length > 0 && (
        <div className="grid gap-4 p-5 lg:grid-cols-3" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
          {topThree.map((team) => (
            <PodiumCard key={team.id} team={team} messages={messages} />
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div>
          <div
            className="hidden px-5 py-3 text-xs font-black uppercase tracking-[0.14em] md:grid md:grid-cols-[80px_minmax(0,1fr)_130px_130px_100px_110px_120px]"
            style={{ borderBottom: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-2)", color: "var(--asc-fg-3)" }}
          >
            <span>{messages.rank}</span>
            <span>{messages.team}</span>
            <span>{messages.game}</span>
            <span>{messages.leader}</span>
            <span>{messages.members}</span>
            <span>{messages.best}</span>
            <span>{messages.points}</span>
          </div>

          <div>
            {remaining.map((team) => (
              <RankingRow key={team.id} team={team} messages={messages} />
            ))}
          </div>
        </div>
      )}

      {teams.length === 0 && (
        <div className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
          {messages.noRankedTeams}
        </div>
      )}
    </section>
  );
}

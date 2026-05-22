import type { LeaderboardUser } from "@/data/leaderboard";
import type { LeaderboardMessages } from "@/lib/i18n";

type LeaderboardTableProps = {
  users: LeaderboardUser[];
  messages: LeaderboardMessages["table"];
};

function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "blue" | "red" | "gray" | "violet";
}) {
  const styles = {
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    blue: "border-sky-400/25 bg-sky-500/10 text-sky-300",
    red: "border-red-400/25 bg-red-500/10 text-red-300",
    gray: "border-white/10 bg-white/5 text-gray-300",
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const tone = rank === 1 ? "green" : rank <= 3 ? "blue" : "violet";

  return <Pill tone={tone}>#{rank}</Pill>;
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Pill tone={role.toLowerCase() === "admin" ? "red" : "violet"}>{role}</Pill>
  );
}

function getResultLabel(count: number, messages: LeaderboardMessages["table"]) {
  return count === 1 ? messages.resultSingular : messages.resultPlural;
}

function RankingRow({
  user,
  messages,
}: {
  user: LeaderboardUser;
  messages: LeaderboardMessages["table"];
}) {
  return (
    <article className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] md:grid-cols-[80px_minmax(0,1fr)_110px_100px_110px_120px] md:items-center">
      <RankBadge rank={user.rank} />

      <div className="min-w-0">
        <p className="truncate font-black text-white">{user.username}</p>

        <div className="mt-2 md:hidden">
          <RoleBadge role={user.role} />
        </div>
      </div>

      <div className="hidden md:block">
        <RoleBadge role={user.role} />
      </div>

      <p className="text-sm text-gray-300">
        <span className="font-black text-white">{user.tournamentResults}</span>{" "}
        {getResultLabel(user.tournamentResults, messages)}
      </p>

      <Pill tone="blue">
        {messages.best} {user.bestPlacement ? `#${user.bestPlacement}` : "-"}
      </Pill>

      <Pill tone="green">
        {user.tournamentPoints.toLocaleString()} {messages.pointsSuffix}
      </Pill>
    </article>
  );
}

function PodiumCard({
  user,
  messages,
}: {
  user: LeaderboardUser;
  messages: LeaderboardMessages["table"];
}) {
  const isFirst = user.rank === 1;

  return (
    <article
      className={`rounded-3xl border p-5 shadow-2xl ${
        isFirst
          ? "border-emerald-400/25 bg-emerald-500/[0.08] shadow-emerald-950/20"
          : "border-white/10 bg-black/20 shadow-black/20"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <RankBadge rank={user.rank} />
        <RoleBadge role={user.role} />
      </div>

      <p className="mt-5 truncate text-2xl font-black text-white">
        {user.username}
      </p>

      <p className="mt-1 text-sm text-gray-500">
        {user.tournamentResults}{" "}
        {getResultLabel(user.tournamentResults, messages)} · {messages.best}{" "}
        {user.bestPlacement ? `#${user.bestPlacement}` : "-"}
      </p>

      <div className="mt-5">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
          {messages.points}
        </p>

        <p className="mt-1 text-3xl font-black text-emerald-300">
          {user.tournamentPoints.toLocaleString()}
        </p>
      </div>
    </article>
  );
}

export default function LeaderboardTable({
  users,
  messages,
}: LeaderboardTableProps) {
  const topThree = users.slice(0, 3);
  const remaining = users.slice(3);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
          {messages.playerRanking}
        </p>

        <h2 className="mt-1 text-xl font-black text-white">
          {messages.standings}
        </h2>
      </div>

      {topThree.length > 0 && (
        <div className="grid gap-4 border-b border-white/10 p-5 lg:grid-cols-3">
          {topThree.map((user) => (
            <PodiumCard key={user.id} user={user} messages={messages} />
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div>
          <div className="hidden border-b border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500 md:grid md:grid-cols-[80px_minmax(0,1fr)_110px_100px_110px_120px]">
            <span>{messages.rank}</span>
            <span>{messages.player}</span>
            <span>{messages.role}</span>
            <span>{messages.results}</span>
            <span>{messages.best}</span>
            <span>{messages.points}</span>
          </div>

          <div className="divide-y divide-white/10">
            {remaining.map((user) => (
              <RankingRow key={user.id} user={user} messages={messages} />
            ))}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="p-5 text-sm text-gray-400">
          {messages.noRankedPlayers}
        </div>
      )}
    </section>
  );
}

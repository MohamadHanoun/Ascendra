import type { LeaderboardUser } from "@/data/leaderboard";

type LeaderboardTableProps = {
  users: LeaderboardUser[];
};

export default function LeaderboardTable({ users }: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="hidden grid-cols-5 border-b border-white/10 px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-400 md:grid">
        <span>Rank</span>
        <span>User</span>
        <span>Role</span>
        <span>Level</span>
        <span>XP</span>
      </div>

      <div className="divide-y divide-white/10">
        {users.map((user) => (
          <div
            key={user.id}
            className="grid gap-4 px-6 py-5 text-gray-300 md:grid-cols-5 md:items-center"
          >
            <p className="text-2xl font-black text-indigo-400">#{user.rank}</p>

            <div>
              <p className="font-bold text-white">{user.username}</p>
              <p className="text-sm text-gray-500 md:hidden">{user.role}</p>
            </div>

            <p className="hidden md:block">{user.role}</p>

            <p>
              <span className="font-semibold text-white">Level </span>
              {user.level}
            </p>

            <p>{user.xp.toLocaleString()} XP</p>
          </div>
        ))}
      </div>
    </div>
  );
}
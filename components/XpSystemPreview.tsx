import LeaderboardInfoCard from "@/components/LeaderboardInfoCard";

const xpItems = [
  {
    title: "XP From Activity",
    description:
      "The RTN bot will later track member activity and reward XP for useful participation inside the Discord server.",
  },
  {
    title: "Level Progression",
    description:
      "Members will be able to level up over time and unlock future roles, rewards, or tournament benefits.",
  },
  {
    title: "Live Ranking",
    description:
      "The leaderboard will later use real data from the database instead of placeholder users.",
  },
];

export default function XpSystemPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <h2 className="mb-10 text-4xl font-black">Future RTN XP System</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {xpItems.map((item) => (
          <LeaderboardInfoCard
            key={item.title}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </section>
  );
}
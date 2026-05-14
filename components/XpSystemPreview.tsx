export default function XpSystemPreview() {
  const items = [
    {
      title: "Message Activity",
      description:
        "The Discord bot will track activity and reward members with XP.",
    },
    {
      title: "Level Rewards",
      description:
        "Members can unlock future roles, badges, or tournament benefits.",
    },
    {
      title: "Live Leaderboard",
      description:
        "The website will show real ranking data from the database.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <h2 className="mb-10 text-4xl font-black">Future XP System</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-8"
          >
            <h3 className="mb-4 text-2xl font-bold">{item.title}</h3>
            <p className="leading-7 text-gray-300">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
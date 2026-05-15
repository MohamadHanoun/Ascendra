type ServerStat = {
  label: string;
  value: string;
};

type ServerStatsProps = {
  stats: ServerStat[];
};

export default function ServerStats({ stats }: ServerStatsProps) {
  return (
    <section id="stats" className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <p className="text-4xl font-black text-indigo-400">{item.value}</p>
            <p className="mt-2 text-gray-300">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
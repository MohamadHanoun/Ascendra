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
            className="asc-card border p-6"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <p className="text-4xl font-black" style={{ color: "var(--asc-accent)" }}>{item.value}</p>
            <p className="mt-2" style={{ color: "var(--asc-fg-2)" }}>{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

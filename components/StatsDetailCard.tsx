type StatsDetailCardProps = {
  title: string;
  value: string;
};

export default function StatsDetailCard({ title, value }: StatsDetailCardProps) {
  return (
    <article
      className="grid gap-3 p-5 transition md:grid-cols-[minmax(0,1fr)_120px] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
          Metric
        </p>

        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h2>
      </div>

      <p className="text-2xl font-black" style={{ color: "var(--asc-accent)" }}>{value}</p>
    </article>
  );
}

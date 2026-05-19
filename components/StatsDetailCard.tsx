type StatsDetailCardProps = {
  title: string;
  value: string;
};

export default function StatsDetailCard({
  title,
  value,
}: StatsDetailCardProps) {
  return (
    <article className="grid gap-3 p-5 transition hover:bg-white/[0.035] md:grid-cols-[minmax(0,1fr)_120px] md:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
          Metric
        </p>

        <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
      </div>

      <p className="text-2xl font-black text-violet-200">{value}</p>
    </article>
  );
}

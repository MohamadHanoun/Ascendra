type StatsDetailCardProps = {
  title: string;
  value: string;
  description: string;
};

export default function StatsDetailCard({
  title,
  value,
  description,
}: StatsDetailCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
        {title}
      </p>

      <h2 className="mt-4 text-4xl font-black text-white">{value}</h2>

      <p className="mt-4 text-sm leading-6 text-gray-400">{description}</p>
    </article>
  );
}

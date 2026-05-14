type LeaderboardInfoCardProps = {
  title: string;
  description: string;
};

export default function LeaderboardInfoCard({
  title,
  description,
}: LeaderboardInfoCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <p className="leading-7 text-gray-300">{description}</p>
    </article>
  );
}
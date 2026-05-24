type LeaderboardInfoCardProps = {
  title: string;
  description: string;
};

export default function LeaderboardInfoCard({ title, description }: LeaderboardInfoCardProps) {
  return (
    <article
      className="asc-card border p-8"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <h2 className="mb-4 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h2>
      <p className="leading-7" style={{ color: "var(--asc-fg-2)" }}>{description}</p>
    </article>
  );
}

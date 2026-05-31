type Tier = "Apex" | "Diamond" | "Platinum" | "Gold" | "Silver" | "Bronze";

function getTier(rank: number): Tier {
  if (rank <= 5) return "Apex";
  if (rank <= 15) return "Diamond";
  if (rank <= 30) return "Platinum";
  if (rank <= 50) return "Gold";
  if (rank <= 75) return "Silver";
  return "Bronze";
}

const tierStyles: Record<Tier, React.CSSProperties> = {
  Apex:     { color: "var(--asc-accent)",   borderColor: "var(--asc-accent-border)",  background: "var(--asc-accent-dim)" },
  Diamond:  { color: "var(--asc-blue)",     borderColor: "var(--asc-blue-border)",  background: "var(--asc-blue-bg)" },
  Platinum: { color: "oklch(0.78 0.10 175)",borderColor: "oklch(0.50 0.14 175 / 0.4)",  background: "oklch(0.20 0.08 175 / 0.18)" },
  Gold:     { color: "var(--asc-accent)", borderColor: "oklch(0.60 0.18 85 / 0.4)",   background: "oklch(0.25 0.12 85 / 0.18)" },
  Silver:   { color: "var(--asc-fg-2)",     borderColor: "var(--asc-line-soft)",          background: "var(--asc-bg-2)" },
  Bronze:   { color: "oklch(0.68 0.12 50)", borderColor: "oklch(0.50 0.14 50 / 0.4)",   background: "oklch(0.20 0.08 50 / 0.18)" },
};

export default function TierBadge({ rank }: { rank: number }) {
  const tier = getTier(rank);
  return (
    <span
      className="inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]"
      style={tierStyles[tier]}
    >
      ▲ {tier}
    </span>
  );
}

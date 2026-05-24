type RuleCardProps = {
  rule: string;
  index: number;
};

export default function RuleCard({ rule, index }: RuleCardProps) {
  return (
    <article
      className="grid gap-4 p-5 transition md:grid-cols-[90px_minmax(0,1fr)] md:items-start"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <span
        className="grid h-12 w-12 place-items-center text-lg font-black"
        style={{ border: "1px solid var(--asc-line)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
          Rule {index + 1}
        </p>
        <p className="mt-2 text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>{rule}</p>
      </div>
    </article>
  );
}

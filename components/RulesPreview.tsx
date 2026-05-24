type RulesPreviewProps = {
  rules: string[];
};

export default function RulesPreview({ rules }: RulesPreviewProps) {
  return (
    <section id="rules" className="mx-auto max-w-7xl px-6 pb-24">
      <div className="asc-card border p-8" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <h2 className="mb-6 text-4xl font-black" style={{ color: "var(--asc-fg-0)" }}>Basic Rules</h2>

        <ul className="space-y-4" style={{ color: "var(--asc-fg-2)" }}>
          {rules.map((rule, index) => (
            <li key={rule}>
              {String(index + 1).padStart(2, "0")}. {rule}
            </li>
          ))}
        </ul>

        <a
          href="/rules"
          className="mt-8 inline-block border px-6 py-3 font-bold transition hover:opacity-90"
          style={{ borderColor: "var(--asc-line)", color: "var(--asc-fg-2)", background: "transparent" }}
        >
          View All Rules
        </a>
      </div>
    </section>
  );
}

type RulesPreviewProps = {
  rules: string[];
};

export default function RulesPreview({ rules }: RulesPreviewProps) {
  return (
    <section id="rules" className="mx-auto max-w-7xl px-6 pb-24">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-6 text-4xl font-black">Basic Rules</h2>

        <ul className="space-y-4 text-gray-300">
          {rules.map((rule, index) => (
            <li key={rule}>
              {String(index + 1).padStart(2, "0")}. {rule}
            </li>
          ))}
        </ul>

        <a
          href="/rules"
          className="mt-8 inline-block rounded-xl border border-white/10 px-6 py-3 font-bold text-gray-200 transition hover:bg-white/10"
        >
          View All Rules
        </a>
      </div>
    </section>
  );
}
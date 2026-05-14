type RuleCardProps = {
  rule: string;
  index: number;
};

export default function RuleCard({ rule, index }: RuleCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10">
      <div className="mb-4 flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-xl font-black text-indigo-300">
          {String(index + 1).padStart(2, "0")}
        </span>

        <h2 className="text-xl font-bold">Server Rule</h2>
      </div>

      <p className="leading-7 text-gray-300">{rule}</p>
    </article>
  );
}
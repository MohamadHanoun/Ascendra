type RoleCardProps = {
  name: string;
  color: string;
  description: string;
};

export default function RoleCard({ name, color, description }: RoleCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:-translate-y-1 hover:bg-white/10">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400" />

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            RTN Role
          </p>

          <h2 className={`text-2xl font-bold ${color}`}>{name}</h2>
        </div>
      </div>

      <p className="leading-7 text-gray-300">{description}</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
      </div>
    </article>
  );
}
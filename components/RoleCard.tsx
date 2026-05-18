type RoleCardProps = {
  name: string;
  color: string;
  description: string;
};

function normalizeColor(color: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return "#22d3ee";
}

export default function RoleCard({ name, color, description }: RoleCardProps) {
  const roleColor = normalizeColor(color);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
      <div className="mb-5 flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-2xl border border-white/10"
          style={{ backgroundColor: roleColor }}
        />

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
            RTN Role
          </p>

          <h2 className="mt-1 text-2xl font-black text-white">{name}</h2>
        </div>
      </div>

      <p className="text-sm leading-6 text-gray-400">{description}</p>
    </article>
  );
}

type RoleCardProps = {
  name: string;
  color: string;
  description: string;
};

function normalizeColor(color: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return "#8b5cf6";
}

export default function RoleCard({ name, color, description }: RoleCardProps) {
  const roleColor = normalizeColor(color);

  return (
    <article
      className="grid gap-4 p-5 transition md:grid-cols-[90px_minmax(0,1fr)_minmax(0,1.4fr)] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <div
        className="h-12 w-12 border p-2"
        style={{ borderColor: "var(--asc-line)", background: "var(--asc-bg-2)" }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundColor: roleColor,
            boxShadow: `0 0 24px ${roleColor}55`,
          }}
        />
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
          Role
        </p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{name}</h2>
      </div>

      <p className="text-sm leading-6" style={{ color: "var(--asc-fg-2)" }}>{description}</p>
    </article>
  );
}

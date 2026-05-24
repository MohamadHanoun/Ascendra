type StaffCardProps = {
  name: string;
  role: string;
  status: string;
};

function getStatusStyle(status: string): React.CSSProperties {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "active" || normalizedStatus === "available") {
    return { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" };
  }

  if (normalizedStatus === "busy") {
    return { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" };
  }

  return { color: "var(--asc-fg-3)", borderColor: "var(--asc-line-soft)", background: "transparent" };
}

export default function StaffCard({ name, role, status }: StaffCardProps) {
  const initials = name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2);

  return (
    <article
      className="grid gap-4 p-5 transition md:grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)_130px] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <div
        className="relative grid h-12 w-12 place-items-center text-sm font-black"
        style={{ border: "1px solid oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
      >
        <span>{initials}</span>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
          Name
        </p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>{name}</h2>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
          Role
        </p>
        <p className="mt-1 text-sm font-black" style={{ color: "var(--asc-accent)" }}>{role}</p>
      </div>

      <span
        className="inline-flex w-fit border px-3 py-1 text-xs font-black capitalize"
        style={getStatusStyle(status)}
      >
        {status}
      </span>
    </article>
  );
}

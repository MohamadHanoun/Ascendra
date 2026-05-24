type AdminModuleCardProps = {
  title: string;
  description: string;
  status: string;
};

function getStatusStyle(status: string): React.CSSProperties {
  if (status === "Ready") {
    return { color: "var(--asc-green)", borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)" };
  }

  if (status === "Important") {
    return { color: "var(--asc-amber)", borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)" };
  }

  return { color: "var(--asc-accent)", borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" };
}

export default function AdminModuleCard({
  title,
  description,
  status,
}: AdminModuleCardProps) {
  return (
    <article
      className="grid gap-3 px-5 py-4 transition md:grid-cols-[220px_minmax(0,1fr)_120px] md:items-center"
      style={{ borderBottom: "1px solid var(--asc-line-soft)" }}
    >
      <h3 className="font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h3>

      <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{description}</p>

      <span
        className="inline-flex w-fit border px-3 py-1 text-xs font-black"
        style={getStatusStyle(status)}
      >
        {status}
      </span>
    </article>
  );
}

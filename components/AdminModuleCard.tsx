type AdminModuleCardProps = {
  title: string;
  description: string;
  status: string;
};

function getStatusStyle(status: string): React.CSSProperties {
  if (status === "Ready") {
    return { color: "var(--asc-green)", borderColor: "var(--asc-green-border)", background: "var(--asc-green-bg)" };
  }

  if (status === "Important") {
    return { color: "var(--asc-amber)", borderColor: "var(--asc-amber-border)", background: "var(--asc-amber-bg)" };
  }

  return { color: "var(--asc-accent)", borderColor: "var(--asc-accent-border)", background: "var(--asc-accent-dim)" };
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

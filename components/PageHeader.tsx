type PageHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export default function PageHeader({ label, title, description }: PageHeaderProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
      <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] sm:text-sm" style={{ color: "var(--asc-accent)" }}>
        {label}
      </p>

      <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-8 sm:text-lg" style={{ color: "var(--asc-fg-2)" }}>
        {description}
      </p>
    </section>
  );
}

type PageHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export default function PageHeader({
  label,
  title,
  description,
}: PageHeaderProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
        {label}
      </p>

      <h1 className="mb-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
        {title}
      </h1>

      <p className="max-w-2xl text-lg leading-8 text-gray-300">
        {description}
      </p>
    </section>
  );
}
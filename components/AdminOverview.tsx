type AdminOverviewItem = {
  label: string;
  value: string;
  description: string;
};

type AdminOverviewProps = {
  items: AdminOverviewItem[];
};

function Stat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[180px_110px_minmax(0,1fr)] md:items-center">
      <p className="font-black text-white">{label}</p>

      <p className="text-3xl font-black text-violet-200">{value}</p>

      <p className="text-sm leading-6 text-gray-400">{description}</p>
    </article>
  );
}

export default function AdminOverview({ items }: AdminOverviewProps) {
  const mainItems = items.filter((item) =>
    ["Tournaments", "Players", "Teams", "Pending Registrations"].includes(
      item.label,
    ),
  );

  const secondaryItems = items.filter(
    (item) => !mainItems.some((mainItem) => mainItem.label === item.label),
  );

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Overview
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Admin dashboard
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Quick overview of the most important Ascendra activity.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {mainItems.map((item) => (
            <div key={item.label}>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
                {item.label}
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {secondaryItems.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
              Details
            </p>

            <h3 className="mt-1 text-xl font-black text-white">
              Platform summary
            </h3>
          </div>

          <div>
            {secondaryItems.map((item) => (
              <Stat
                key={item.label}
                label={item.label}
                value={item.value}
                description={item.description}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

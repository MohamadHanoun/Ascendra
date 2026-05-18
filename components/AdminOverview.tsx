type AdminOverviewItem = {
  label: string;
  value: string;
  description: string;
};

type AdminOverviewProps = {
  items: AdminOverviewItem[];
};

function getAccentClass(index: number) {
  const accents = [
    "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
    "border-green-500/20 bg-green-500/10 text-green-300",
    "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    "border-red-500/20 bg-red-500/10 text-red-300",
  ];

  return accents[index % accents.length];
}

function getPanelClass(index: number) {
  const panels = [
    "hover:border-cyan-400/30",
    "hover:border-indigo-400/30",
    "hover:border-green-400/30",
    "hover:border-yellow-400/30",
    "hover:border-red-400/30",
  ];

  return panels[index % panels.length];
}

export default function AdminOverview({ items }: AdminOverviewProps) {
  const mainItems = items.slice(0, 3);
  const secondaryItems = items.slice(3);

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-16">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
            Overview
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Admin dashboard overview
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            A quick summary of RTN content, tournaments, teams, registrations,
            and player activity.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
            Active modules
          </p>

          <p className="mt-1 text-2xl font-black text-white">{items.length}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {mainItems.map((item, index) => (
          <article
            key={item.label}
            className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.06] ${getPanelClass(
              index,
            )}`}
          >
            <div
              className={`mb-5 inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getAccentClass(
                index,
              )}`}
            >
              {item.label}
            </div>

            <h3 className="text-4xl font-black text-white">{item.value}</h3>

            <p className="mt-4 text-sm leading-6 text-gray-400">
              {item.description}
            </p>
          </article>
        ))}
      </div>

      {secondaryItems.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {secondaryItems.map((item, index) => {
            const itemIndex = index + mainItems.length;

            return (
              <article
                key={item.label}
                className={`rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06] ${getPanelClass(
                  itemIndex,
                )}`}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div
                      className={`mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getAccentClass(
                        itemIndex,
                      )}`}
                    >
                      {item.label}
                    </div>

                    <p className="max-w-2xl text-sm leading-6 text-gray-400">
                      {item.description}
                    </p>
                  </div>

                  <p className="text-4xl font-black text-white">{item.value}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm font-black text-white">Recommended workflow</p>

        <p className="mt-2 text-sm leading-6 text-gray-400">
          Create tournaments, let players register teams, review registrations,
          and use announcements to publish important community updates.
        </p>
      </div>
    </section>
  );
}

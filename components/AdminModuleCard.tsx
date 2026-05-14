type AdminModuleCardProps = {
  title: string;
  description: string;
  status: string;
};

export default function AdminModuleCard({
  title,
  description,
  status,
}: AdminModuleCardProps) {
  const statusColor =
    status === "Important"
      ? "bg-yellow-500/20 text-yellow-300"
      : status === "Future"
        ? "bg-cyan-500/20 text-cyan-300"
        : "bg-indigo-500/20 text-indigo-300";

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
          {status}
        </span>
      </div>

      <p className="leading-7 text-gray-300">{description}</p>

      <button
        disabled
        className="mt-6 w-full cursor-not-allowed rounded-xl bg-white/10 px-5 py-3 font-bold text-gray-400"
      >
        Coming Soon
      </button>
    </article>
  );
}
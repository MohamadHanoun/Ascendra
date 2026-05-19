type AdminModuleCardProps = {
  title: string;
  description: string;
  status: string;
};

function getStatusClasses(status: string) {
  if (status === "Ready") {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "Important") {
    return "border-yellow-400/25 bg-yellow-500/10 text-yellow-300";
  }

  return "border-violet-400/25 bg-violet-500/10 text-violet-200";
}

export default function AdminModuleCard({
  title,
  description,
  status,
}: AdminModuleCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.06]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Admin module
          </p>

          <h2 className="text-xl font-black text-white">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
            status,
          )}`}
        >
          {status}
        </span>
      </div>
    </article>
  );
}

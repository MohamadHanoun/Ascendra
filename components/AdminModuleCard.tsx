type AdminModuleCardProps = {
  title: string;
  description: string;
  status: string;
};

function getStatusClasses(status: string) {
  if (status === "Ready") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "Future") {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
  }

  if (status === "Important") {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
  }

  return "border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
}

export default function AdminModuleCard({
  title,
  description,
  status,
}: AdminModuleCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
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

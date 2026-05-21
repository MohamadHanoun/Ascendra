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
    <article className="grid gap-3 px-5 py-4 transition hover:bg-white/[0.035] md:grid-cols-[220px_minmax(0,1fr)_120px] md:items-center">
      <h3 className="font-black text-white">{title}</h3>

      <p className="text-sm leading-6 text-gray-400">{description}</p>

      <span
        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
          status,
        )}`}
      >
        {status}
      </span>
    </article>
  );
}

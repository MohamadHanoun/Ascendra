type AdminModuleCardProps = {
  title: string;
  description: string;
  status: string;
};

function getStatusColor(status: string) {
  if (status === "Ready") {
    return "bg-green-500/20 text-green-300";
  }

  if (status === "Important") {
    return "bg-yellow-500/20 text-yellow-300";
  }

  if (status === "Future") {
    return "bg-cyan-500/20 text-cyan-300";
  }

  return "bg-indigo-500/20 text-indigo-300";
}

function getStatusMessage(status: string) {
  if (status === "Ready") {
    return "This module is available through the admin dashboard tabs.";
  }

  if (status === "Future") {
    return "This module is planned for a later development phase.";
  }

  return "This module is part of the RTN admin roadmap.";
}

export default function AdminModuleCard({
  title,
  description,
  status,
}: AdminModuleCardProps) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
            status,
          )}`}
        >
          {status}
        </span>
      </div>

      <p className="flex-1 leading-7 text-gray-300">{description}</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm text-gray-400">{getStatusMessage(status)}</p>
      </div>
    </article>
  );
}

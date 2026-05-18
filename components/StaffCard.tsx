type StaffCardProps = {
  name: string;
  role: string;
  status: string;
};

function getStatusClasses(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "active" || normalizedStatus === "available") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (normalizedStatus === "busy") {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
  }

  return "border-white/10 bg-white/5 text-gray-300";
}

export default function StaffCard({ name, role, status }: StaffCardProps) {
  const initials = name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl font-black text-cyan-200">
        {initials}
      </div>

      <h2 className="text-2xl font-black text-white">{name}</h2>

      <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
        {role}
      </p>

      <div className="mt-4 flex justify-center">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusClasses(
            status,
          )}`}
        >
          {status}
        </span>
      </div>
    </article>
  );
}

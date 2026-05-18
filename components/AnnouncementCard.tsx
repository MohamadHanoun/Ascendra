type AnnouncementCardProps = {
  announcement: {
    id: string;
    title: string;
    category: string;
    description: string;
    important: boolean;
    createdAt: Date | string;
  };
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AnnouncementCard({
  announcement,
}: AnnouncementCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-black text-indigo-300">
          {announcement.category}
        </span>

        {announcement.important && (
          <span className="inline-flex rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
            Important
          </span>
        )}
      </div>

      <h2 className="text-2xl font-black text-white">{announcement.title}</h2>

      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {formatDate(announcement.createdAt)}
      </p>

      <p className="mt-5 flex-1 text-sm leading-6 text-gray-400">
        {announcement.description}
      </p>
    </article>
  );
}

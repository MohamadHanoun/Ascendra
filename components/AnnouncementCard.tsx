type AnnouncementCardProps = {
  announcement: {
    id: string;
    title: string;
    category: string;
    description: string;
    important: boolean;
    createdAt: Date | string;
  };
  featured?: boolean;
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
  featured = false,
}: AnnouncementCardProps) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border transition hover:border-cyan-400/30 hover:bg-white/[0.06] ${
        announcement.important
          ? "border-yellow-500/20 bg-yellow-500/[0.06]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div
        className={`border-b border-white/10 px-5 py-4 ${
          announcement.important ? "bg-yellow-500/[0.05]" : "bg-white/[0.03]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-black text-indigo-300">
            {announcement.category}
          </span>

          {announcement.important && (
            <span className="inline-flex rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
              Important
            </span>
          )}

          <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-gray-400">
            {formatDate(announcement.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2
          className={`font-black text-white ${
            featured ? "text-3xl md:text-4xl" : "text-2xl"
          }`}
        >
          {announcement.title}
        </h2>

        <p
          className={`mt-4 flex-1 leading-7 text-gray-400 ${
            featured ? "text-base" : "text-sm"
          }`}
        >
          {announcement.description}
        </p>
      </div>
    </article>
  );
}

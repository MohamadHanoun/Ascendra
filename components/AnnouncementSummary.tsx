type AnnouncementSummaryProps = {
  announcements: {
    important: boolean;
  }[];
};

export default function AnnouncementSummary({
  announcements,
}: AnnouncementSummaryProps) {
  const importantCount = announcements.filter((item) => item.important).length;
  const totalCount = announcements.length;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="grid gap-6 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="mb-2 text-4xl font-black text-indigo-400">
            {totalCount}
          </p>
          <h2 className="mb-3 text-xl font-bold">Total Updates</h2>
          <p className="leading-7 text-gray-300">
            Current announcements loaded from the RTN database.
          </p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="mb-2 text-4xl font-black text-yellow-300">
            {importantCount}
          </p>
          <h2 className="mb-3 text-xl font-bold">Important</h2>
          <p className="leading-7 text-gray-300">
            Important updates for the community and future features.
          </p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="mb-2 text-4xl font-black text-cyan-300">Future</p>
          <h2 className="mb-3 text-xl font-bold">Admin Managed</h2>
        </article>
      </div>
    </section>
  );
}
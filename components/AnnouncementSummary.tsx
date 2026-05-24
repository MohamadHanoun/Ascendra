type AnnouncementSummaryProps = {
  announcements: {
    important: boolean;
  }[];
};

export default function AnnouncementSummary({ announcements }: AnnouncementSummaryProps) {
  const importantCount = announcements.filter((item) => item.important).length;
  const totalCount = announcements.length;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <div className="grid gap-6 md:grid-cols-3">
        <article className="asc-card border p-6 shadow-2xl" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <p className="mb-2 text-4xl font-black" style={{ color: "var(--asc-accent)" }}>
            {totalCount}
          </p>
          <h2 className="mb-3 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Total Updates</h2>
          <p className="leading-7" style={{ color: "var(--asc-fg-2)" }}>
            Current announcements loaded from the Ascendra database.
          </p>
        </article>

        <article className="asc-card border p-6 shadow-2xl" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <p className="mb-2 text-4xl font-black" style={{ color: "var(--asc-amber)" }}>
            {importantCount}
          </p>
          <h2 className="mb-3 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Important</h2>
          <p className="leading-7" style={{ color: "var(--asc-fg-2)" }}>
            Important updates for the community and future features.
          </p>
        </article>

        <article className="asc-card border p-6 shadow-2xl" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <p className="mb-2 text-4xl font-black" style={{ color: "var(--asc-blue)" }}>Admin</p>
          <h2 className="mb-3 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Admin Managed</h2>
        </article>
      </div>
    </section>
  );
}

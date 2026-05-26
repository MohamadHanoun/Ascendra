import type { Locale } from "@/lib/i18n";

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
  locale?: Locale;
  importantLabel?: string;
};

function formatDate(date: Date | string, locale: Locale = "en") {
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AnnouncementCard({
  announcement,
  featured = false,
  locale = "en",
  importantLabel = "Important",
}: AnnouncementCardProps) {
  const importantBorder = announcement.important
    ? { borderColor: "oklch(0.65 0.16 75 / 0.4)", background: "oklch(0.25 0.14 75 / 0.08)" }
    : { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" };

  return (
    <article
      className="flex h-full flex-col overflow-hidden border shadow-2xl shadow-black/20 transition"
      style={importantBorder}
    >
      <div
        className="px-5 py-4"
        style={{
          borderBottom: "1px solid var(--asc-line-soft)",
          background: announcement.important ? "var(--asc-accent-dim)" : "var(--asc-card-muted)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex border px-3 py-1 text-xs font-black"
            style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)", color: "var(--asc-accent)" }}
          >
            {announcement.category}
          </span>

          {announcement.important && (
            <span
              className="inline-flex border px-3 py-1 text-xs font-black"
              style={{ borderColor: "oklch(0.65 0.16 75 / 0.5)", background: "oklch(0.25 0.14 75 / 0.18)", color: "var(--asc-amber)" }}
            >
              {importantLabel}
            </span>
          )}

          <span
            className="inline-flex border px-3 py-1 text-xs font-black"
            style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-3)" }}
          >
            {formatDate(announcement.createdAt, locale)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2
          className={`font-black ${featured ? "text-3xl md:text-4xl" : "text-2xl"}`}
          style={{ color: "var(--asc-fg-0)" }}
        >
          {announcement.title}
        </h2>

        <p
          className={`mt-4 flex-1 leading-7 ${featured ? "text-base" : "text-sm"}`}
          style={{ color: "var(--asc-fg-3)" }}
        >
          {announcement.description}
        </p>
      </div>
    </article>
  );
}

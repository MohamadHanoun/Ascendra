import type { Metadata } from "next";
import type { ReactNode } from "react";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getDictionary, type Locale, type NewsMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnnouncementItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  important: boolean;
  createdAt: Date;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getDictionary(locale).news.metadata;

  return {
    title: messages.title,
    description: messages.description,
  };
}

async function getAnnouncements() {
  return prisma.announcement.findMany({
    where: {
      published: true,
    },
    orderBy: [
      {
        important: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      title: true,
      category: true,
      description: true,
      important: true,
      createdAt: true,
    },
  });
}

function formatDate(date: Date, locale: Locale) {
  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Pill({
  children,
  tone = "violet",
}: {
  children: ReactNode;
  tone?: "violet" | "green" | "blue" | "gray";
}) {
  const styles: Record<string, React.CSSProperties> = {
    violet: { borderColor: "oklch(0.70 0.22 285 / 0.25)", background: "oklch(0.70 0.22 285 / 0.10)", color: "oklch(0.88 0.10 285)" },
    green: { borderColor: "oklch(0.74 0.16 150 / 0.25)", background: "oklch(0.74 0.16 150 / 0.10)", color: "oklch(0.74 0.16 150)" },
    blue: { borderColor: "oklch(0.75 0.14 220 / 0.25)", background: "oklch(0.75 0.14 220 / 0.10)", color: "oklch(0.75 0.14 220)" },
    gray: { borderColor: "oklch(0.32 0.06 290 / 0.18)", background: "oklch(0.10 0.02 287 / 0.25)", color: "var(--asc-fg-2)" },
  };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black"
      style={styles[tone]}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--asc-fg-3)" }}>
        {label}
      </p>

      <p className="mt-1 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{value}</p>
    </div>
  );
}

function FeaturedAnnouncement({
  announcement,
  locale,
  labels,
}: {
  announcement: AnnouncementItem;
  locale: Locale;
  labels: NewsMessages["labels"];
}) {
  return (
    <article
      className="p-6 shadow-2xl shadow-black/20"
      style={{ border: "1px solid oklch(0.74 0.16 150 / 0.20)", background: "oklch(0.74 0.16 150 / 0.055)" }}
    >
      <div className="flex flex-wrap gap-2">
        <Pill tone="green">{labels.featured}</Pill>
        <Pill>{announcement.category}</Pill>
        <Pill tone="gray">{formatDate(announcement.createdAt, locale)}</Pill>
      </div>

      <h2 className="mt-5 max-w-4xl text-3xl font-black md:text-4xl" style={{ color: "var(--asc-fg-0)" }}>
        {announcement.title}
      </h2>

      <p className="mt-4 max-w-5xl text-sm leading-7" style={{ color: "var(--asc-fg-1)" }}>
        {announcement.description}
      </p>
    </article>
  );
}

function AnnouncementRow({
  announcement,
  locale,
  labels,
}: {
  announcement: AnnouncementItem;
  locale: Locale;
  labels: NewsMessages["labels"];
}) {
  return (
    <article className="grid gap-4 px-5 py-5 transition md:grid-cols-[170px_minmax(0,1fr)] md:items-start" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
      <div className="flex flex-wrap gap-2 md:block">
        <Pill tone={announcement.important ? "green" : "violet"}>
          {announcement.category}
        </Pill>

        <div className="mt-0 md:mt-3">
          <Pill tone="gray">{formatDate(announcement.createdAt, locale)}</Pill>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap gap-2">
          {announcement.important && (
            <Pill tone="green">{labels.important}</Pill>
          )}
        </div>

        <h2 className="text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{announcement.title}</h2>

        <p className="mt-2 max-w-5xl text-sm leading-7" style={{ color: "var(--asc-fg-3)" }}>
          {announcement.description}
        </p>
      </div>
    </article>
  );
}

export default async function AnnouncementsPage() {
  const locale = await getLocale();
  const messages = getDictionary(locale).news;
  const announcements = await getAnnouncements();

  const importantCount = announcements.filter(
    (announcement) => announcement.important,
  ).length;

  const categoriesCount = new Set(
    announcements.map((announcement) => announcement.category),
  ).size;

  const featuredAnnouncement =
    announcements.find((announcement) => announcement.important) || null;

  const regularAnnouncements = featuredAnnouncement
    ? announcements.filter(
        (announcement) => announcement.id !== featuredAnnouncement.id,
      )
    : announcements;

  return (
    <main className="asc-ambient min-h-screen overflow-hidden" style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}>
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/news-hero.webp")',
            }}
          />

          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,oklch(0.06 0.03 287 / 0.94) 0%,oklch(0.06 0.03 287 / 0.68) 44%,oklch(0.06 0.03 287 / 0.84) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-44" style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }} />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--asc-green)" }}>
              {messages.hero.label}
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight md:text-7xl" style={{ color: "var(--asc-fg-0)" }}>
              {messages.hero.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--asc-fg-1)" }}>
              {messages.hero.description}
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <section
            className="grid gap-5 p-5 shadow-2xl shadow-black/20 md:grid-cols-3"
            style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <Stat
              label={messages.stats.published}
              value={announcements.length}
            />
            <Stat label={messages.stats.important} value={importantCount} />
            <Stat label={messages.stats.categories} value={categoriesCount} />
          </section>

          {announcements.length === 0 ? (
            <EmptyState
              title={messages.empty.title}
              description={messages.empty.description}
            />
          ) : (
            <>
              {featuredAnnouncement && (
                <FeaturedAnnouncement
                  announcement={featuredAnnouncement}
                  locale={locale}
                  labels={messages.labels}
                />
              )}

              <section
                className="overflow-hidden shadow-2xl shadow-black/20 backdrop-blur"
                style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
              >
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
                  <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-green)" }}>
                    {messages.labels.latest}
                  </p>

                  <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>
                    {messages.labels.publishedAnnouncements}
                  </h2>
                </div>

                {regularAnnouncements.length === 0 ? (
                  <div className="p-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
                    {messages.labels.noOtherAnnouncements}
                  </div>
                ) : (
                  <div>
                    {regularAnnouncements.map((announcement) => (
                      <AnnouncementRow
                        key={announcement.id}
                        announcement={announcement}
                        locale={locale}
                        labels={messages.labels}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}

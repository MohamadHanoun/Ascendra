import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";

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

function getRelativeTime(date: Date, locale: Locale) {
  const diffMs = Date.now() - date.getTime();
  const hours = Math.max(1, Math.round(diffMs / 3600000));

  if (locale === "ar") {
    if (hours < 24) {
      return `منذ ${hours} ساعة`;
    }

    return `منذ ${Math.round(hours / 24)} يوم`;
  }

  if (hours < 24) {
    return `${hours}H AGO`;
  }

  return `${Math.round(hours / 24)}D AGO`;
}

function getReadTime(description: string, locale: Locale) {
  const words = description.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));

  return locale === "ar" ? `${minutes} دقيقة قراءة` : `${minutes} MIN READ`;
}

function Pill({
  children,
  tone = "violet",
}: {
  children: ReactNode;
  tone?: "violet" | "green" | "blue" | "gray";
}) {
  const styles: Record<string, CSSProperties> = {
    violet: {
      borderColor: "oklch(0.70 0.22 285 / 0.34)",
      background: "oklch(0.70 0.22 285 / 0.10)",
      color: "var(--asc-accent)",
    },
    green: {
      borderColor: "oklch(0.74 0.16 150 / 0.30)",
      background: "oklch(0.74 0.16 150 / 0.10)",
      color: "var(--asc-green)",
    },
    blue: {
      borderColor: "oklch(0.75 0.14 220 / 0.30)",
      background: "oklch(0.75 0.14 220 / 0.10)",
      color: "var(--asc-blue)",
    },
    gray: {
      borderColor: "var(--asc-line-soft)",
      background: "oklch(0.10 0.02 287 / 0.25)",
      color: "var(--asc-fg-2)",
    },
  };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
      style={styles[tone]}
    >
      {children}
    </span>
  );
}

function CornerMark() {
  return <div aria-hidden="true" className="asc-corner-mark" />;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className="relative border p-5"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      <CornerMark />

      <p
        className="text-[10px] font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>

      <p
        className="mt-3 text-4xl font-black tabular-nums"
        style={{
          color: accent ? "var(--asc-accent)" : "var(--asc-fg-0)",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p
        className="text-xs font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--asc-accent)" }}
      >
        ▲ {eyebrow}
      </p>

      <h2
        className="mt-2 text-3xl md:text-4xl"
        style={{ color: "var(--asc-fg-0)" }}
      >
        {title}
      </h2>
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
      className="relative overflow-hidden border p-6 shadow-2xl shadow-black/20 md:p-8"
      style={{
        borderColor: "var(--asc-line-soft)",
        background:
          "linear-gradient(135deg, oklch(0.18 0.10 285 / 0.56) 0%, var(--asc-bg-1) 58%, oklch(0.09 0.03 287) 100%)",
        clipPath:
          "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)",
      }}
    >
      <CornerMark />

      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 text-[180px] font-black leading-none"
        style={{
          color: "oklch(1 0 0 / 0.035)",
          fontFamily: "var(--font-display)",
        }}
      >
        01
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap gap-2">
          <Pill tone="violet">{labels.featured}</Pill>
          {announcement.important && (
            <Pill tone="green">{labels.important}</Pill>
          )}
          <Pill tone="gray">{announcement.category}</Pill>
          <Pill tone="gray">{formatDate(announcement.createdAt, locale)}</Pill>
        </div>

        <h2
          className="mt-6 max-w-5xl text-4xl md:text-5xl"
          style={{ color: "var(--asc-fg-0)" }}
        >
          {announcement.title}
        </h2>

        <p
          className="mt-5 max-w-5xl text-sm leading-7 md:text-base"
          style={{ color: "var(--asc-fg-2)" }}
        >
          {announcement.description}
        </p>

        <p
          className="mt-6 text-[10px] font-black uppercase tracking-[0.16em]"
          style={{ color: "var(--asc-accent)" }}
        >
          {getReadTime(announcement.description, locale)}
        </p>
      </div>
    </article>
  );
}

function AnnouncementCard({
  announcement,
  index,
  locale,
  labels,
}: {
  announcement: AnnouncementItem;
  index: number;
  locale: Locale;
  labels: NewsMessages["labels"];
}) {
  return (
    <article
      className="group relative flex min-h-[190px] gap-5 overflow-hidden border p-5 transition hover:opacity-95"
      style={{
        borderColor: "var(--asc-line-soft)",
        background: "var(--asc-bg-1)",
        clipPath:
          "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
      }}
    >
      <CornerMark />

      <p
        className="shrink-0 text-6xl font-black leading-none tabular-nums"
        style={{
          color: "var(--asc-accent)",
          fontFamily: "var(--font-display)",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </p>

      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <Pill tone={announcement.important ? "green" : "violet"}>
            {announcement.category}
          </Pill>

          {announcement.important && (
            <Pill tone="green">{labels.important}</Pill>
          )}
        </div>

        <p
          className="mt-4 text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {getRelativeTime(announcement.createdAt, locale)} ·{" "}
          {formatDate(announcement.createdAt, locale)}
        </p>

        <h3
          className="mt-2 text-xl leading-tight md:text-2xl"
          style={{ color: "var(--asc-fg-0)" }}
        >
          {announcement.title}
        </h3>

        <p
          className="mt-3 line-clamp-3 text-sm leading-6"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {announcement.description}
        </p>

        <p
          className="mt-5 text-[10px] font-black uppercase tracking-[0.14em]"
          style={{ color: "var(--asc-fg-3)" }}
        >
          {getReadTime(announcement.description, locale)}
        </p>
      </div>

      <span
        className="mt-1 shrink-0 text-2xl transition group-hover:translate-x-1"
        style={{ color: "var(--asc-fg-3)" }}
      >
        ›
      </span>
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
    announcements.find((announcement) => announcement.important) ||
    announcements[0] ||
    null;

  const regularAnnouncements = featuredAnnouncement
    ? announcements.filter(
        (announcement) => announcement.id !== featuredAnnouncement.id,
      )
    : announcements;

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/news-hero.webp")',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: [
                "linear-gradient(180deg, oklch(0.07 0.025 285 / 0.28) 0%, oklch(0.07 0.025 285 / 0.62) 52%, var(--asc-bg-0) 100%)",
                "linear-gradient(90deg, var(--asc-bg-0) 0%, oklch(0.07 0.025 285 / 0.42) 38%, transparent 72%)",
              ].join(", "),
            }}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-44"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--asc-bg-0))",
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p
              className="mb-4 text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: "var(--asc-accent)" }}
            >
              ▲ {messages.hero.label}
            </p>

            <h1
              className="max-w-5xl text-5xl md:text-7xl"
              style={{ color: "var(--asc-fg-0)" }}
            >
              {messages.hero.title}
            </h1>

            <p
              className="mt-5 max-w-2xl text-base leading-7"
              style={{ color: "var(--asc-fg-2)" }}
            >
              {messages.hero.description}
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-10 px-6 pb-16 lg:px-10 2xl:px-14">
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard
              label={messages.stats.published}
              value={announcements.length}
            />
            <StatCard
              label={messages.stats.important}
              value={importantCount}
              accent
            />
            <StatCard
              label={messages.stats.categories}
              value={categoriesCount}
            />
          </section>

          {announcements.length === 0 ? (
            <EmptyState
              title={messages.empty.title}
              description={messages.empty.description}
            />
          ) : (
            <>
              {featuredAnnouncement && (
                <section>
                  <SectionHeader
                    eyebrow={messages.labels.featured}
                    title={featuredAnnouncement.category}
                  />

                  <FeaturedAnnouncement
                    announcement={featuredAnnouncement}
                    locale={locale}
                    labels={messages.labels}
                  />
                </section>
              )}

              <section>
                <SectionHeader
                  eyebrow={messages.labels.latest}
                  title={messages.labels.publishedAnnouncements}
                />

                {regularAnnouncements.length === 0 ? (
                  <div
                    className="relative border p-6 text-sm"
                    style={{
                      borderColor: "var(--asc-line-soft)",
                      background: "var(--asc-bg-1)",
                      color: "var(--asc-fg-3)",
                    }}
                  >
                    <CornerMark />
                    {messages.labels.noOtherAnnouncements}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {regularAnnouncements.map((announcement, index) => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        index={index}
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

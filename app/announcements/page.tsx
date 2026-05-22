import type { Metadata } from "next";
import type { ReactNode } from "react";

import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "News | Ascendra",
  description: "Ascendra announcements and updates.",
};

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

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
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
  const styles = {
    violet: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    blue: "border-sky-400/25 bg-sky-500/10 text-sky-300",
    gray: "border-white/10 bg-black/25 text-gray-400",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function FeaturedAnnouncement({
  announcement,
}: {
  announcement: AnnouncementItem;
}) {
  return (
    <article className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.055] p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap gap-2">
        <Pill tone="green">Featured update</Pill>
        <Pill>{announcement.category}</Pill>
        <Pill tone="gray">{formatDate(announcement.createdAt)}</Pill>
      </div>

      <h2 className="mt-5 max-w-4xl text-3xl font-black text-white md:text-4xl">
        {announcement.title}
      </h2>

      <p className="mt-4 max-w-5xl text-sm leading-7 text-gray-300">
        {announcement.description}
      </p>
    </article>
  );
}

function AnnouncementRow({ announcement }: { announcement: AnnouncementItem }) {
  return (
    <article className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.035] md:grid-cols-[170px_minmax(0,1fr)] md:items-start">
      <div className="flex flex-wrap gap-2 md:block">
        <Pill tone={announcement.important ? "green" : "violet"}>
          {announcement.category}
        </Pill>

        <div className="mt-0 md:mt-3">
          <Pill tone="gray">{formatDate(announcement.createdAt)}</Pill>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap gap-2">
          {announcement.important && <Pill tone="green">Important</Pill>}
        </div>

        <h2 className="text-2xl font-black text-white">{announcement.title}</h2>

        <p className="mt-2 max-w-5xl text-sm leading-7 text-gray-400">
          {announcement.description}
        </p>
      </div>
    </article>
  );
}

export default async function AnnouncementsPage() {
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
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10)_0%,transparent_30%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.14)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#090b15_42%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="relative min-h-[430px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/backgrounds/community-hero.webp")',
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,17,0.94)_0%,rgba(7,8,17,0.68)_44%,rgba(7,8,17,0.84)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#070811]/75 to-[#070811]" />

          <div className="relative z-10 mx-auto max-w-[1680px] px-6 pb-28 pt-20 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              Ascendra updates
            </p>

            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[1.02] tracking-tight text-white md:text-7xl">
              News
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
              Official announcements, tournament updates, and community notes.
            </p>
          </div>
        </section>

        <section className="relative -mt-16 mx-auto grid max-w-[1680px] gap-8 px-6 pb-16 lg:px-10 2xl:px-14">
          <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 md:grid-cols-3">
            <Stat label="Published" value={announcements.length} />
            <Stat label="Important" value={importantCount} />
            <Stat label="Categories" value={categoriesCount} />
          </section>

          {announcements.length === 0 ? (
            <EmptyState
              title="No announcements yet"
              description="Published announcements will appear here."
            />
          ) : (
            <>
              {featuredAnnouncement && (
                <FeaturedAnnouncement announcement={featuredAnnouncement} />
              )}

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                    Latest updates
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white">
                    Published announcements
                  </h2>
                </div>

                {regularAnnouncements.length === 0 ? (
                  <div className="p-5 text-sm text-gray-400">
                    No other announcements published.
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {regularAnnouncements.map((announcement) => (
                      <AnnouncementRow
                        key={announcement.id}
                        announcement={announcement}
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

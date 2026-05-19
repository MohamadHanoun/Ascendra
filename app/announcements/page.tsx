import type { Metadata } from "next";
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

async function getAnnouncements() {
  const announcements = await prisma.announcement.findMany({
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
  });

  return announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    category: announcement.category,
    description: announcement.description,
    important: announcement.important,
    createdAt: announcement.createdAt.toISOString(),
  }));
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "important" | "date";
}) {
  const styles = {
    default: "border-violet-400/25 bg-violet-500/10 text-violet-200",
    important: "border-yellow-400/25 bg-yellow-500/10 text-yellow-300",
    date: "border-white/10 bg-black/25 text-gray-400",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function AnnouncementRow({
  announcement,
}: {
  announcement: {
    id: string;
    title: string;
    category: string;
    description: string;
    important: boolean;
    createdAt: Date | string;
  };
}) {
  return (
    <article
      className={`grid gap-4 p-5 transition hover:bg-white/[0.035] xl:grid-cols-[minmax(0,1fr)_150px_150px] xl:items-center ${
        announcement.important ? "bg-yellow-500/[0.035]" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge>{announcement.category}</Badge>

          {announcement.important && (
            <Badge variant="important">Important</Badge>
          )}

          <Badge variant="date">{formatDate(announcement.createdAt)}</Badge>
        </div>

        <h2 className="text-2xl font-black text-white">{announcement.title}</h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-400">
          {announcement.description}
        </p>
      </div>

      <div className="hidden xl:block">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
          Category
        </p>

        <p className="mt-1 text-sm font-black text-white">
          {announcement.category}
        </p>
      </div>

      <div className="hidden xl:block">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
          Published
        </p>

        <p className="mt-1 text-sm font-black text-white">
          {formatDate(announcement.createdAt)}
        </p>
      </div>
    </article>
  );
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  const importantAnnouncements = announcements.filter(
    (announcement) => announcement.important,
  );

  const categoriesCount = new Set(
    announcements.map((announcement) => announcement.category),
  ).size;

  return (
    <main className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16)_0%,transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12)_0%,transparent_30%),linear-gradient(to_bottom,#070811,#0b0d17_45%,#070811)]" />

      <div className="relative z-10">
        <Navbar />

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-[1680px] px-6 py-14 lg:px-10 2xl:px-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Ascendra updates
            </p>

            <h1 className="text-5xl font-black uppercase tracking-tight text-white md:text-6xl">
              News
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
              Announcements and tournament updates.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1680px] gap-8 px-6 py-10 lg:px-10 2xl:px-14">
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Published" value={announcements.length} />
            <StatCard label="Important" value={importantAnnouncements.length} />
            <StatCard label="Categories" value={categoriesCount} />
          </section>

          {announcements.length === 0 ? (
            <EmptyState
              title="No announcements yet"
              description="Published announcements will appear here."
            />
          ) : (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <div className="hidden border-b border-white/10 bg-black/25 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500 xl:grid xl:grid-cols-[minmax(0,1fr)_150px_150px]">
                <span>Announcement</span>
                <span>Category</span>
                <span>Date</span>
              </div>

              <div className="divide-y divide-white/10">
                {announcements.map((announcement) => (
                  <AnnouncementRow
                    key={announcement.id}
                    announcement={announcement}
                  />
                ))}
              </div>
            </section>
          )}
        </section>

        <Footer />
      </div>
    </main>
  );
}

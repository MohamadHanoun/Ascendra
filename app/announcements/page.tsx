import type { Metadata } from "next";
import AnnouncementCard from "@/components/AnnouncementCard";
import EmptyState from "@/components/EmptyState";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Announcements",
  description:
    "Read the latest RTN community announcements, updates, and event news.",
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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function SectionTitle({
  label,
  color = "cyan",
}: {
  label: string;
  color?: "cyan" | "yellow";
}) {
  return (
    <div className="mb-4">
      <p
        className={`text-sm font-black uppercase tracking-[0.16em] ${
          color === "yellow" ? "text-yellow-300" : "text-cyan-300"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  const importantAnnouncements = announcements.filter(
    (announcement) => announcement.important,
  );

  const featuredAnnouncement = importantAnnouncements[0];

  const regularAnnouncements = featuredAnnouncement
    ? announcements.filter(
        (announcement) => announcement.id !== featuredAnnouncement.id,
      )
    : announcements;

  const categoriesCount = new Set(
    announcements.map((announcement) => announcement.category),
  ).size;

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Announcements"
        title="Community news and updates."
        description="Read the latest RTN announcements, tournament news, server updates, and community events."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-24">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Published" value={announcements.length} />
          <StatCard label="Important" value={importantAnnouncements.length} />
          <StatCard label="Categories" value={categoriesCount} />
        </section>

        {announcements.length === 0 ? (
          <EmptyState
            title="No announcements yet"
            description="Published RTN announcements will appear here when new updates are available."
          />
        ) : (
          <div className="grid gap-12">
            {featuredAnnouncement && (
              <section>
                <SectionTitle label="Featured announcement" color="yellow" />

                <AnnouncementCard
                  announcement={featuredAnnouncement}
                  featured
                />
              </section>
            )}

            {regularAnnouncements.length > 0 && (
              <section>
                <SectionTitle label="Latest updates" />

                <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {regularAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

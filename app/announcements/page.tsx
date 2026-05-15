import AnnouncementCard from "@/components/AnnouncementCard";
import AnnouncementSummary from "@/components/AnnouncementSummary";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    where: {
      published: true,
    },
    orderBy: {
      createdAt: "desc",
    },
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

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Announcements"
        title="News, updates, and community announcements."
        description="This page is connected to the database and prepared for tournament news, server updates, feature releases, and community events."
      />

      <AnnouncementSummary announcements={announcements} />

      <section className="mx-auto max-w-7xl px-6 pb-24">

        {announcements.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">No announcements yet</h2>

          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
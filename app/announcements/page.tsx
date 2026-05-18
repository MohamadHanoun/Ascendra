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

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <PageHeader
        label="RTN Announcements"
        title="Community news and updates."
        description="Read the latest RTN announcements, tournament news, server updates, and community events."
      />

      <section className="mx-auto max-w-7xl px-6 pb-24">
        {announcements.length === 0 ? (
          <EmptyState
            title="No announcements yet"
            description="Published RTN announcements will appear here when new updates are available."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

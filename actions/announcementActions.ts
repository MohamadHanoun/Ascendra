"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized");
  }

  return session;
}

function revalidateAnnouncementPages() {
  revalidatePath("/admin");
  revalidatePath("/announcements");
  revalidatePath("/api/announcements");
  revalidatePath("/");
}

export async function createAnnouncement(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const important = formData.get("important") === "on";
  const published = formData.get("published") === "on";

  if (!title || !category || !description) {
    throw new Error("Title, category, and description are required.");
  }

  await prisma.announcement.create({
    data: {
      title,
      category,
      description,
      important,
      published,
    },
  });

  revalidateAnnouncementPages();
  redirect("/admin?tab=announcements");
}

export async function toggleAnnouncementPublished(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const published = formData.get("published") === "true";

  if (!id) {
    throw new Error("Announcement ID is missing.");
  }

  await prisma.announcement.update({
    where: {
      id,
    },
    data: {
      published: !published,
    },
  });

  revalidateAnnouncementPages();
  redirect("/admin?tab=announcements");
}

export async function toggleAnnouncementImportant(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const important = formData.get("important") === "true";

  if (!id) {
    throw new Error("Announcement ID is missing.");
  }

  await prisma.announcement.update({
    where: {
      id,
    },
    data: {
      important: !important,
    },
  });

  revalidateAnnouncementPages();
  redirect("/admin?tab=announcements");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Announcement ID is missing.");
  }

  await prisma.announcement.delete({
    where: {
      id,
    },
  });

  revalidateAnnouncementPages();
}
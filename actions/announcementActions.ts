"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAnnouncement(formData: FormData) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized");
  }

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

  revalidatePath("/admin");
  revalidatePath("/announcements");
  revalidatePath("/api/announcements");

  redirect("/admin");
}
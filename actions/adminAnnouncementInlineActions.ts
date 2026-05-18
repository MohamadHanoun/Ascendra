"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminAnnouncementActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): AdminAnnouncementActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(
  message: string,
  redirectTo?: string,
): AdminAnnouncementActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function getCheckbox(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

async function requireAdmin(): Promise<AdminAnnouncementActionResult | null> {
  const session = await auth();

  const sessionUser = session?.user as
    | {
        databaseId?: string;
        isAdmin?: boolean;
      }
    | undefined;

  if (!sessionUser?.databaseId) {
    return fail("Please login first.", "/login");
  }

  if (!sessionUser.isAdmin) {
    return fail("Only RTN admins can manage announcements.");
  }

  return null;
}

function validateAnnouncementForm(formData: FormData) {
  const title = getValue(formData, "title");
  const category = getValue(formData, "category");
  const description = getValue(formData, "description");
  const important = getCheckbox(formData, "important");
  const published = getCheckbox(formData, "published");

  if (!title) {
    return {
      ok: false as const,
      message: "Announcement title is required.",
    };
  }

  if (!category) {
    return {
      ok: false as const,
      message: "Announcement category is required.",
    };
  }

  if (!description) {
    return {
      ok: false as const,
      message: "Announcement description is required.",
    };
  }

  return {
    ok: true as const,
    data: {
      title,
      category,
      description,
      important,
      published,
    },
  };
}

export async function createAnnouncementInline(
  formData: FormData,
): Promise<AdminAnnouncementActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const validation = validateAnnouncementForm(formData);

  if (!validation.ok) {
    return fail(validation.message);
  }

  await prisma.announcement.create({
    data: validation.data,
  });

  revalidatePath("/admin");
  revalidatePath("/announcements");
  revalidatePath("/");

  return success("Announcement created successfully.");
}

export async function updateAnnouncementInline(
  formData: FormData,
): Promise<AdminAnnouncementActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const announcementId =
    getValue(formData, "announcementId") || getValue(formData, "id");

  if (!announcementId) {
    return fail("Announcement ID is missing.");
  }

  const validation = validateAnnouncementForm(formData);

  if (!validation.ok) {
    return fail(validation.message);
  }

  const announcement = await prisma.announcement.findUnique({
    where: {
      id: announcementId,
    },
  });

  if (!announcement) {
    return fail("Announcement was not found.");
  }

  await prisma.announcement.update({
    where: {
      id: announcement.id,
    },
    data: validation.data,
  });

  revalidatePath("/admin");
  revalidatePath("/announcements");
  revalidatePath("/");

  return success("Announcement updated successfully.");
}

export async function publishAnnouncementInline(
  formData: FormData,
): Promise<AdminAnnouncementActionResult> {
  return setAnnouncementPublishedStatus(formData, true);
}

export async function unpublishAnnouncementInline(
  formData: FormData,
): Promise<AdminAnnouncementActionResult> {
  return setAnnouncementPublishedStatus(formData, false);
}

async function setAnnouncementPublishedStatus(
  formData: FormData,
  published: boolean,
): Promise<AdminAnnouncementActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const announcementId =
    getValue(formData, "announcementId") || getValue(formData, "id");

  if (!announcementId) {
    return fail("Announcement ID is missing.");
  }

  const announcement = await prisma.announcement.findUnique({
    where: {
      id: announcementId,
    },
  });

  if (!announcement) {
    return fail("Announcement was not found.");
  }

  await prisma.announcement.update({
    where: {
      id: announcement.id,
    },
    data: {
      published,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/announcements");
  revalidatePath("/");

  return success(
    published ? "Announcement published." : "Announcement unpublished.",
  );
}

export async function markAnnouncementImportantInline(
  formData: FormData,
): Promise<AdminAnnouncementActionResult> {
  return setAnnouncementImportantStatus(formData, true);
}

export async function unmarkAnnouncementImportantInline(
  formData: FormData,
): Promise<AdminAnnouncementActionResult> {
  return setAnnouncementImportantStatus(formData, false);
}

async function setAnnouncementImportantStatus(
  formData: FormData,
  important: boolean,
): Promise<AdminAnnouncementActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const announcementId =
    getValue(formData, "announcementId") || getValue(formData, "id");

  if (!announcementId) {
    return fail("Announcement ID is missing.");
  }

  const announcement = await prisma.announcement.findUnique({
    where: {
      id: announcementId,
    },
  });

  if (!announcement) {
    return fail("Announcement was not found.");
  }

  await prisma.announcement.update({
    where: {
      id: announcement.id,
    },
    data: {
      important,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/announcements");
  revalidatePath("/");

  return success(
    important
      ? "Announcement marked as important."
      : "Announcement importance removed.",
  );
}

export async function deleteAnnouncementInline(
  formData: FormData,
): Promise<AdminAnnouncementActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const announcementId =
    getValue(formData, "announcementId") || getValue(formData, "id");

  if (!announcementId) {
    return fail("Announcement ID is missing.");
  }

  const announcement = await prisma.announcement.findUnique({
    where: {
      id: announcementId,
    },
  });

  if (!announcement) {
    return fail("Announcement was not found.");
  }

  await prisma.announcement.delete({
    where: {
      id: announcement.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/announcements");
  revalidatePath("/");

  return success("Announcement deleted successfully.");
}

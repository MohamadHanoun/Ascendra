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

function revalidateStaffPages() {
  revalidatePath("/admin");
  revalidatePath("/staff");
  revalidatePath("/api/staff");
  revalidatePath("/");
}

async function normalizeStaffOrder() {
  const staffMembers = await prisma.staffMember.findMany({
    orderBy: {
      order: "asc",
    },
  });

  await prisma.$transaction(
    staffMembers.map((member, index) =>
      prisma.staffMember.update({
        where: {
          id: member.id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );
}

export async function createStaffMember(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const avatarUrl = String(formData.get("avatarUrl") || "").trim();

  if (!name || !role || !status) {
    throw new Error("Name, role, and status are required.");
  }

  const lastMember = await prisma.staffMember.findFirst({
    orderBy: {
      order: "desc",
    },
  });

  await prisma.staffMember.create({
    data: {
      name,
      role,
      status,
      avatarUrl: avatarUrl || null,
      order: (lastMember?.order || 0) + 1,
      isActive: true,
    },
  });

  revalidateStaffPages();
  redirect("/admin?tab=staff");
}

export async function updateStaffMember(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const avatarUrl = String(formData.get("avatarUrl") || "").trim();

  if (!id || !name || !role || !status) {
    throw new Error("Staff ID, name, role, and status are required.");
  }

  await prisma.staffMember.update({
    where: {
      id,
    },
    data: {
      name,
      role,
      status,
      avatarUrl: avatarUrl || null,
    },
  });

  revalidateStaffPages();
}

export async function toggleStaffMemberActive(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    throw new Error("Staff ID is missing.");
  }

  await prisma.staffMember.update({
    where: {
      id,
    },
    data: {
      isActive: !isActive,
    },
  });

  revalidateStaffPages();
}

export async function deleteStaffMember(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Staff ID is missing.");
  }

  await prisma.staffMember.delete({
    where: {
      id,
    },
  });

    await normalizeStaffOrder();

  revalidateStaffPages();
  redirect("/admin?tab=staff");
}

export async function reorderStaffMembers(formData: FormData) {
  await requireAdmin();

  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error("Staff order is missing.");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.staffMember.update({
        where: {
          id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );

  revalidateStaffPages();
}
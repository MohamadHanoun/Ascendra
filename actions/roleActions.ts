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

function revalidateRolePages() {
  revalidatePath("/admin");
  revalidatePath("/roles");
  revalidatePath("/api/roles");
  revalidatePath("/");
}

async function normalizeRoleOrder() {
  const roles = await prisma.role.findMany({
    orderBy: {
      order: "asc",
    },
  });

  await prisma.$transaction(
    roles.map((role, index) =>
      prisma.role.update({
        where: {
          id: role.id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );
}

export async function createRole(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "text-green-300").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name || !description) {
    throw new Error("Role name and description are required.");
  }

  const lastRole = await prisma.role.findFirst({
    orderBy: {
      order: "desc",
    },
  });

  await prisma.role.create({
    data: {
      name,
      color,
      description,
      order: (lastRole?.order || 0) + 1,
      isActive: true,
    },
  });

  revalidateRolePages();
  redirect("/admin?tab=roles");
}

export async function updateRole(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "text-green-300").trim();
  const description = String(formData.get("description") || "").trim();

  if (!id || !name || !description) {
    throw new Error("Role ID, name, and description are required.");
  }

  await prisma.role.update({
    where: {
      id,
    },
    data: {
      name,
      color,
      description,
    },
  });

  revalidateRolePages();
  redirect("/admin?tab=roles");
}

export async function toggleRoleActive(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    throw new Error("Role ID is missing.");
  }

  await prisma.role.update({
    where: {
      id,
    },
    data: {
      isActive: !isActive,
    },
  });

  revalidateRolePages();
  redirect("/admin?tab=roles");
}

export async function deleteRole(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Role ID is missing.");
  }

  await prisma.role.delete({
    where: {
      id,
    },
  });

  await normalizeRoleOrder();

  revalidateRolePages();
}

export async function reorderRoles(formData: FormData) {
  await requireAdmin();

  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error("Role order is missing.");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.role.update({
        where: {
          id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );

  revalidateRolePages();
}
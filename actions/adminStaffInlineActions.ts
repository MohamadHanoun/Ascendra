"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminStaffActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function success(message: string): AdminStaffActionResult {
  return {
    ok: true,
    message,
  };
}

function fail(message: string, redirectTo?: string): AdminStaffActionResult {
  return {
    ok: false,
    message,
    redirectTo,
  };
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function getNumber(formData: FormData, name: string) {
  const value = Number(formData.get(name));

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

async function requireAdmin(): Promise<AdminStaffActionResult | null> {
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
    return fail("Only RTN admins can manage staff.");
  }

  return null;
}

export async function createStaffInline(
  formData: FormData,
): Promise<AdminStaffActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const name = getValue(formData, "name");
  const role = getValue(formData, "role");
  const status = getValue(formData, "status") || "active";

  if (!name) {
    return fail("Staff name is required.");
  }

  if (!role) {
    return fail("Staff role is required.");
  }

  const lastStaff = await prisma.staffMember.findFirst({
    orderBy: {
      order: "desc",
    },
  });

  await prisma.staffMember.create({
    data: {
      name,
      role,
      status,
      order: lastStaff ? lastStaff.order + 1 : 1,
      isActive: true,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/staff");

  return success("Staff member created successfully.");
}

export async function updateStaffInline(
  formData: FormData,
): Promise<AdminStaffActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const staffId = getValue(formData, "staffId") || getValue(formData, "id");
  const name = getValue(formData, "name");
  const role = getValue(formData, "role");
  const status = getValue(formData, "status") || "active";
  const order = getNumber(formData, "order");

  if (!staffId) {
    return fail("Staff ID is missing.");
  }

  if (!name) {
    return fail("Staff name is required.");
  }

  if (!role) {
    return fail("Staff role is required.");
  }

  if (!order || order < 1) {
    return fail("Staff order must be at least 1.");
  }

  const staffMember = await prisma.staffMember.findUnique({
    where: {
      id: staffId,
    },
  });

  if (!staffMember) {
    return fail("Staff member was not found.");
  }

  await prisma.staffMember.update({
    where: {
      id: staffMember.id,
    },
    data: {
      name,
      role,
      status,
      order,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/staff");

  return success("Staff member updated successfully.");
}

export async function activateStaffInline(
  formData: FormData,
): Promise<AdminStaffActionResult> {
  return setStaffActiveStatus(formData, true);
}

export async function deactivateStaffInline(
  formData: FormData,
): Promise<AdminStaffActionResult> {
  return setStaffActiveStatus(formData, false);
}

async function setStaffActiveStatus(
  formData: FormData,
  isActive: boolean,
): Promise<AdminStaffActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const staffId = getValue(formData, "staffId") || getValue(formData, "id");

  if (!staffId) {
    return fail("Staff ID is missing.");
  }

  const staffMember = await prisma.staffMember.findUnique({
    where: {
      id: staffId,
    },
  });

  if (!staffMember) {
    return fail("Staff member was not found.");
  }

  await prisma.staffMember.update({
    where: {
      id: staffMember.id,
    },
    data: {
      isActive,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/staff");

  return success(
    isActive ? "Staff member activated." : "Staff member deactivated.",
  );
}

export async function deleteStaffInline(
  formData: FormData,
): Promise<AdminStaffActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const staffId = getValue(formData, "staffId") || getValue(formData, "id");

  if (!staffId) {
    return fail("Staff ID is missing.");
  }

  const staffMember = await prisma.staffMember.findUnique({
    where: {
      id: staffId,
    },
  });

  if (!staffMember) {
    return fail("Staff member was not found.");
  }

  await prisma.staffMember.delete({
    where: {
      id: staffMember.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/staff");

  return success("Staff member deleted successfully.");
}

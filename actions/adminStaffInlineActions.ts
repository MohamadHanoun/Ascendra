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

function revalidateStaffPaths() {
  revalidatePath("/admin");
  revalidatePath("/staff");
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
    return fail("Only Ascendra admins can manage staff.");
  }

  return null;
}

async function normalizeStaffOrders() {
  const staffMembers = await prisma.staffMember.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  if (staffMembers.length === 0) {
    return;
  }

  await prisma.$transaction(
    staffMembers.map((staffMember, index) =>
      prisma.staffMember.update({
        where: {
          id: staffMember.id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );
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

  const staffCount = await prisma.staffMember.count();

  await prisma.staffMember.create({
    data: {
      name,
      role,
      status,
      order: staffCount + 1,
      isActive: true,
    },
  });

  await normalizeStaffOrders();

  revalidateStaffPaths();

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

  await prisma.$transaction(async (tx) => {
    await tx.staffMember.update({
      where: {
        id: staffMember.id,
      },
      data: {
        name,
        role,
        status,
      },
    });

    const orderedStaffMembers = await tx.staffMember.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    const otherStaffIds = orderedStaffMembers
      .filter((currentStaffMember) => currentStaffMember.id !== staffMember.id)
      .map((currentStaffMember) => currentStaffMember.id);

    const targetOrder = Math.min(order, orderedStaffMembers.length);
    const reorderedStaffIds = [...otherStaffIds];

    reorderedStaffIds.splice(targetOrder - 1, 0, staffMember.id);

    for (const [index, currentStaffId] of reorderedStaffIds.entries()) {
      await tx.staffMember.update({
        where: {
          id: currentStaffId,
        },
        data: {
          order: index + 1,
        },
      });
    }
  });

  revalidateStaffPaths();

  return success("Staff member updated successfully.");
}

export async function reorderStaffInline(
  formData: FormData,
): Promise<AdminStaffActionResult> {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const rawStaffIds = getValue(formData, "orderedStaffIds");

  if (!rawStaffIds) {
    return fail("Staff order is missing.");
  }

  let orderedStaffIds: string[];

  try {
    const parsed = JSON.parse(rawStaffIds);

    if (!Array.isArray(parsed)) {
      return fail("Staff order is invalid.");
    }

    orderedStaffIds = parsed
      .map((value) => String(value || "").trim())
      .filter(Boolean);
  } catch {
    return fail("Staff order is invalid.");
  }

  if (orderedStaffIds.length === 0) {
    return fail("Staff order is empty.");
  }

  const uniqueStaffIds = new Set(orderedStaffIds);

  if (uniqueStaffIds.size !== orderedStaffIds.length) {
    return fail("Staff order contains duplicate staff members.");
  }

  const existingStaffMembers = await prisma.staffMember.findMany({
    select: {
      id: true,
    },
  });

  const existingStaffIds = new Set(
    existingStaffMembers.map((staffMember) => staffMember.id),
  );

  if (orderedStaffIds.length !== existingStaffMembers.length) {
    return fail("Staff order does not match the current staff list.");
  }

  const hasInvalidStaffMember = orderedStaffIds.some(
    (staffId) => !existingStaffIds.has(staffId),
  );

  if (hasInvalidStaffMember) {
    return fail("Staff order contains an unknown staff member.");
  }

  await prisma.$transaction(
    orderedStaffIds.map((staffId, index) =>
      prisma.staffMember.update({
        where: {
          id: staffId,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );

  revalidateStaffPaths();

  return success("Staff order updated.");
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

  revalidateStaffPaths();

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

  await prisma.$transaction(async (tx) => {
    await tx.staffMember.delete({
      where: {
        id: staffMember.id,
      },
    });

    const remainingStaffMembers = await tx.staffMember.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    for (const [
      index,
      remainingStaffMember,
    ] of remainingStaffMembers.entries()) {
      await tx.staffMember.update({
        where: {
          id: remainingStaffMember.id,
        },
        data: {
          order: index + 1,
        },
      });
    }
  });

  revalidateStaffPaths();

  return success("Staff member deleted successfully.");
}

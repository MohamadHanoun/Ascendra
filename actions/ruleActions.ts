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

function revalidateRulePages() {
  revalidatePath("/admin");
  revalidatePath("/rules");
  revalidatePath("/api/rules");
  revalidatePath("/");
}

async function normalizeRuleOrder() {
  const rules = await prisma.rule.findMany({
    orderBy: {
      order: "asc",
    },
  });

  await prisma.$transaction(
    rules.map((rule, index) =>
      prisma.rule.update({
        where: {
          id: rule.id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );
}

export async function createRule(formData: FormData) {
  await requireAdmin();

  const text = String(formData.get("text") || "").trim();

  if (!text) {
    throw new Error("Rule text is required.");
  }

  const lastRule = await prisma.rule.findFirst({
    orderBy: {
      order: "desc",
    },
  });

  await prisma.rule.create({
    data: {
      text,
      order: (lastRule?.order || 0) + 1,
      isActive: true,
    },
  });

  revalidateRulePages();
  redirect("/admin?tab=rules");
}

export async function toggleRuleActive(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const isActive = formData.get("isActive") === "true";

  if (!id) {
    throw new Error("Rule ID is missing.");
  }

  await prisma.rule.update({
    where: {
      id,
    },
    data: {
      isActive: !isActive,
    },
  });

  revalidateRulePages();
  redirect("/admin?tab=rules");
}

export async function deleteRule(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Rule ID is missing.");
  }

  await prisma.rule.delete({
    where: {
      id,
    },
  });

  await normalizeRuleOrder();

  revalidateRulePages();
}

export async function reorderRules(formData: FormData) {
  await requireAdmin();

  const ids = String(formData.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error("Rule order is missing.");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.rule.update({
        where: {
          id,
        },
        data: {
          order: index + 1,
        },
      }),
    ),
  );

  revalidateRulePages();
}
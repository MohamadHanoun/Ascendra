"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/login");
  }
}

function redirectWithMessage(message: string): never {
  redirect(`/admin?tab=registrations&message=${encodeURIComponent(message)}`);
}

function redirectWithError(error: string): never {
  redirect(`/admin?tab=registrations&error=${encodeURIComponent(error)}`);
}

export async function approveTournamentRegistration(formData: FormData) {
  await requireAdmin();

  const registrationId = String(formData.get("registrationId") || "").trim();

  if (!registrationId) {
    redirectWithError("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
  });

  if (!registration) {
    redirectWithError("Registration was not found.");
  }

  if (registration.status === "approved") {
    redirectWithError("Registration is already approved.");
  }

  if (registration.status === "cancelled") {
    redirectWithError("Cancelled registrations cannot be approved.");
  }

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "approved",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/tournaments");
  revalidatePath("/profile");

  redirectWithMessage("Registration approved successfully.");
}

export async function cancelTournamentRegistrationAsAdmin(formData: FormData) {
  await requireAdmin();

  const registrationId = String(formData.get("registrationId") || "").trim();

  if (!registrationId) {
    redirectWithError("Registration ID is missing.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
  });

  if (!registration) {
    redirectWithError("Registration was not found.");
  }

  if (registration.status === "cancelled") {
    redirectWithError("Registration is already cancelled.");
  }

  await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "cancelled",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/tournaments");
  revalidatePath("/profile");

  redirectWithMessage("Registration cancelled.");
}

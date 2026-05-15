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

function revalidateTournamentPages() {
  revalidatePath("/admin");
  revalidatePath("/tournaments");
  revalidatePath("/api/tournaments");
  revalidatePath("/stats");
  revalidatePath("/api/stats");
  revalidatePath("/");
}

export async function createTournament(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const game = String(formData.get("game") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const prize = String(formData.get("prize") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const status = String(formData.get("status") || "upcoming").trim();

  const maxSlotsValue = Number(formData.get("maxSlots"));
  const maxSlots =
    Number.isFinite(maxSlotsValue) && maxSlotsValue > 0 ? maxSlotsValue : 16;

  if (!title || !game || !date || !prize || !description) {
    throw new Error("Title, game, date, prize, and description are required.");
  }

  await prisma.tournament.create({
    data: {
      title,
      game,
      date,
      prize,
      description,
      maxSlots,
      status,
    },
  });

  revalidateTournamentPages();
  redirect("/admin?tab=tournaments");
}

export async function updateTournamentStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!id || !status) {
    throw new Error("Tournament ID and status are required.");
  }

  await prisma.tournament.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });

  revalidateTournamentPages();
  redirect("/admin?tab=tournaments");
}

export async function deleteTournament(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Tournament ID is missing.");
  }

  await prisma.tournament.delete({
    where: {
      id,
    },
  });

  revalidateTournamentPages();
  redirect("/admin?tab=tournaments");
}
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedTournamentStatuses = ["open", "upcoming", "closed"];
const allowedRegistrationStatuses = ["open", "closed"];

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/login");
  }

  return session.user;
}

function adminRedirect(message: string): never {
  redirect(`/admin?tab=tournaments&message=${encodeURIComponent(message)}`);
}

function adminError(error: string): never {
  redirect(
    `/admin?tab=tournaments&type=error&message=${encodeURIComponent(error)}`,
  );
}

function getRequiredText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getRequiredNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));

  if (!Number.isFinite(value) || value < 1) {
    adminError(`${key} must be a valid number.`);
  }

  return value;
}

export async function createTournament(formData: FormData) {
  await requireAdmin();

  const title = getRequiredText(formData, "title");
  const gameSlug = getRequiredText(formData, "gameSlug");
  const prize = getRequiredText(formData, "prize");
  const description = getRequiredText(formData, "description");
  const status = getRequiredText(formData, "status");
  const registrationStatus = getRequiredText(formData, "registrationStatus");

  const maxTeams = getRequiredNumber(formData, "maxTeams");
  const teamSize = getRequiredNumber(formData, "teamSize");

  if (!title || !gameSlug || !prize || !description) {
    adminError("All tournament fields are required.");
  }

  if (!allowedTournamentStatuses.includes(status)) {
    adminError("Invalid tournament status.");
  }

  if (!allowedRegistrationStatuses.includes(registrationStatus)) {
    adminError("Invalid registration status.");
  }

  const game = await prisma.game.findUnique({ where: { slug: gameSlug } });

  if (!game) {
    adminError("Invalid game selected.");
  }

  await prisma.tournament.create({
    data: {
      title,
      gameId: game.id,
      prize,
      description,
      maxTeams,
      teamSize,
      status,
      registrationStatus,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/tournaments");

  adminRedirect("Tournament created successfully.");
}

export async function updateTournament(formData: FormData) {
  await requireAdmin();

  const id = getRequiredText(formData, "id");
  const title = getRequiredText(formData, "title");
  const gameSlug = getRequiredText(formData, "gameSlug");
  const prize = getRequiredText(formData, "prize");
  const description = getRequiredText(formData, "description");
  const status = getRequiredText(formData, "status");

  const registrationStatus =
    getRequiredText(formData, "registrationStatus") || "closed";

  const maxTeams = getRequiredNumber(formData, "maxTeams");

  const rawTeamSize = formData.get("teamSize");
  const teamSize =
    rawTeamSize === null || rawTeamSize === ""
      ? 1
      : getRequiredNumber(formData, "teamSize");

  if (!id) {
    adminError("Tournament ID is missing.");
  }

  if (!title || !gameSlug || !prize || !description) {
    adminError("All tournament fields are required.");
  }

  if (!allowedTournamentStatuses.includes(status)) {
    adminError("Invalid tournament status.");
  }

  if (!allowedRegistrationStatuses.includes(registrationStatus)) {
    adminError("Invalid registration status.");
  }

  const game = await prisma.game.findUnique({ where: { slug: gameSlug } });

  if (!game) {
    adminError("Invalid game selected.");
  }

  await prisma.tournament.update({
    where: { id },
    data: {
      title,
      gameId: game.id,
      prize,
      description,
      maxTeams,
      teamSize,
      status,
      registrationStatus,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/tournaments");

  adminRedirect("Tournament updated successfully.");
}

export async function deleteTournament(formData: FormData) {
  await requireAdmin();

  const id =
    getRequiredText(formData, "id") || getRequiredText(formData, "teamId");

  if (!id) {
    adminError("Tournament ID is missing.");
  }

  await prisma.tournament.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/tournaments");

  adminRedirect("Tournament deleted successfully.");
}

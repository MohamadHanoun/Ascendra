"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSupportedTournamentFormat } from "@/lib/tournamentFormatSupport";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedTournamentStatuses = ["open", "upcoming", "closed"];
const allowedRegistrationStatuses = ["open", "closed"];
const allowedVisibility = ["public", "private"];

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

function getOptionalNumber(
  formData: FormData,
  key: string,
  defaultValue: number,
): number {
  const raw = formData.get(key);
  if (raw === null || String(raw).trim() === "") return defaultValue;
  const value = Number(raw);
  return Number.isFinite(value) ? value : defaultValue;
}

function getOptionalDate(formData: FormData, key: string): Date | null {
  const raw = String(formData.get(key) || "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
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
  const minTeams = getOptionalNumber(formData, "minTeams", 2);
  const substitutesAllowed = getOptionalNumber(
    formData,
    "substitutesAllowed",
    0,
  );
  const bestOf = getOptionalNumber(formData, "bestOf", 1);

  const format =
    getRequiredText(formData, "format") || "single_elimination";
  const visibility =
    getRequiredText(formData, "visibility") || "public";
  const region = getRequiredText(formData, "region") || null;
  const platform = getRequiredText(formData, "platform") || null;

  const startsAt = getOptionalDate(formData, "startsAt");
  const endsAt = getOptionalDate(formData, "endsAt");
  const registrationOpensAt = getOptionalDate(
    formData,
    "registrationOpensAt",
  );
  const registrationClosesAt = getOptionalDate(
    formData,
    "registrationClosesAt",
  );

  if (!title || !gameSlug || !prize || !description) {
    adminError("All tournament fields are required.");
  }

  if (!allowedTournamentStatuses.includes(status)) {
    adminError("Invalid tournament status.");
  }

  if (!allowedRegistrationStatuses.includes(registrationStatus)) {
    adminError("Invalid registration status.");
  }

  if (!isSupportedTournamentFormat(format)) {
    adminError(
      "Only Single Elimination format is currently supported. Other formats are coming soon.",
    );
  }

  if (!allowedVisibility.includes(visibility)) {
    adminError("Invalid visibility value.");
  }

  if (minTeams > maxTeams) {
    adminError("Min teams cannot be greater than max teams.");
  }

  if (startsAt && endsAt && endsAt <= startsAt) {
    adminError("End date must be after start date.");
  }

  if (
    registrationOpensAt &&
    registrationClosesAt &&
    registrationClosesAt <= registrationOpensAt
  ) {
    adminError(
      "Registration close date must be after registration open date.",
    );
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
      minTeams,
      teamSize,
      substitutesAllowed,
      bestOf,
      format,
      visibility,
      region,
      platform,
      status,
      registrationStatus,
      startsAt,
      endsAt,
      registrationOpensAt,
      registrationClosesAt,
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

  const minTeams = getOptionalNumber(formData, "minTeams", 2);
  const substitutesAllowed = getOptionalNumber(
    formData,
    "substitutesAllowed",
    0,
  );
  const bestOf = getOptionalNumber(formData, "bestOf", 1);

  const format =
    getRequiredText(formData, "format") || "single_elimination";
  const visibility =
    getRequiredText(formData, "visibility") || "public";
  const region = getRequiredText(formData, "region") || null;
  const platform = getRequiredText(formData, "platform") || null;

  const startsAt = getOptionalDate(formData, "startsAt");
  const endsAt = getOptionalDate(formData, "endsAt");
  const registrationOpensAt = getOptionalDate(
    formData,
    "registrationOpensAt",
  );
  const registrationClosesAt = getOptionalDate(
    formData,
    "registrationClosesAt",
  );

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

  if (!isSupportedTournamentFormat(format)) {
    adminError(
      "Only Single Elimination format is currently supported. Other formats are coming soon.",
    );
  }

  if (!allowedVisibility.includes(visibility)) {
    adminError("Invalid visibility value.");
  }

  if (minTeams > maxTeams) {
    adminError("Min teams cannot be greater than max teams.");
  }

  if (startsAt && endsAt && endsAt <= startsAt) {
    adminError("End date must be after start date.");
  }

  if (
    registrationOpensAt &&
    registrationClosesAt &&
    registrationClosesAt <= registrationOpensAt
  ) {
    adminError(
      "Registration close date must be after registration open date.",
    );
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
      minTeams,
      teamSize,
      substitutesAllowed,
      bestOf,
      format,
      visibility,
      region,
      platform,
      status,
      registrationStatus,
      startsAt,
      endsAt,
      registrationOpensAt,
      registrationClosesAt,
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

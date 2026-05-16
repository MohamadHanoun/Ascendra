"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedGames = ["Valorant", "League of Legends", "CS2", "Dota2"];

export async function createTeam(formData: FormData) {
  const session = await auth();

  if (!session?.user?.databaseId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.databaseId,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.isGuildMember) {
    throw new Error(
      "You must be a member of the RTN Discord server to create a team.",
    );
  }

  const name = String(formData.get("name") || "").trim();
  const game = String(formData.get("game") || "").trim();

  if (!name || !game) {
    throw new Error("Team name and game are required.");
  }

  if (!allowedGames.includes(game)) {
    throw new Error("Invalid game selected.");
  }

  await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name,
        game,
        leaderId: user.id,
        status: "draft",
      },
    });

    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: "leader",
      },
    });
  });

  revalidatePath("/profile");
  redirect("/profile");
}

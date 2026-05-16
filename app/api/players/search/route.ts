import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.databaseId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const teamId = searchParams.get("teamId")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.databaseId,
    },
  });

  if (!currentUser?.isGuildMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const excludedUserIds = new Set<string>([currentUser.id]);

  if (teamId) {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        members: true,
        invites: {
          where: {
            status: "pending",
          },
        },
      },
    });

    if (team && team.leaderId === currentUser.id) {
      team.members.forEach((member) => excludedUserIds.add(member.userId));
      team.invites.forEach((invite) =>
        excludedUserIds.add(invite.invitedUserId),
      );
    }
  }

  const players = await prisma.user.findMany({
    where: {
      isGuildMember: true,
      id: {
        notIn: Array.from(excludedUserIds),
      },
      OR: [
        {
          username: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          discordId: query,
        },
      ],
    },
    select: {
      id: true,
      username: true,
      avatar: true,
    },
    orderBy: {
      username: "asc",
    },
    take: 8,
  });

  return NextResponse.json(players);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [
      rulesCount,
      rolesCount,
      staffCount,
      tournamentsCount,
      announcementsCount,
      usersCount,
    ] = await Promise.all([
      prisma.rule.count({ where: { isActive: true } }),
      prisma.role.count({ where: { isActive: true } }),
      prisma.staffMember.count({ where: { isActive: true } }),
      prisma.tournament.count(),
      prisma.announcement.count({ where: { published: true } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      success: true,
      source: "database",
      data: {
        summary: [
          { label: "Rules", value: String(rulesCount) },
          { label: "Roles", value: String(rolesCount) },
          { label: "Staff", value: String(staffCount) },
          { label: "Tournaments", value: String(tournamentsCount) },
        ],
        details: [
          
          {
            title: "Roles",
            value: String(rolesCount),
            description: "Active RTN roles prepared for future Discord sync.",
          },
          {
            title: "Staff Members",
            value: String(staffCount),
            description: "Staff profiles currently stored in the database.",
          },
          {
            title: "Tournaments",
            value: String(tournamentsCount),
            description: "Tournament records prepared for future registration.",
          },
          {
            title: "Announcements",
            value: String(announcementsCount),
            description: "Published announcements stored in the database.",
          },
          {
            title: "Registered Users",
            value: String(usersCount),
            description:
              "Users will appear here later after Discord login and XP tracking are connected.",
          },
        ],
      },
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stats",
      },
      { status: 500 },
    );
  }
}
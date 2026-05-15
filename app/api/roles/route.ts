import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      source: "database",
      data: roles,
    });
  } catch (error) {
    console.error("Failed to fetch roles:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch roles",
      },
      { status: 500 },
    );
  }
}

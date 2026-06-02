import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";

const rateLimiter = createRateLimiter(60, 60_000);

export async function GET(request: Request) {
  const limited = rateLimiter(request);
  if (limited) return limited;
  try {
    const staff = await prisma.staffMember.findMany({
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
      data: staff,
    });
  } catch (error) {
    console.error("Failed to fetch staff:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch staff",
      },
      { status: 500 },
    );
  }
}
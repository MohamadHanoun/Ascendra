import { NextRequest, NextResponse } from "next/server";

import { isBotAuthorized } from "@/lib/botAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isBotAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const query = request.nextUrl.searchParams.get("query")?.trim() || "";

  if (!query) {
    return NextResponse.json({ success: true, match: null });
  }

  const match = await prisma.tournamentMatch.findFirst({
    where: {
      OR: [
        { id: query },
        {
          tournament: {
            title: { contains: query, mode: "insensitive" },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tournamentId: true,
      roundNumber: true,
      matchNumber: true,
      status: true,
      teamAId: true,
      teamBId: true,
      winnerTeamId: true,
      scheduledAt: true,
      completedAt: true,
      isBye: true,
      tournament: {
        select: {
          id: true,
          title: true,
          game: { select: { name: true } },
        },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          teamAScore: true,
          teamBScore: true,
          status: true,
        },
      },
    },
  });

  if (!match) {
    return NextResponse.json({ success: true, match: null });
  }

  const teamIds = [match.teamAId, match.teamBId, match.winnerTeamId].filter(
    (id): id is string => id !== null && id !== undefined,
  );

  const teams =
    teamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: teamIds } },
          select: { id: true, name: true },
        })
      : [];

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const report = match.reports[0] ?? null;

  return NextResponse.json({
    success: true,
    match: {
      id: match.id,
      tournamentId: match.tournamentId,
      tournamentTitle: match.tournament.title,
      tournamentGame: match.tournament.game?.name ?? null,
      roundNumber: match.roundNumber,
      matchNumber: match.matchNumber,
      status: match.status,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      winnerTeamId: match.winnerTeamId,
      teamAName: match.teamAId ? (teamMap.get(match.teamAId) ?? null) : null,
      teamBName: match.teamBId ? (teamMap.get(match.teamBId) ?? null) : null,
      winnerName: match.winnerTeamId
        ? (teamMap.get(match.winnerTeamId) ?? null)
        : null,
      scheduledAt: match.scheduledAt?.toISOString() ?? null,
      completedAt: match.completedAt?.toISOString() ?? null,
      isBye: match.isBye,
      report: report
        ? {
            teamAScore: report.teamAScore,
            teamBScore: report.teamBScore,
            status: report.status,
          }
        : null,
    },
  });
}

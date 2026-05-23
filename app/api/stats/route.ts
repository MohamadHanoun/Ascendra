import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const games = ["Valorant", "League of Legends", "CS2", "Dota2"];

export async function GET() {
  try {
    const [
      rulesCount,
      rolesCount,
      staffCount,
      tournamentsCount,
      announcementsCount,
      usersCount,
      teamsCount,
      approvedRegistrationsCount,
      tournamentResults,
      tournamentPoints,
      tournamentsByGame,
    ] = await Promise.all([
      prisma.rule.count({ where: { isActive: true } }),
      prisma.role.count({ where: { isActive: true } }),
      prisma.staffMember.count({ where: { isActive: true } }),
      prisma.tournament.count(),
      prisma.announcement.count({ where: { published: true } }),
      prisma.user.count(),
      prisma.team.count(),
      prisma.tournamentRegistration.count({
        where: {
          status: "approved",
        },
      }),
      prisma.tournamentResult.findMany({
        select: {
          points: true,
          tournament: {
            select: {
              game: { select: { name: true } },
            },
          },
        },
      }),
      prisma.tournamentResult.aggregate({
        _sum: {
          points: true,
        },
      }),
      prisma.tournament.findMany({
        select: {
          game: { select: { name: true } },
        },
        where: {
          gameId: { not: null },
        },
      }),
    ]);

    const totalTournamentPoints = tournamentPoints._sum.points || 0;

    const gameBreakdown = games.map((game) => {
      const gameResults = tournamentResults.filter(
        (result) => result.tournament.game?.name === game,
      );

      const gamePoints = gameResults.reduce(
        (total, result) => total + result.points,
        0,
      );

      const gameTournamentCount = tournamentsByGame.filter(
        (item) => item.game?.name === game,
      ).length;

      return {
        game,
        tournaments: gameTournamentCount,
        results: gameResults.length,
        points: gamePoints,
      };
    });

    return NextResponse.json({
      success: true,
      source: "database",
      data: {
        summary: [
          { label: "Players", value: String(usersCount) },
          { label: "Teams", value: String(teamsCount) },
          { label: "Tournaments", value: String(tournamentsCount) },
          { label: "Results", value: String(tournamentResults.length) },
          { label: "Points", value: String(totalTournamentPoints) },
        ],
        details: [
          {
            title: "Players",
            value: String(usersCount),
            description: "Players who have logged in with Discord.",
          },
          {
            title: "Teams",
            value: String(teamsCount),
            description: "Teams created by Ascendra players.",
          },
          {
            title: "Tournaments",
            value: String(tournamentsCount),
            description: "Tournament records available on Ascendra.",
          },
          {
            title: "Tournament Results",
            value: String(tournamentResults.length),
            description: "Final tournament results saved by admins.",
          },
          {
            title: "Tournament Points",
            value: String(totalTournamentPoints),
            description: "Total points awarded from tournament results.",
          },
          {
            title: "Approved Registrations",
            value: String(approvedRegistrationsCount),
            description: "Tournament registrations approved by admins.",
          },
          {
            title: "Announcements",
            value: String(announcementsCount),
            description: "Published community announcements.",
          },
          {
            title: "Rules",
            value: String(rulesCount),
            description: "Active community rules.",
          },
          {
            title: "Roles",
            value: String(rolesCount),
            description: "Active community roles.",
          },
          {
            title: "Staff",
            value: String(staffCount),
            description: "Visible staff members.",
          },
        ],
        gameBreakdown,
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

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type SearchResultType =
  | "tournament"
  | "announcement"
  | "rule"
  | "role"
  | "staff"
  | "team"
  | "player";

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  href: string;
};

const minQueryLength = 2;
const maxQueryLength = 80;
const perGroupLimit = 4;
const maxResults = 20;

function normalizeQuery(value: string | null) {
  return (value || "").trim().slice(0, maxQueryLength);
}

function compactText(value: string | null | undefined, fallback = "") {
  const text = (value || fallback).replace(/\s+/g, " ").trim();

  if (text.length <= 120) {
    return text;
  }

  return `${text.slice(0, 117)}...`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeQuery(searchParams.get("q"));

  if (query.length < minQueryLength) {
    return NextResponse.json([]);
  }

  const textSearch = {
    contains: query,
    mode: "insensitive" as const,
  };

  try {
    const [
      tournaments,
      announcements,
      rules,
      roles,
      staffMembers,
      teams,
      players,
    ] = await Promise.all([
      prisma.tournament.findMany({
        where: {
          visibility: "public",
          status: {
            not: "draft",
          },
          OR: [
            { title: textSearch },
            { description: textSearch },
            { game: { is: { name: textSearch } } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          game: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: perGroupLimit,
      }),

      prisma.announcement.findMany({
        where: {
          published: true,
          OR: [
            { title: textSearch },
            { category: textSearch },
            { description: textSearch },
          ],
        },
        select: {
          id: true,
          title: true,
          category: true,
          description: true,
        },
        orderBy: [
          { important: "desc" },
          { createdAt: "desc" },
        ],
        take: perGroupLimit,
      }),

      prisma.rule.findMany({
        where: {
          isActive: true,
          text: textSearch,
        },
        select: {
          id: true,
          order: true,
          text: true,
        },
        orderBy: {
          order: "asc",
        },
        take: perGroupLimit,
      }),

      prisma.role.findMany({
        where: {
          isActive: true,
          OR: [
            { name: textSearch },
            { description: textSearch },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: {
          order: "asc",
        },
        take: perGroupLimit,
      }),

      prisma.staffMember.findMany({
        where: {
          isActive: true,
          OR: [
            { name: textSearch },
            { role: textSearch },
            { status: textSearch },
          ],
        },
        select: {
          id: true,
          name: true,
          role: true,
          status: true,
        },
        orderBy: {
          order: "asc",
        },
        take: perGroupLimit,
      }),

      prisma.team.findMany({
        where: {
          results: {
            some: {},
          },
          name: textSearch,
        },
        select: {
          id: true,
          name: true,
          game: {
            select: {
              name: true,
            },
          },
          leader: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        take: perGroupLimit,
      }),

      prisma.user.findMany({
        where: {
          username: textSearch,
          teamMemberships: {
            some: {
              team: {
                results: {
                  some: {},
                },
              },
            },
          },
        },
        select: {
          id: true,
          username: true,
          role: true,
        },
        orderBy: {
          username: "asc",
        },
        take: perGroupLimit,
      }),
    ]);

    const results: SearchResult[] = [
      ...tournaments.map((tournament) => ({
        id: tournament.id,
        type: "tournament" as const,
        title: tournament.title,
        description: compactText(
          [tournament.game?.name, tournament.status].filter(Boolean).join(" / "),
          tournament.description,
        ),
        href: `/tournaments/${tournament.id}`,
      })),
      ...announcements.map((announcement) => ({
        id: announcement.id,
        type: "announcement" as const,
        title: announcement.title,
        description: compactText(announcement.description, announcement.category),
        href: "/announcements",
      })),
      ...rules.map((rule) => ({
        id: rule.id,
        type: "rule" as const,
        title: `Rule ${rule.order}`,
        description: compactText(rule.text),
        href: "/rules",
      })),
      ...roles.map((role) => ({
        id: role.id,
        type: "role" as const,
        title: role.name,
        description: compactText(role.description),
        href: "/roles",
      })),
      ...staffMembers.map((member) => ({
        id: member.id,
        type: "staff" as const,
        title: member.name,
        description: compactText(`${member.role} / ${member.status}`),
        href: "/staff",
      })),
      ...teams.map((team) => ({
        id: team.id,
        type: "team" as const,
        title: team.name,
        description: compactText(
          [team.game?.name, `Led by ${team.leader.username}`]
            .filter(Boolean)
            .join(" / "),
        ),
        href: "/leaderboard?type=teams",
      })),
      ...players.map((player) => ({
        id: player.id,
        type: "player" as const,
        title: player.username,
        description: compactText(player.role, "Tournament player"),
        href: "/leaderboard",
      })),
    ];

    return NextResponse.json(results.slice(0, maxResults));
  } catch (error) {
    console.error("Failed to search site:", error);

    return NextResponse.json(
      { message: "Failed to search site" },
      { status: 500 },
    );
  }
}

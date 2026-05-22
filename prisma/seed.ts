import dotenv from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { announcements } from "../data/announcements";
import { serverRoles } from "../data/roles";
import { basicRules } from "../data/rules";
import { staffMembers } from "../data/staff";
import { tournaments } from "../data/tournaments";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Start seeding Ascendra database...");

  await prisma.tournamentRegistration.deleteMany();
  await prisma.teamInvite.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  await prisma.rule.deleteMany();
  await prisma.role.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.serverSetting.deleteMany();

  await prisma.rule.createMany({
    data: basicRules.map((rule: string, index: number) => ({
      text: rule,
      order: index + 1,
      isActive: true,
    })),
  });

  await prisma.role.createMany({
    data: serverRoles.map(
      (
        role: {
          name: string;
          color: string;
          description: string;
        },
        index: number,
      ) => ({
        name: role.name,
        color: role.color,
        description: role.description,
        order: index + 1,
        isActive: true,
      }),
    ),
  });

  await prisma.staffMember.createMany({
    data: staffMembers.map(
      (
        member: {
          name: string;
          role: string;
          status: string;
        },
        index: number,
      ) => ({
        name: member.name,
        role: member.role,
        status: member.status,
        order: index + 1,
        isActive: true,
      }),
    ),
  });

  await prisma.tournament.createMany({
    data: tournaments.map(
      (tournament: {
        title: string;
        game: string;
        description: string;
        date: string;
        prize: string;
        status: string;
      }) => ({
        title: tournament.title,
        game: tournament.game,
        description: tournament.description,
        date: tournament.date,
        prize: tournament.prize,
        maxSlots: 16,
        teamSize: 5,
        status: tournament.status,
        registrationStatus: "open",
      }),
    ),
  });

  await prisma.announcement.createMany({
    data: announcements.map(
      (announcement: {
        title: string;
        category: string;
        description: string;
        important: boolean;
      }) => ({
        title: announcement.title,
        category: announcement.category,
        description: announcement.description,
        important: announcement.important,
        published: true,
      }),
    ),
  });

  await prisma.serverSetting.createMany({
    data: [
      {
        key: "site_name",
        value: "Ascendra",
        description: "Main website and Discord community name.",
      },
      {
        key: "site_short_name",
        value: "Ascendra",
        description: "Short name used for branding.",
      },
      {
        key: "discord_invite_url",
        value: "https://discord.gg/zP8ptXVvKw",
        description: "Main Discord invite link.",
      },
    ],
  });

  console.log("Ascendra database seeded successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

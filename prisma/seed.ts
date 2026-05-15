import dotenv from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { basicRules } from "../data/rules";
import { serverRoles } from "../data/roles";
import { staffMembers } from "../data/staff";
import { tournaments } from "../data/tournaments";
import { announcements } from "../data/announcements";

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
  console.log("Start seeding RTN database...");

  // Delete related data first
  await prisma.tournamentRegistration.deleteMany();
  await prisma.team.deleteMany();
  await prisma.xpLog.deleteMany();
  await prisma.user.deleteMany();

  // Delete content data
  await prisma.rule.deleteMany();
  await prisma.role.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.serverSetting.deleteMany();

  // Rules
  await prisma.rule.createMany({
    data: basicRules.map((rule, index) => ({
      text: rule,
      order: index + 1,
      isActive: true,
    })),
  });

  // Roles
  await prisma.role.createMany({
    data: serverRoles.map((role, index) => ({
      name: role.name,
      color: role.color,
      description: role.description,
      order: index + 1,
      isActive: true,
    })),
  });

  // Staff members
  await prisma.staffMember.createMany({
    data: staffMembers.map((member, index) => ({
      name: member.name,
      role: member.role,
      status: member.status,
      order: index + 1,
      isActive: true,
    })),
  });

  // Tournaments
  await prisma.tournament.createMany({
    data: tournaments.map((tournament) => ({
      title: tournament.title,
      game: tournament.game,
      description: tournament.description,
      date: tournament.date,
      prize: tournament.prize,
      maxSlots: 16,
      status: tournament.status,
    })),
  });

  // Announcements
  await prisma.announcement.createMany({
    data: announcements.map((announcement) => ({
      title: announcement.title,
      category: announcement.category,
      description: announcement.description,
      important: announcement.important,
      published: true,
    })),
  });

  // Server settings
  await prisma.serverSetting.createMany({
    data: [
      {
        key: "site_name",
        value: "The Noobs of Temple & Rift",
        description: "Main website and Discord community name.",
      },
      {
        key: "site_short_name",
        value: "RTN",
        description: "Short name used for branding.",
      },
      {
        key: "discord_invite_url",
        value: "https://discord.gg/zP8ptXVvKw",
        description: "Main Discord invite link.",
      },
    ],
  });

  // Sample XP users for leaderboard
  await prisma.user.createMany({
    data: [
      {
        discordId: "test-user-1",
        username: "Mohamad",
        role: "Founder",
        xp: 12450,
        level: 25,
      },
      {
        discordId: "test-user-2",
        username: "RTN_Player",
        role: "Member",
        xp: 8900,
        level: 18,
      },
      {
        discordId: "test-user-3",
        username: "TempleRunner",
        role: "Tournament Player",
        xp: 6700,
        level: 14,
      },
      {
        discordId: "test-user-4",
        username: "RiftHunter",
        role: "Member",
        xp: 4200,
        level: 9,
      },
    ],
  });

  console.log("RTN database seeded successfully.");
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
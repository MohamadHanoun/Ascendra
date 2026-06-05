-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN     "showDiscordId" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN     "showTeams" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN     "showTournamentHistory" BOOLEAN NOT NULL DEFAULT true;

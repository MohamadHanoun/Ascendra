-- AlterTable
ALTER TABLE "TournamentRegistration" ADD COLUMN     "discordRoleError" TEXT,
ADD COLUMN     "discordRoleId" TEXT,
ADD COLUMN     "discordRoleName" TEXT,
ADD COLUMN     "discordRoleRequestedAt" TIMESTAMP(3),
ADD COLUMN     "discordRoleStatus" TEXT NOT NULL DEFAULT 'not_needed',
ADD COLUMN     "discordRoleSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TournamentRegistration_discordRoleStatus_idx" ON "TournamentRegistration"("discordRoleStatus");

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "discordAnnouncementChannelId" TEXT,
ADD COLUMN     "discordAnnouncementLastError" TEXT,
ADD COLUMN     "discordAnnouncementMessageId" TEXT,
ADD COLUMN     "discordAnnouncementSyncedAt" TIMESTAMP(3),
ADD COLUMN     "discordAnnouncementUrl" TEXT;

-- CreateIndex
CREATE INDEX "Tournament_discordAnnouncementMessageId_idx" ON "Tournament"("discordAnnouncementMessageId");

ALTER TABLE "User" ADD COLUMN "faceitPlayerId" TEXT;
ALTER TABLE "User" ADD COLUMN "faceitNickname" TEXT;
ALTER TABLE "User" ADD COLUMN "faceitAvatar" TEXT;
ALTER TABLE "User" ADD COLUMN "faceitCountry" TEXT;
ALTER TABLE "User" ADD COLUMN "faceitUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "faceitSkillLevelCs2" INTEGER;
ALTER TABLE "User" ADD COLUMN "faceitSteamId64" TEXT;
ALTER TABLE "User" ADD COLUMN "faceitLinkedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_faceitPlayerId_key" ON "User"("faceitPlayerId");

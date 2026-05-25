-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "seasonId" TEXT;

-- CreateTable
CREATE TABLE "RankingSeason" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingPointEvent" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "userId" TEXT,
    "gameId" TEXT,
    "tournamentId" TEXT,
    "matchId" TEXT,
    "seasonId" TEXT,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingPointEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RankingSeason_slug_key" ON "RankingSeason"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RankingPointEvent_dedupeKey_key" ON "RankingPointEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "Tournament_seasonId_idx" ON "Tournament"("seasonId");

-- CreateIndex
CREATE INDEX "RankingPointEvent_teamId_idx" ON "RankingPointEvent"("teamId");

-- CreateIndex
CREATE INDEX "RankingPointEvent_userId_idx" ON "RankingPointEvent"("userId");

-- CreateIndex
CREATE INDEX "RankingPointEvent_gameId_idx" ON "RankingPointEvent"("gameId");

-- CreateIndex
CREATE INDEX "RankingPointEvent_tournamentId_idx" ON "RankingPointEvent"("tournamentId");

-- CreateIndex
CREATE INDEX "RankingPointEvent_matchId_idx" ON "RankingPointEvent"("matchId");

-- CreateIndex
CREATE INDEX "RankingPointEvent_seasonId_idx" ON "RankingPointEvent"("seasonId");

-- CreateIndex
CREATE INDEX "RankingPointEvent_type_idx" ON "RankingPointEvent"("type");

-- CreateIndex
CREATE INDEX "RankingPointEvent_createdAt_idx" ON "RankingPointEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "RankingSeason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingPointEvent" ADD CONSTRAINT "RankingPointEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingPointEvent" ADD CONSTRAINT "RankingPointEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingPointEvent" ADD CONSTRAINT "RankingPointEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingPointEvent" ADD CONSTRAINT "RankingPointEvent_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingPointEvent" ADD CONSTRAINT "RankingPointEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingPointEvent" ADD CONSTRAINT "RankingPointEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "RankingSeason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "teamAId" TEXT,
    "teamBId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bestOf" INTEGER NOT NULL DEFAULT 1,
    "scoreA" INTEGER NOT NULL DEFAULT 0,
    "scoreB" INTEGER NOT NULL DEFAULT 0,
    "winnerTeamId" TEXT,
    "reportedById" TEXT,
    "confirmedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_teamAId_idx" ON "Match"("teamAId");

-- CreateIndex
CREATE INDEX "Match_teamBId_idx" ON "Match"("teamBId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_tournamentId_round_matchNumber_key" ON "Match"("tournamentId", "round", "matchNumber");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

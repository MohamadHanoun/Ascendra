-- CreateTable
CREATE TABLE "TournamentMatchCheckIn" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMatchCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatchCheckIn_matchId_userId_key" ON "TournamentMatchCheckIn"("matchId", "userId");

-- CreateIndex
CREATE INDEX "TournamentMatchCheckIn_matchId_idx" ON "TournamentMatchCheckIn"("matchId");

-- CreateIndex
CREATE INDEX "TournamentMatchCheckIn_teamId_idx" ON "TournamentMatchCheckIn"("teamId");

-- CreateIndex
CREATE INDEX "TournamentMatchCheckIn_userId_idx" ON "TournamentMatchCheckIn"("userId");

-- AddForeignKey
ALTER TABLE "TournamentMatchCheckIn" ADD CONSTRAINT "TournamentMatchCheckIn_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchCheckIn" ADD CONSTRAINT "TournamentMatchCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchCheckIn" ADD CONSTRAINT "TournamentMatchCheckIn_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

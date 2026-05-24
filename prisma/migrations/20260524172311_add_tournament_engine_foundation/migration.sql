-- CreateEnum
CREATE TYPE "GameProvider" AS ENUM ('manual', 'riot_lol', 'riot_valorant', 'steam_dota2', 'steam_cs2', 'dedicated_server', 'third_party');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'ready', 'room_created', 'in_progress', 'result_pending', 'disputed', 'confirmed', 'completed', 'cancelled', 'forfeit', 'bye');

-- CreateEnum
CREATE TYPE "MatchGameStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('submitted', 'confirmed', 'rejected', 'superseded');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('received', 'processing', 'processed', 'failed', 'duplicate');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('success', 'failure', 'retrying');

-- CreateTable
CREATE TABLE "GameIntegration" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGameAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "displayName" TEXT,
    "region" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerGameAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "teamAId" TEXT,
    "teamBId" TEXT,
    "winnerTeamId" TEXT,
    "bestOf" INTEGER NOT NULL DEFAULT 1,
    "nextMatchId" TEXT,
    "nextMatchSlot" TEXT,
    "isBye" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatchGame" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "status" "MatchGameStatus" NOT NULL DEFAULT 'pending',
    "teamAScore" INTEGER NOT NULL DEFAULT 0,
    "teamBScore" INTEGER NOT NULL DEFAULT 0,
    "winnerTeamId" TEXT,
    "externalMatchId" TEXT,
    "externalRoomId" TEXT,
    "rawResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMatchGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchReport" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "winnerTeamId" TEXT NOT NULL,
    "teamAScore" INTEGER NOT NULL,
    "teamBScore" INTEGER NOT NULL,
    "evidenceUrl" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'submitted',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRoom" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "roomCode" TEXT,
    "joinUrl" TEXT,
    "password" TEXT,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "externalId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'received',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameApiAuditLog" (
    "id" TEXT NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "action" TEXT NOT NULL,
    "request" JSONB,
    "response" JSONB,
    "status" "AuditStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameApiAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameIntegration_provider_idx" ON "GameIntegration"("provider");

-- CreateIndex
CREATE INDEX "GameIntegration_gameId_idx" ON "GameIntegration"("gameId");

-- CreateIndex
CREATE INDEX "PlayerGameAccount_userId_idx" ON "PlayerGameAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameAccount_provider_externalId_key" ON "PlayerGameAccount"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameAccount_userId_provider_key" ON "PlayerGameAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_idx" ON "TournamentMatch"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentMatch_status_idx" ON "TournamentMatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_tournamentId_roundNumber_matchNumber_key" ON "TournamentMatch"("tournamentId", "roundNumber", "matchNumber");

-- CreateIndex
CREATE INDEX "TournamentMatchGame_externalMatchId_idx" ON "TournamentMatchGame"("externalMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatchGame_matchId_gameNumber_key" ON "TournamentMatchGame"("matchId", "gameNumber");

-- CreateIndex
CREATE INDEX "MatchReport_matchId_idx" ON "MatchReport"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRoom_matchId_key" ON "GameRoom"("matchId");

-- CreateIndex
CREATE INDEX "GameRoom_matchId_idx" ON "GameRoom"("matchId");

-- CreateIndex
CREATE INDEX "GameWebhookEvent_status_idx" ON "GameWebhookEvent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GameWebhookEvent_provider_idempotencyKey_key" ON "GameWebhookEvent"("provider", "idempotencyKey");

-- CreateIndex
CREATE INDEX "GameApiAuditLog_provider_action_idx" ON "GameApiAuditLog"("provider", "action");

-- AddForeignKey
ALTER TABLE "GameIntegration" ADD CONSTRAINT "GameIntegration_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameAccount" ADD CONSTRAINT "PlayerGameAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "TournamentMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchGame" ADD CONSTRAINT "TournamentMatchGame_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRoom" ADD CONSTRAINT "GameRoom_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

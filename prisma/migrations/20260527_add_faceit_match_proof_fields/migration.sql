-- FACEIT CS2 match proof fields on TournamentMatch (Phase 3)
-- These fields store FACEIT-sourced proof only. They never auto-update
-- the official match result, winner, or bracket advancement.

ALTER TABLE "TournamentMatch" ADD COLUMN "faceitMatchId" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitMatchUrl" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitStatus" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitDemoUrl" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitMap" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitScoreRaw" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitFaction1Score" INTEGER;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitFaction2Score" INTEGER;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitWinnerFaceitTeamId" TEXT;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitParsedResult" JSONB;
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitSyncedAt" TIMESTAMP(3);
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "TournamentMatch_faceitMatchId_key" ON "TournamentMatch"("faceitMatchId");

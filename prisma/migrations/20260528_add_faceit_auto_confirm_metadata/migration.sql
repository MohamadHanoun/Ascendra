-- FACEIT auto-confirm metadata on TournamentMatch (Phase 4)
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitAutoAppliedAt" TIMESTAMP(3);
ALTER TABLE "TournamentMatch" ADD COLUMN "faceitAutoApplyMethod" TEXT;

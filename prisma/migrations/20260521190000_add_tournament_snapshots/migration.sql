ALTER TABLE "Tournament"
ADD COLUMN "endedAt" TIMESTAMP(3);

ALTER TABLE "TournamentRegistration"
ADD COLUMN "snapshotTeamName" TEXT,
ADD COLUMN "snapshotTeamGame" TEXT,
ADD COLUMN "snapshotMembers" JSONB;

ALTER TABLE "TournamentResult"
ADD COLUMN "snapshotTeamName" TEXT,
ADD COLUMN "snapshotTeamGame" TEXT,
ADD COLUMN "snapshotMembers" JSONB;
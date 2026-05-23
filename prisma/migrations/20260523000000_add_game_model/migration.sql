-- CreateTable: Game
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "iconUrl" TEXT,
    "coverImageUrl" TEXT,
    "platform" TEXT,
    "defaultTeamSize" INTEGER NOT NULL DEFAULT 5,
    "defaultSubstitutes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- Seed core games (IDs are stable for FK references)
INSERT INTO "Game" ("id", "name", "slug", "shortName", "platform", "defaultTeamSize", "updatedAt") VALUES
    ('game_valorant_001',     'Valorant',           'valorant',           'VAL',   'PC', 5, NOW()),
    ('game_lol_001',          'League of Legends',  'league-of-legends',  'LoL',   'PC', 5, NOW()),
    ('game_cs2_001',          'CS2',                'cs2',                'CS2',   'PC', 5, NOW()),
    ('game_dota2_001',        'Dota 2',             'dota-2',             'Dota2', 'PC', 5, NOW());

-- ─── Tournament: add new columns BEFORE dropping old ones ────────────────────

ALTER TABLE "Tournament"
    ADD COLUMN "gameId"              TEXT,
    ADD COLUMN "startsAt"            TIMESTAMP(3),
    ADD COLUMN "endsAt"              TIMESTAMP(3),
    ADD COLUMN "registrationOpensAt"  TIMESTAMP(3),
    ADD COLUMN "registrationClosesAt" TIMESTAMP(3),
    ADD COLUMN "maxTeams"            INTEGER NOT NULL DEFAULT 16,
    ADD COLUMN "minTeams"            INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN "substitutesAllowed"  INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "format"              TEXT NOT NULL DEFAULT 'single_elimination',
    ADD COLUMN "bestOf"              INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "rules"               TEXT,
    ADD COLUMN "region"              TEXT,
    ADD COLUMN "platform"            TEXT,
    ADD COLUMN "visibility"          TEXT NOT NULL DEFAULT 'public';

-- Copy maxSlots → maxTeams
UPDATE "Tournament" SET "maxTeams" = "maxSlots";

-- Map game string → gameId
UPDATE "Tournament" SET "gameId" = 'game_valorant_001'  WHERE "game" = 'Valorant';
UPDATE "Tournament" SET "gameId" = 'game_lol_001'       WHERE "game" = 'League of Legends';
UPDATE "Tournament" SET "gameId" = 'game_cs2_001'       WHERE "game" = 'CS2';
UPDATE "Tournament" SET "gameId" = 'game_dota2_001'     WHERE "game" IN ('Dota2', 'Dota 2', 'dota2');

-- Make prize nullable
ALTER TABLE "Tournament" ALTER COLUMN "prize" DROP NOT NULL;

-- Drop old columns
ALTER TABLE "Tournament"
    DROP COLUMN "game",
    DROP COLUMN "date",
    DROP COLUMN "maxSlots";

-- ─── Team: add new column BEFORE dropping old ────────────────────────────────

ALTER TABLE "Team" ADD COLUMN "gameId" TEXT;

-- Map game string → gameId
UPDATE "Team" SET "gameId" = 'game_valorant_001'  WHERE "game" = 'Valorant';
UPDATE "Team" SET "gameId" = 'game_lol_001'       WHERE "game" = 'League of Legends';
UPDATE "Team" SET "gameId" = 'game_cs2_001'       WHERE "game" = 'CS2';
UPDATE "Team" SET "gameId" = 'game_dota2_001'     WHERE "game" IN ('Dota2', 'Dota 2', 'dota2');

-- Drop old column
ALTER TABLE "Team" DROP COLUMN "game";

-- ─── Foreign keys ────────────────────────────────────────────────────────────

ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_gameId_fkey"
    FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Team" ADD CONSTRAINT "Team_gameId_fkey"
    FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX "Tournament_gameId_idx" ON "Tournament"("gameId");
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");
CREATE INDEX "Team_gameId_idx" ON "Team"("gameId");

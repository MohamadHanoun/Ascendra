-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "status" SET DEFAULT 'draft',
ALTER COLUMN "teamSize" SET DEFAULT 5;

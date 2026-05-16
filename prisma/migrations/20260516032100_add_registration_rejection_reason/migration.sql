-- AlterTable
ALTER TABLE "TournamentRegistration" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;

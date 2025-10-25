-- DropIndex
DROP INDEX "public"."ChangeEvent_candidateId_idx";

-- DropIndex
DROP INDEX "public"."Notification_changeEventId_idx";

-- DropIndex
DROP INDEX "public"."Notification_status_idx";

-- DropIndex
DROP INDEX "public"."Notification_voterId_idx";

-- AlterTable
ALTER TABLE "public"."EmailDocument" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Voter" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."VoterPreference" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropIndex
DROP INDEX "public"."ChangeEvent_candidateId_idx";

-- DropIndex
DROP INDEX "public"."Notification_changeEventId_idx";

-- DropIndex
DROP INDEX "public"."Notification_status_idx";

-- DropIndex
DROP INDEX "public"."Notification_voterId_idx";

-- AlterTable
ALTER TABLE "public"."Voter" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."VoterPreference" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."EmailUnsubscribe" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "reason" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailUnsubscribe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailUnsubscribe_email_idx" ON "public"."EmailUnsubscribe"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailUnsubscribe_email_scope_key" ON "public"."EmailUnsubscribe"("email", "scope");

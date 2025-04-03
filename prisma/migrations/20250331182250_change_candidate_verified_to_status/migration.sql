/*
  Warnings:

  - You are about to drop the column `verified` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
-- Add the new column with a default value
ALTER TABLE "Candidate" ADD COLUMN "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING'::"SubmissionStatus";

-- Migrate data: set status to 'APPROVED' if verified is true, otherwise remain 'PENDING'
UPDATE "Candidate" SET "status" = CASE WHEN "verified" = true THEN 'APPROVED'::"SubmissionStatus" ELSE 'PENDING'::"SubmissionStatus" END;

-- Drop the obsolete column
ALTER TABLE "Candidate" DROP COLUMN "verified";

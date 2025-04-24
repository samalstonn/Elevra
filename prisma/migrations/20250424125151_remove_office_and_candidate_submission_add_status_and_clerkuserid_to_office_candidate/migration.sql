/*
  Warnings:

  - You are about to drop the `CandidateSubmission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfficeSubmission` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Office" ADD COLUMN     "clerkUserId" TEXT,
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "CandidateSubmission";

-- DropTable
DROP TABLE "OfficeSubmission";

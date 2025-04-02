/*
  Warnings:

  - You are about to drop the column `verified` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "verified",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

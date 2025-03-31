/*
  Warnings:

  - You are about to drop the column `verified` on the `Vendor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "verified",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

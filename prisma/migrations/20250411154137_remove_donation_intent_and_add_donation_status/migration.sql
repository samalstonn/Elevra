/*
  Warnings:

  - You are about to drop the `DonationIntent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DonationIntent" DROP CONSTRAINT "DonationIntent_candidateId_fkey";

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "DonationIntent";

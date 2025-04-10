-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "donationCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "paidAt" TIMESTAMP(3);

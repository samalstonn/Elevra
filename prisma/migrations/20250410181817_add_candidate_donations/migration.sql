/*
  Warnings:

  - You are about to drop the column `donations` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "donations";

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "donorAddress" TEXT NOT NULL,
    "donorCity" TEXT NOT NULL,
    "donorState" TEXT NOT NULL,
    "donorZip" TEXT NOT NULL,
    "donorPhone" TEXT,
    "isRetiredOrUnemployed" BOOLEAN NOT NULL DEFAULT false,
    "occupation" TEXT,
    "employer" TEXT,
    "transactionId" TEXT,
    "processingFee" DECIMAL(10,2),
    "coverFee" BOOLEAN NOT NULL DEFAULT false,
    "candidateId" INTEGER NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

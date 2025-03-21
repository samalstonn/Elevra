/*
  Warnings:

  - A unique constraint covering the columns `[clerkUserId]` on the table `Candidate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "clerkUserId" TEXT,
ADD COLUMN     "history" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_clerkUserId_key" ON "Candidate"("clerkUserId");

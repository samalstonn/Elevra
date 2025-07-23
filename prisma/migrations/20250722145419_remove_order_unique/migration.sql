/*
  Warnings:

  - A unique constraint covering the columns `[candidateId,electionId]` on the table `ContentBlock` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ContentBlock_candidateId_electionId_order_key";

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_candidateId_electionId_key" ON "ContentBlock"("candidateId", "electionId");

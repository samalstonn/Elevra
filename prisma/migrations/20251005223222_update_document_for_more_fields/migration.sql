/*
  Warnings:

  - A unique constraint covering the columns `[candidateId,electionId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `candidateId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `electionId` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "candidateId" INTEGER NOT NULL,
ADD COLUMN     "electionId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Document_candidateId_electionId_key" ON "public"."Document"("candidateId", "electionId");

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_candidateId_electionId_fkey" FOREIGN KEY ("candidateId", "electionId") REFERENCES "public"."ElectionLink"("candidateId", "electionId") ON DELETE CASCADE ON UPDATE CASCADE;

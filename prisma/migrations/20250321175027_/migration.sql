/*
  Warnings:

  - The primary key for the `Candidate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_pkey",
DROP COLUMN "id",
ADD COLUMN     "_id" SERIAL NOT NULL,
ADD CONSTRAINT "Candidate_pkey" PRIMARY KEY ("_id");

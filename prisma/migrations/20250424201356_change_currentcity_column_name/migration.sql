/*
  Warnings:

  - You are about to drop the column `CurrentCity` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "CurrentCity",
ADD COLUMN     "currentCity" TEXT;

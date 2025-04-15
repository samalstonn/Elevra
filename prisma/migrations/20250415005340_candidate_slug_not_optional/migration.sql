/*
  Warnings:

  - Made the column `slug` on table `Candidate` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Candidate" ALTER COLUMN "slug" SET NOT NULL;

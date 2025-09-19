/*
  Warnings:

  - Made the column `authorName` on table `BlogPost` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."BlogPost" ALTER COLUMN "authorName" SET NOT NULL;

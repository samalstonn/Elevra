/*
  Warnings:

  - Added the required column `zipcode` to the `Election` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Election" ADD COLUMN     "zipcode" TEXT NOT NULL;

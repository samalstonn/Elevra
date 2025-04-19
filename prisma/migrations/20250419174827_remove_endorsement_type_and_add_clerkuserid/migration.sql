/*
  Warnings:

  - You are about to drop the column `endorserType` on the `Endorsement` table. All the data in the column will be lost.
  - Added the required column `clerkUserId` to the `Endorsement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Endorsement" DROP COLUMN "endorserType",
ADD COLUMN     "clerkUserId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "EndorserType";

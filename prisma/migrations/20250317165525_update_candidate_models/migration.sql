/*
  Warnings:

  - You are about to drop the column `bio` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `position` to the `Candidate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verified` to the `Candidate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "bio",
ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "position" TEXT NOT NULL,
ADD COLUMN     "sources" TEXT[],
ADD COLUMN     "state" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL;

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "User";

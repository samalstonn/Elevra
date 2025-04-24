/*
  Warnings:

  - You are about to drop the column `additionalNotes` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `party` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `policies` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `sources` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `votinglink` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `ElectionLink` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `ElectionLink` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `ElectionLink` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `ElectionLink` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `ElectionLink` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `ElectionLink` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `ElectionLink` table. All the data in the column will be lost.
  - Made the column `party` on table `ElectionLink` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "additionalNotes",
DROP COLUMN "city",
DROP COLUMN "party",
DROP COLUMN "policies",
DROP COLUMN "position",
DROP COLUMN "sources",
DROP COLUMN "state",
DROP COLUMN "votinglink",
ADD COLUMN     "CurrentCity" TEXT,
ADD COLUMN     "currentRole" TEXT,
ADD COLUMN     "currentState" TEXT,
ALTER COLUMN "bio" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ElectionLink" DROP COLUMN "bio",
DROP COLUMN "city",
DROP COLUMN "linkedin",
DROP COLUMN "position",
DROP COLUMN "role",
DROP COLUMN "state",
DROP COLUMN "website",
ALTER COLUMN "party" SET NOT NULL;

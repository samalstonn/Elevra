/*
  Warnings:

  - You are about to drop the column `electionId` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `electionId` on the `CandidateSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Election` table. All the data in the column will be lost.
  - You are about to drop the column `positions` on the `Election` table. All the data in the column will be lost.
  - You are about to drop the column `electionId` on the `UserValidationRequest` table. All the data in the column will be lost.
  - You are about to drop the `ElectionSubmission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_electionId_fkey";

-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "electionId",
ADD COLUMN     "officeId" INTEGER;

-- AlterTable
ALTER TABLE "CandidateSubmission" DROP COLUMN "electionId",
ADD COLUMN     "officeId" INTEGER;

-- AlterTable
ALTER TABLE "Election" DROP COLUMN "position",
DROP COLUMN "positions",
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "active" SET DEFAULT true,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserValidationRequest" DROP COLUMN "electionId",
ADD COLUMN     "officeId" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "ElectionSubmission";

-- CreateTable
CREATE TABLE "Office" (
    "id" SERIAL NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT,
    "positions" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "electionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeSubmission" (
    "id" SERIAL NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT,
    "positions" INTEGER NOT NULL,
    "electionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "clerkUserId" TEXT,
    "notes" TEXT,

    CONSTRAINT "OfficeSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

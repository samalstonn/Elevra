-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ElectionSubmission" (
  "id" SERIAL NOT NULL,
  "position" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "city" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "positions" INTEGER NOT NULL,
  "state" TEXT NOT NULL,
  "type" "ElectionType" NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "clerkUserId" TEXT,
  "notes" TEXT,

  CONSTRAINT "ElectionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSubmission" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "party" TEXT NOT NULL,
  "policies" TEXT[],
  "website" TEXT,
  "electionId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "additionalNotes" TEXT,
  "city" TEXT NOT NULL,
  "linkedin" TEXT,
  "photo" TEXT,
  "position" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "bio" TEXT NOT NULL,
  "clerkUserId" TEXT,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,

  CONSTRAINT "CandidateSubmission_pkey" PRIMARY KEY ("id")
);
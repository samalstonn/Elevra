-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('LOCAL', 'STATE', 'NATIONAL', 'UNIVERSITY');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Election" (
    "id" SERIAL NOT NULL,
    "position" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL,
    "city" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "positions" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "type" "ElectionType" NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "name" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "policies" TEXT[],
    "website" TEXT,
    "electionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "additionalNotes" TEXT,
    "city" TEXT,
    "linkedin" TEXT,
    "photo" TEXT,
    "position" TEXT NOT NULL,
    "sources" TEXT[],
    "state" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "donations" TEXT[],
    "bio" TEXT NOT NULL DEFAULT '',
    "clerkUserId" TEXT,
    "history" TEXT[],
    "id" SERIAL NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserValidationRequest" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "website" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "additionalInfo" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "electionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserValidationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionSubmission" (
    "id" SERIAL NOT NULL,
    "position" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "positions" INTEGER NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_clerkUserId_key" ON "Candidate"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserValidationRequest_clerkUserId_key" ON "UserValidationRequest"("clerkUserId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

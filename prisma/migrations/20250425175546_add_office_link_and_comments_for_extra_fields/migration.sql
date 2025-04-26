-- AlterTable
ALTER TABLE "Election" ADD COLUMN     "clerkUserId" TEXT,
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "OfficeLink" (
    "candidateId" INTEGER NOT NULL,
    "officeId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "party" TEXT NOT NULL,
    "policies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additionalNotes" TEXT,
    "votinglink" TEXT,
    "photoUrl" TEXT,

    CONSTRAINT "OfficeLink_pkey" PRIMARY KEY ("candidateId","officeId")
);

-- AddForeignKey
ALTER TABLE "OfficeLink" ADD CONSTRAINT "OfficeLink_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeLink" ADD CONSTRAINT "OfficeLink_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

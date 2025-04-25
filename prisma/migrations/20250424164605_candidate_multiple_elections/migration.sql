-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_electionId_fkey";

-- CreateTable
CREATE TABLE "ElectionLink" (
    "candidateId" INTEGER NOT NULL,
    "electionId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT,

    CONSTRAINT "ElectionLink_pkey" PRIMARY KEY ("candidateId","electionId")
);

-- AddForeignKey
ALTER TABLE "ElectionLink" ADD CONSTRAINT "ElectionLink_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionLink" ADD CONSTRAINT "ElectionLink_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

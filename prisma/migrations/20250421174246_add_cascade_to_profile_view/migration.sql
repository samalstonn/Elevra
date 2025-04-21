-- DropForeignKey
ALTER TABLE "CandidateProfileView" DROP CONSTRAINT "CandidateProfileView_candidateId_fkey";

-- AddForeignKey
ALTER TABLE "CandidateProfileView" ADD CONSTRAINT "CandidateProfileView_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

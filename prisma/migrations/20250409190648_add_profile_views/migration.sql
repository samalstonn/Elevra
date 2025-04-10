-- CreateTable
CREATE TABLE "CandidateProfileView" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewerIp" TEXT,
    "userAgent" TEXT,
    "referrerUrl" TEXT,

    CONSTRAINT "CandidateProfileView_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CandidateProfileView" ADD CONSTRAINT "CandidateProfileView_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

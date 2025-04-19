-- CreateEnum
CREATE TYPE "EndorserType" AS ENUM ('CANDIDATE', 'USER', 'ANONYMOUS');

-- CreateTable
CREATE TABLE "Endorsement" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "endorserName" TEXT NOT NULL,
    "relationshipDescription" TEXT,
    "endorserType" "EndorserType" NOT NULL DEFAULT 'ANONYMOUS',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DonationIntent" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "processingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "candidateId" INTEGER NOT NULL,
    "userId" TEXT,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "donorAddress" TEXT NOT NULL,
    "donorCity" TEXT NOT NULL,
    "donorState" TEXT NOT NULL,
    "donorZip" TEXT NOT NULL,
    "donorCountry" TEXT NOT NULL DEFAULT 'USA',
    "donorPhone" TEXT,
    "isRetiredOrUnemployed" BOOLEAN NOT NULL DEFAULT false,
    "occupation" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DonationIntent_candidateId_idx" ON "DonationIntent"("candidateId");

-- CreateIndex
CREATE INDEX "DonationIntent_userId_idx" ON "DonationIntent"("userId");

-- AddForeignKey
ALTER TABLE "DonationIntent" ADD CONSTRAINT "DonationIntent_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

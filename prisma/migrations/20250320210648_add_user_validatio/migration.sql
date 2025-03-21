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

-- CreateIndex
CREATE UNIQUE INDEX "UserValidationRequest_clerkUserId_key" ON "UserValidationRequest"("clerkUserId");

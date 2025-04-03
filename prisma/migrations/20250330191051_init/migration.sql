-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('LOCAL', 'STATE', 'NATIONAL', 'UNIVERSITY');

-- CreateEnum
CREATE TYPE "VendorTier" AS ENUM ('FREE', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceCategoryType" AS ENUM ('CREATIVE_BRANDING', 'DIGITAL_TECH', 'PHYSICAL_MEDIA', 'CONSULTING_PR');

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

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "website" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "subscription" "VendorTier" NOT NULL DEFAULT 'FREE',
    "clerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ServiceCategoryType" NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CandidateToVendor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CandidateToVendor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_VendorServices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_VendorServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_clerkUserId_key" ON "Candidate"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserValidationRequest_clerkUserId_key" ON "UserValidationRequest"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_clerkUserId_key" ON "Vendor"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_name_key" ON "ServiceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_type_key" ON "ServiceCategory"("type");

-- CreateIndex
CREATE INDEX "_CandidateToVendor_B_index" ON "_CandidateToVendor"("B");

-- CreateIndex
CREATE INDEX "_VendorServices_B_index" ON "_VendorServices"("B");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CandidateToVendor" ADD CONSTRAINT "_CandidateToVendor_A_fkey" FOREIGN KEY ("A") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CandidateToVendor" ADD CONSTRAINT "_CandidateToVendor_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorServices" ADD CONSTRAINT "_VendorServices_A_fkey" FOREIGN KEY ("A") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorServices" ADD CONSTRAINT "_VendorServices_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

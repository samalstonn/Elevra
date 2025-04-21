-- DropForeignKey
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "Endorsement" DROP CONSTRAINT "Endorsement_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "Testimonial" DROP CONSTRAINT "Testimonial_candidateId_fkey";

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

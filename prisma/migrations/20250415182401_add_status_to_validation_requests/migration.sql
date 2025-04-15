-- AlterTable
ALTER TABLE "UserValidationRequest" ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

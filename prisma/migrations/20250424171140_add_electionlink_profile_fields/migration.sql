-- AlterTable
ALTER TABLE "ElectionLink" ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "party" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "policies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "position" TEXT,
ADD COLUMN     "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "state" TEXT,
ADD COLUMN     "votinglink" TEXT,
ADD COLUMN     "website" TEXT;

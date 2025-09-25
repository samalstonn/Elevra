-- AlterTable
ALTER TABLE "public"."Candidate" ADD COLUMN     "uploadedBy" TEXT NOT NULL DEFAULT 'team@elevracommunity.com';

-- AlterTable
ALTER TABLE "public"."Election" ADD COLUMN     "uploadedBy" TEXT NOT NULL DEFAULT 'team@elevracommunity.com';

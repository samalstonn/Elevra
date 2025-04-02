-- AlterEnum
ALTER TYPE "ServiceCategoryType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "ServiceCategory" ADD COLUMN     "description" TEXT;

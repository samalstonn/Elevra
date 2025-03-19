/*
  Warnings:

  - You are about to drop the column `location` on the `Election` table. All the data in the column will be lost.
  - You are about to drop the column `zipcode` on the `Election` table. All the data in the column will be lost.
  - Added the required column `active` to the `Election` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Election` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Election` table without a default value. This is not possible if the table is not empty.
  - Added the required column `positions` to the `Election` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Election` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Election` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('LOCAL', 'STATE', 'NATIONAL', 'UNIVERSITY');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "donations" TEXT[];

-- AlterTable
ALTER TABLE "Election" DROP COLUMN "location",
DROP COLUMN "zipcode",
ADD COLUMN     "active" BOOLEAN NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "positions" INTEGER NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "ElectionType" NOT NULL;

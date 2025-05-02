-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('HEADING', 'TEXT', 'LIST', 'DIVIDER', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ListStyle" AS ENUM ('BULLET', 'NUMBER');

-- CreateEnum
CREATE TYPE "TextColor" AS ENUM ('BLACK', 'GRAY', 'PURPLE');

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "electionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL,
    "color" "TextColor",
    "level" INTEGER,
    "text" TEXT,
    "body" TEXT,
    "listStyle" "ListStyle",
    "items" TEXT[],
    "imageUrl" TEXT,
    "caption" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_candidateId_electionId_order_key" ON "ContentBlock"("candidateId", "electionId", "order");

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_candidateId_electionId_fkey" FOREIGN KEY ("candidateId", "electionId") REFERENCES "ElectionLink"("candidateId", "electionId") ON DELETE CASCADE ON UPDATE CASCADE;

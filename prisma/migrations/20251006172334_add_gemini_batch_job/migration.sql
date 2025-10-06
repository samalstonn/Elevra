-- CreateEnum
CREATE TYPE "public"."GeminiBatchJobStatus" AS ENUM ('PENDING_ANALYZE', 'ANALYZE_SUBMITTED', 'ANALYZE_COMPLETED', 'ANALYZE_FAILED', 'STRUCTURE_SUBMITTED', 'STRUCTURE_COMPLETED', 'STRUCTURE_FAILED', 'INGEST_PENDING', 'INGEST_RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."GeminiBatchGroupStatus" AS ENUM ('PENDING_ANALYZE', 'ANALYZE_RUNNING', 'ANALYZE_COMPLETED', 'ANALYZE_FAILED', 'STRUCTURE_RUNNING', 'STRUCTURE_COMPLETED', 'STRUCTURE_FAILED', 'INGEST_RUNNING', 'INGEST_COMPLETED', 'INGEST_FAILED');

-- CreateTable
CREATE TABLE "public"."GeminiBatchJob" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT,
    "uploaderEmail" TEXT NOT NULL,
    "uploaderUserId" TEXT,
    "status" "public"."GeminiBatchJobStatus" NOT NULL DEFAULT 'PENDING_ANALYZE',
    "analyzeJobName" TEXT,
    "analyzeMode" TEXT,
    "analyzeModel" TEXT,
    "analyzeSubmittedAt" TIMESTAMP(3),
    "analyzeCompletedAt" TIMESTAMP(3),
    "analyzeFallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "analyzeError" TEXT,
    "structureJobName" TEXT,
    "structureMode" TEXT,
    "structureModel" TEXT,
    "structureSubmittedAt" TIMESTAMP(3),
    "structureCompletedAt" TIMESTAMP(3),
    "structureFallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "structureError" TEXT,
    "ingestRequestedAt" TIMESTAMP(3),
    "ingestCompletedAt" TIMESTAMP(3),
    "ingestError" TEXT,
    "analyzeEmailSentAt" TIMESTAMP(3),
    "ingestEmailSentAt" TIMESTAMP(3),
    "lastProcessedAt" TIMESTAMP(3),
    "estimatedTokens" INTEGER,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "groupCount" INTEGER NOT NULL DEFAULT 0,
    "analyzePrompt" TEXT,
    "structurePrompt" TEXT,
    "responseSchema" JSONB,
    "forceHidden" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "GeminiBatchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeminiBatchGroup" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "municipality" TEXT,
    "state" TEXT,
    "position" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "analyzeTokenEstimate" INTEGER,
    "structureTokenEstimate" INTEGER,
    "rows" JSONB,
    "analyzeText" TEXT,
    "structureText" TEXT,
    "structured" JSONB,
    "analyzeError" TEXT,
    "structureError" TEXT,
    "status" "public"."GeminiBatchGroupStatus" NOT NULL DEFAULT 'PENDING_ANALYZE',
    "analyzeCompletedAt" TIMESTAMP(3),
    "structureCompletedAt" TIMESTAMP(3),
    "ingestCompletedAt" TIMESTAMP(3),

    CONSTRAINT "GeminiBatchGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeminiBatchGroup_jobId_idx" ON "public"."GeminiBatchGroup"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "GeminiBatchGroup_jobId_key_key" ON "public"."GeminiBatchGroup"("jobId", "key");

-- AddForeignKey
ALTER TABLE "public"."GeminiBatchGroup" ADD CONSTRAINT "GeminiBatchGroup_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."GeminiBatchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

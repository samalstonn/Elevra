-- CreateEnum
CREATE TYPE "public"."SpreadsheetUploadStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REUPLOAD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."UploadBatchStatus" AS ENUM ('QUEUED', 'ANALYZING', 'STRUCTURING', 'INSERTING', 'COMPLETED', 'FAILED', 'NEEDS_REUPLOAD', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."GeminiJobType" AS ENUM ('ANALYZE', 'STRUCTURE', 'INSERT', 'WORKBOOK', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "public"."GeminiJobStatus" AS ENUM ('PENDING', 'READY', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."GeminiJobAttemptStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."UploadNotificationType" AS ENUM ('QUEUED', 'ANALYZE_COMPLETE', 'STRUCTURE_COMPLETE', 'INSERT_COMPLETE', 'FINAL', 'BATCH_FAILURE');

-- CreateEnum
CREATE TYPE "public"."UploadNotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "public"."SpreadsheetUpload" (
    "id" TEXT NOT NULL,
    "status" "public"."SpreadsheetUploadStatus" NOT NULL DEFAULT 'QUEUED',
    "failureReason" TEXT,
    "originalFilename" TEXT NOT NULL,
    "uploaderEmail" TEXT NOT NULL,
    "summaryJson" JSONB,
    "resultWorkbookUrl" TEXT,
    "forceHidden" BOOLEAN NOT NULL DEFAULT true,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpreadsheetUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UploadElectionBatch" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "groupKey" TEXT,
    "municipality" TEXT,
    "state" TEXT,
    "position" TEXT,
    "rawRows" JSONB NOT NULL,
    "analysisJson" JSONB,
    "structuredJson" JSONB,
    "status" "public"."UploadBatchStatus" NOT NULL DEFAULT 'QUEUED',
    "errorReason" TEXT,
    "analyzeJobId" TEXT,
    "structureJobId" TEXT,
    "insertJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadElectionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeminiJob" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT,
    "batchId" TEXT,
    "type" "public"."GeminiJobType" NOT NULL,
    "status" "public"."GeminiJobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "dependencyJobId" TEXT,
    "preferredModels" JSONB NOT NULL,
    "fallbackModels" JSONB,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estimatedRequestTokens" INTEGER,
    "estimatedResponseTokens" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "GeminiJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeminiJobAttempt" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "requestTokens" INTEGER,
    "responseTokens" INTEGER,
    "batchTokens" INTEGER,
    "statusCode" INTEGER,
    "responseBody" JSONB,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "status" "public"."GeminiJobAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateWindowStart" TIMESTAMP(3),
    "isFallback" BOOLEAN DEFAULT false,

    CONSTRAINT "GeminiJobAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeminiRateWindow" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "requestTokens" INTEGER NOT NULL DEFAULT 0,
    "responseTokens" INTEGER NOT NULL DEFAULT 0,
    "batchTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeminiRateWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UploadNotificationLog" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "public"."UploadNotificationType" NOT NULL,
    "status" "public"."UploadNotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "responseId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpreadsheetUpload_status_queuedAt_idx" ON "public"."SpreadsheetUpload"("status", "queuedAt");

-- CreateIndex
CREATE INDEX "SpreadsheetUpload_createdAt_idx" ON "public"."SpreadsheetUpload"("createdAt");

-- CreateIndex
CREATE INDEX "UploadElectionBatch_uploadId_idx" ON "public"."UploadElectionBatch"("uploadId");

-- CreateIndex
CREATE INDEX "UploadElectionBatch_status_idx" ON "public"."UploadElectionBatch"("status");

-- CreateIndex
CREATE INDEX "GeminiJob_status_nextRunAt_idx" ON "public"."GeminiJob"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "GeminiJob_type_status_idx" ON "public"."GeminiJob"("type", "status");

-- CreateIndex
CREATE INDEX "GeminiJob_uploadId_idx" ON "public"."GeminiJob"("uploadId");

-- CreateIndex
CREATE INDEX "GeminiJob_batchId_idx" ON "public"."GeminiJob"("batchId");

-- CreateIndex
CREATE INDEX "GeminiJobAttempt_jobId_idx" ON "public"."GeminiJobAttempt"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "GeminiRateWindow_model_windowStart_key" ON "public"."GeminiRateWindow"("model", "windowStart");

-- CreateIndex
CREATE INDEX "UploadNotificationLog_uploadId_idx" ON "public"."UploadNotificationLog"("uploadId");

-- CreateIndex
CREATE INDEX "UploadNotificationLog_type_idx" ON "public"."UploadNotificationLog"("type");

-- AddForeignKey
ALTER TABLE "public"."UploadElectionBatch" ADD CONSTRAINT "UploadElectionBatch_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "public"."SpreadsheetUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeminiJob" ADD CONSTRAINT "GeminiJob_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "public"."SpreadsheetUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeminiJob" ADD CONSTRAINT "GeminiJob_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."UploadElectionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeminiJobAttempt" ADD CONSTRAINT "GeminiJobAttempt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."GeminiJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UploadNotificationLog" ADD CONSTRAINT "UploadNotificationLog_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "public"."SpreadsheetUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

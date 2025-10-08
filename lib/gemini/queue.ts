import {
  GeminiJobStatus,
  GeminiJobType,
  GeminiJobAttemptStatus,
  Prisma,
  SpreadsheetUploadStatus,
  UploadBatchStatus,
  UploadNotificationStatus,
  UploadNotificationType,
  type PrismaClient,
} from "@prisma/client";
import type { Row } from "@/election-source/build-spreadsheet";
import type { InsertResultItem } from "@/election-source/build-spreadsheet";
import { prisma } from "@/lib/prisma";
import {
  ANALYZE_FALLBACK_MODELS,
  ANALYZE_PRIMARY_MODEL,
  DEFAULT_JOB_MAX_RETRIES,
  DEFAULT_JOB_TIMEOUT_MS,
  INSERT_FALLBACK_MODELS,
  INSERT_PRIMARY_MODEL,
  STRUCTURE_FALLBACK_MODELS,
  STRUCTURE_PRIMARY_MODEL,
} from "./constants";
import { computeBackoffDelay } from "./rate-limit";
import { groupRowsForUpload } from "./grouping";

type DbClient = PrismaClient | Prisma.TransactionClient;

type JsonValue = Prisma.InputJsonValue;

type CreateSpreadsheetUploadInput = {
  uploaderEmail: string;
  originalFilename: string;
  rows: Row[];
  summary?: Record<string, unknown> | null;
  forceHidden?: boolean;
};

type JobStartOptions = {
  modelUsed: string;
  isFallback?: boolean;
  rateWindowStart?: Date;
};

type JobCompleteBaseOptions = {
  jobId: string;
  attemptId: string;
  requestTokens?: number;
  responseTokens?: number;
  batchTokens?: number;
  statusCode?: number;
};

type AnalyzeSuccessOptions = JobCompleteBaseOptions & {
  analysisText: string;
};

type StructureSuccessOptions = JobCompleteBaseOptions & {
  structuredText: string;
};

type InsertSuccessOptions = JobCompleteBaseOptions & {
  resultSummary: Record<string, unknown> | null;
};

type JobFailureOptions = JobCompleteBaseOptions & {
  errorMessage: string;
  errorType?: string;
  retryable?: boolean;
};

type WorkbookSuccessOptions = JobCompleteBaseOptions & {
  workbookBase64: string;
  filename: string;
  summary?: Record<string, unknown> | null;
};

type NotificationSuccessOptions = JobCompleteBaseOptions & {
  messageId: string;
  recipients: string[];
};

export async function createSpreadsheetUpload(
  input: CreateSpreadsheetUploadInput
) {
  const { rows, uploaderEmail, originalFilename, summary, forceHidden } = input;
  if (!rows.length) {
    throw new Error("Spreadsheet upload requires at least one row");
  }
  const grouped = groupRowsForUpload(rows);
  if (!grouped.length) {
    throw new Error("No election batches detected from spreadsheet rows");
  }
  const now = new Date();
  const summaryJson = buildSummary(
    summary,
    rows.length,
    grouped.length,
    now,
    forceHidden ?? true
  );

  return prisma.$transaction(async (tx) => {
    const upload = await tx.spreadsheetUpload.create({
      data: {
        uploaderEmail,
        originalFilename,
        status: SpreadsheetUploadStatus.PROCESSING,
        queuedAt: now,
        startedAt: now,
        summaryJson,
        forceHidden: forceHidden ?? true,
      },
    });

    const batchRecords: Array<{
      batchId: string;
      groupKey: string;
      estimateAnalyze: number;
      estimateStructure: number;
    }> = [];

    for (const group of grouped) {
      const batch = await tx.uploadElectionBatch.create({
        data: {
          uploadId: upload.id,
          groupKey: group.key,
          municipality: group.municipality,
          state: group.state,
          position: group.position,
          rawRows: group.rawRowsJson,
          status: UploadBatchStatus.QUEUED,
        },
      });
      batchRecords.push({
        batchId: batch.id,
        groupKey: group.key,
        estimateAnalyze: group.estimatedAnalyzeTokens,
        estimateStructure: group.estimatedStructureTokens,
      });
    }

    for (const { batchId, groupKey, estimateAnalyze, estimateStructure } of batchRecords) {
      const analyzeJob = await tx.geminiJob.create({
        data: {
          uploadId: upload.id,
          batchId,
          type: GeminiJobType.ANALYZE,
          status: GeminiJobStatus.READY,
          priority: 100,
          preferredModels: jsonArray([ANALYZE_PRIMARY_MODEL]),
          fallbackModels: jsonArrayOrNull(Array.from(ANALYZE_FALLBACK_MODELS)),
          estimatedRequestTokens: estimateAnalyze,
          estimatedResponseTokens: Math.ceil(estimateAnalyze * 1.1),
          maxRetries: DEFAULT_JOB_MAX_RETRIES,
          metadata: buildJobMetadata("analyze", groupKey),
        },
      });

      const structureJob = await tx.geminiJob.create({
        data: {
          uploadId: upload.id,
          batchId,
          type: GeminiJobType.STRUCTURE,
          status: GeminiJobStatus.PENDING,
          dependencyJobId: analyzeJob.id,
          priority: 90,
          preferredModels: jsonArray([STRUCTURE_PRIMARY_MODEL]),
          fallbackModels: jsonArrayOrNull(Array.from(STRUCTURE_FALLBACK_MODELS)),
          estimatedRequestTokens: estimateStructure,
          estimatedResponseTokens: Math.ceil(estimateStructure * 1.2),
          maxRetries: DEFAULT_JOB_MAX_RETRIES,
          metadata: buildJobMetadata("structure", groupKey),
        },
      });

      const insertJob = await tx.geminiJob.create({
        data: {
          uploadId: upload.id,
          batchId,
          type: GeminiJobType.INSERT,
          status: GeminiJobStatus.PENDING,
          dependencyJobId: structureJob.id,
          priority: 80,
          preferredModels: jsonArray([INSERT_PRIMARY_MODEL]),
          fallbackModels: jsonArrayOrNull(Array.from(INSERT_FALLBACK_MODELS)),
          estimatedRequestTokens: 0,
          estimatedResponseTokens: 0,
          maxRetries: DEFAULT_JOB_MAX_RETRIES,
          metadata: buildJobMetadata("insert", groupKey, {
            forceHidden: forceHidden ?? true,
          }),
        },
      });

      await tx.uploadElectionBatch.update({
        where: { id: batchId },
        data: {
          analyzeJobId: analyzeJob.id,
          structureJobId: structureJob.id,
          insertJobId: insertJob.id,
        },
      });
    }

    return tx.spreadsheetUpload.findUniqueOrThrow({
      where: { id: upload.id },
      include: {
        batches: true,
      },
    });
  }, { timeout: 30000 });
}

export async function listDispatchableJobs(limit: number, now = new Date()) {
  return prisma.geminiJob.findMany({
    where: {
      status: GeminiJobStatus.READY,
      nextRunAt: {
        lte: now,
      },
    },
    orderBy: [
      { priority: "desc" },
      { nextRunAt: "asc" },
      { createdAt: "asc" },
    ],
    take: limit,
    include: {
      batch: true,
      upload: true,
    },
  });
}

export async function markJobAsInProgress(
  jobId: string,
  { modelUsed, isFallback = false, rateWindowStart }: JobStartOptions
) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);
    if (job.status !== GeminiJobStatus.READY) {
      throw new Error(`Job ${jobId} is not ready (status: ${job.status})`);
    }
    const now = new Date();
    const updatedJob = await tx.geminiJob.update({
      where: { id: jobId },
      data: {
        status: GeminiJobStatus.IN_PROGRESS,
        startedAt: now,
      },
    });

    const attempt = await tx.geminiJobAttempt.create({
      data: {
        jobId,
        modelUsed,
        status: GeminiJobAttemptStatus.IN_PROGRESS,
        startedAt: now,
        rateWindowStart: rateWindowStart ?? null,
        isFallback: isFallback || undefined,
      },
    });

    if (job.batchId) {
      await setBatchStatus(tx, job.batchId, batchStatusForJobStart(job.type));
    }

    return { job: updatedJob, attempt };
  });
}

export async function recordAnalyzeSuccess({
  jobId,
  attemptId,
  analysisText,
  requestTokens,
  responseTokens,
  batchTokens,
  statusCode,
}: AnalyzeSuccessOptions) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);

    const parsed = safeJsonParse(analysisText);
    if (job.batchId) {
      await tx.uploadElectionBatch.update({
        where: { id: job.batchId },
        data: {
          analysisJson: (parsed ?? analysisText) as JsonValue,
          status: UploadBatchStatus.STRUCTURING,
          errorReason: null,
        },
      });
    }

    await finalizeAttempt(tx, attemptId, {
      status: GeminiJobAttemptStatus.SUCCEEDED,
      completedAt: new Date(),
      requestTokens,
      responseTokens,
      batchTokens,
      statusCode,
      responseBody: (parsed ?? analysisText) as JsonValue,
    });

    await tx.geminiJob.update({
      where: { id: jobId },
      data: {
        status: GeminiJobStatus.SUCCEEDED,
        completedAt: new Date(),
        lastError: null,
      },
    });

    await unlockDependentJobs(tx, jobId);
    if (job.uploadId) {
      await refreshUploadSummary(tx, job.uploadId);
    }
  });
}

export async function recordStructureSuccess({
  jobId,
  attemptId,
  structuredText,
  requestTokens,
  responseTokens,
  batchTokens,
  statusCode,
}: StructureSuccessOptions) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);

    const parsed = safeJsonParse(structuredText);
    if (job.batchId) {
      await tx.uploadElectionBatch.update({
        where: { id: job.batchId },
        data: {
          structuredJson: (parsed ?? structuredText) as JsonValue,
          status: UploadBatchStatus.INSERTING,
          errorReason: null,
        },
      });
    }

    await finalizeAttempt(tx, attemptId, {
      status: GeminiJobAttemptStatus.SUCCEEDED,
      completedAt: new Date(),
      requestTokens,
      responseTokens,
      batchTokens,
      statusCode,
      responseBody: (parsed ?? structuredText) as JsonValue,
    });

    await tx.geminiJob.update({
      where: { id: jobId },
      data: {
        status: GeminiJobStatus.SUCCEEDED,
        completedAt: new Date(),
        lastError: null,
      },
    });

    await unlockDependentJobs(tx, jobId);
    if (job.uploadId) {
      await refreshUploadSummary(tx, job.uploadId);
    }
  });
}

export async function recordInsertSuccess({
  jobId,
  attemptId,
  resultSummary,
  requestTokens,
  responseTokens,
  batchTokens,
  statusCode,
}: InsertSuccessOptions) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);

    if (job.batchId) {
      await tx.uploadElectionBatch.update({
        where: { id: job.batchId },
        data: {
          status: UploadBatchStatus.COMPLETED,
          errorReason: null,
        },
      });
    }

    await finalizeAttempt(tx, attemptId, {
      status: GeminiJobAttemptStatus.SUCCEEDED,
      completedAt: new Date(),
      requestTokens,
      responseTokens,
      batchTokens,
      statusCode,
      responseBody: resultSummary ?? null,
    });

    await tx.geminiJob.update({
      where: { id: jobId },
      data: {
        status: GeminiJobStatus.SUCCEEDED,
        completedAt: new Date(),
        lastError: null,
      },
    });

    if (job.uploadId) {
      const results = Array.isArray(resultSummary?.results)
        ? (resultSummary.results as InsertResultItem[])
        : [];
      if (results.length) {
        await appendInsertResults(tx, job.uploadId, results);
      }
      await refreshUploadSummary(tx, job.uploadId);
      await maybeEnqueueFinalizationJobs(tx, job.uploadId);
    }
  });
}

export async function recordWorkbookSuccess({
  jobId,
  attemptId,
  workbookBase64,
  filename,
  summary,
}: WorkbookSuccessOptions) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);

    await finalizeAttempt(tx, attemptId, {
      status: GeminiJobAttemptStatus.SUCCEEDED,
      completedAt: new Date(),
      responseBody: {
        workbookBase64,
        filename,
      },
    });

    await tx.geminiJob.update({
      where: { id: jobId },
      data: {
        status: GeminiJobStatus.SUCCEEDED,
        completedAt: new Date(),
        lastError: null,
      },
    });

    if (job.uploadId) {
      if (summary && Object.keys(summary).length) {
        await mergeUploadSummary(tx, job.uploadId, summary);
      }
      await refreshUploadSummary(tx, job.uploadId);
    }
  });
}

export async function recordNotificationSuccess({
  jobId,
  attemptId,
  messageId,
  recipients,
}: NotificationSuccessOptions) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);

    await finalizeAttempt(tx, attemptId, {
      status: GeminiJobAttemptStatus.SUCCEEDED,
      completedAt: new Date(),
      responseBody: {
        messageId,
        recipients,
      },
    });

    await tx.geminiJob.update({
      where: { id: jobId },
      data: {
        status: GeminiJobStatus.SUCCEEDED,
        completedAt: new Date(),
        lastError: null,
      },
    });

    if (job.uploadId) {
      await tx.uploadNotificationLog.create({
        data: {
          uploadId: job.uploadId,
          email: recipients.join(", "),
          type: UploadNotificationType.FINAL,
          status: UploadNotificationStatus.SENT,
          responseId: messageId || null,
          sentAt: new Date(),
        },
      });
      await refreshUploadSummary(tx, job.uploadId);
    }
  });
}

export async function recordJobFailure({
  jobId,
  attemptId,
  errorMessage,
  errorType,
  retryable = true,
  requestTokens,
  responseTokens,
  batchTokens,
  statusCode,
}: JobFailureOptions) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);

    await finalizeAttempt(tx, attemptId, {
      status: GeminiJobAttemptStatus.FAILED,
      completedAt: new Date(),
      errorMessage,
      errorType,
      requestTokens,
      responseTokens,
      batchTokens,
      statusCode,
    });

    const retryCount = job.retryCount + 1;
    const exceeded = retryCount >= (job.maxRetries ?? DEFAULT_JOB_MAX_RETRIES);
    const status = retryable && !exceeded ? GeminiJobStatus.READY : GeminiJobStatus.FAILED;

    await tx.geminiJob.update({
      where: { id: jobId },
      data: {
        retryCount,
        status,
        nextRunAt:
          retryable && !exceeded
            ? new Date(Date.now() + computeBackoffDelay(retryCount))
            : new Date(),
        lastError: errorMessage,
      },
    });

    if (job.batchId && status === GeminiJobStatus.FAILED) {
      await setBatchStatus(tx, job.batchId, UploadBatchStatus.FAILED, errorMessage);
    }

    if (job.uploadId) {
      await refreshUploadSummary(tx, job.uploadId);
    }
  });
}

export async function resetStaleJobs(
  maxDurationMs = DEFAULT_JOB_TIMEOUT_MS
) {
  const cutoff = new Date(Date.now() - maxDurationMs);
  const staleJobs = await prisma.geminiJob.findMany({
    where: {
      status: GeminiJobStatus.IN_PROGRESS,
      startedAt: {
        lt: cutoff,
      },
    },
    include: {
      attempts: {
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  for (const job of staleJobs) {
    await prisma.$transaction(async (tx) => {
      const attempt = job.attempts[0];
      const timeoutMessage = `Job timed out after ${Math.round(maxDurationMs / 1000)}s without completion`;
      if (attempt && attempt.status === GeminiJobAttemptStatus.IN_PROGRESS) {
        await tx.geminiJobAttempt.update({
          where: { id: attempt.id },
          data: {
            status: GeminiJobAttemptStatus.FAILED,
            completedAt: new Date(),
            errorMessage: timeoutMessage,
            errorType: "timeout",
          },
        });
      }

      const retryCount = job.retryCount + 1;
      const exceeded = retryCount >= (job.maxRetries ?? DEFAULT_JOB_MAX_RETRIES);
      const status = exceeded ? GeminiJobStatus.FAILED : GeminiJobStatus.READY;

      await tx.geminiJob.update({
        where: { id: job.id },
        data: {
          status,
          retryCount,
          nextRunAt:
            status === GeminiJobStatus.READY
              ? new Date(Date.now() + computeBackoffDelay(retryCount))
              : new Date(),
          lastError: timeoutMessage,
        },
      });

      if (job.batchId && status === GeminiJobStatus.FAILED) {
        await setBatchStatus(tx, job.batchId, UploadBatchStatus.FAILED, timeoutMessage);
      }

      if (job.uploadId) {
        await refreshUploadSummary(tx, job.uploadId);
      }
    });
  }

  return staleJobs.length;
}

export async function getUploadProgress(uploadId: string) {
  return prisma.spreadsheetUpload.findUnique({
    where: { id: uploadId },
    include: {
      batches: {
        orderBy: { createdAt: "asc" },
        include: {
          jobs: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              type: true,
              status: true,
              retryCount: true,
              dependencyJobId: true,
              priority: true,
              nextRunAt: true,
              startedAt: true,
              completedAt: true,
              lastError: true,
              attempts: {
                orderBy: { startedAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  status: true,
                  modelUsed: true,
                  startedAt: true,
                  completedAt: true,
                  errorMessage: true,
                  errorType: true,
                  requestTokens: true,
                  responseTokens: true,
                  batchTokens: true,
                  statusCode: true,
                  isFallback: true,
                },
              },
            },
          },
        },
      },
      jobs: {
        where: { batchId: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          status: true,
          retryCount: true,
          nextRunAt: true,
          startedAt: true,
          completedAt: true,
          lastError: true,
        },
      },
    },
  });
}

export async function unlockDependentJobs(tx: DbClient, dependencyJobId: string) {
  return tx.geminiJob.updateMany({
    where: {
      dependencyJobId,
      status: GeminiJobStatus.PENDING,
    },
    data: {
      status: GeminiJobStatus.READY,
      nextRunAt: new Date(),
    },
  });
}

async function finalizeAttempt(
  tx: DbClient,
  attemptId: string,
  {
    status,
    completedAt,
    requestTokens,
    responseTokens,
    batchTokens,
    statusCode,
    responseBody,
    errorMessage,
    errorType,
  }: {
    status: GeminiJobAttemptStatus;
    completedAt: Date;
    requestTokens?: number;
    responseTokens?: number;
    batchTokens?: number;
    statusCode?: number;
    responseBody?: unknown;
    errorMessage?: string;
    errorType?: string;
  }
) {
  await tx.geminiJobAttempt.update({
    where: { id: attemptId },
    data: {
      status,
      completedAt,
      requestTokens,
      responseTokens,
      batchTokens,
      statusCode,
      responseBody: responseBody as JsonValue,
      errorMessage,
      errorType,
    },
  });
}

async function appendInsertResults(
  tx: DbClient,
  uploadId: string,
  results: InsertResultItem[]
) {
  if (!results.length) return;
  const current = await tx.spreadsheetUpload.findUnique({
    where: { id: uploadId },
    select: { summaryJson: true },
  });
  const base = toSummaryObject(current?.summaryJson);
  const existing = Array.isArray(base.insertResults)
    ? (base.insertResults as InsertResultItem[])
    : [];
  const next = [...existing, ...results];
  await mergeUploadSummary(tx, uploadId, { insertResults: next });
}

async function maybeEnqueueFinalizationJobs(tx: DbClient, uploadId: string) {
  const pending = await tx.uploadElectionBatch.count({
    where: {
      uploadId,
      status: {
        not: UploadBatchStatus.COMPLETED,
      },
    },
  });
  if (pending > 0) return;

  const existing = await tx.geminiJob.findFirst({
    where: { uploadId, type: GeminiJobType.WORKBOOK },
  });
  if (existing) return;

  const workbook = await tx.geminiJob.create({
    data: {
      uploadId,
      type: GeminiJobType.WORKBOOK,
      status: GeminiJobStatus.READY,
      priority: 70,
      preferredModels: jsonArray([]),
      fallbackModels: jsonArray([]),
      metadata: { stage: "workbook" },
      estimatedRequestTokens: 0,
      estimatedResponseTokens: 0,
    },
  });

  await tx.geminiJob.create({
    data: {
      uploadId,
      type: GeminiJobType.NOTIFICATION,
      status: GeminiJobStatus.PENDING,
      dependencyJobId: workbook.id,
      priority: 60,
      preferredModels: jsonArray([]),
      fallbackModels: jsonArray([]),
      metadata: { stage: "notification" },
      estimatedRequestTokens: 0,
      estimatedResponseTokens: 0,
    },
  });
}

async function refreshUploadSummary(tx: DbClient, uploadId: string) {
  const upload = await tx.spreadsheetUpload.findUnique({
    where: { id: uploadId },
    include: {
      batches: {
        select: {
          status: true,
        },
      },
    },
  });
  if (!upload) return;
  const now = new Date();
  const counts = upload.batches.reduce(
    (acc, batch) => {
      acc.total += 1;
      acc.byStatus[batch.status] = (acc.byStatus[batch.status] || 0) + 1;
      return acc;
    },
    { total: 0, byStatus: {} as Record<string, number> }
  );

  let uploadStatus: SpreadsheetUploadStatus = SpreadsheetUploadStatus.PROCESSING;
  if (counts.byStatus[UploadBatchStatus.FAILED] || counts.byStatus[UploadBatchStatus.NEEDS_REUPLOAD]) {
    uploadStatus = SpreadsheetUploadStatus.FAILED;
  } else if (counts.byStatus[UploadBatchStatus.COMPLETED] === counts.total) {
    uploadStatus = SpreadsheetUploadStatus.COMPLETED;
  }

  const baseSummary = toSummaryObject(upload.summaryJson);
  const nextSummary = {
    ...baseSummary,
    totals: counts,
    updatedAt: now.toISOString(),
  };

  await tx.spreadsheetUpload.update({
    where: { id: upload.id },
    data: {
      status: uploadStatus,
      completedAt:
        uploadStatus === SpreadsheetUploadStatus.COMPLETED ? now : upload.completedAt,
      summaryJson: nextSummary as JsonValue,
    },
  });
}

async function mergeUploadSummary(
  tx: DbClient,
  uploadId: string,
  patch: Record<string, unknown>
) {
  const current = await tx.spreadsheetUpload.findUnique({
    where: { id: uploadId },
    select: { summaryJson: true },
  });
  const base = toSummaryObject(current?.summaryJson);
  const next = {
    ...base,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await tx.spreadsheetUpload.update({
    where: { id: uploadId },
    data: { summaryJson: next as JsonValue },
  });
}

async function setBatchStatus(
  tx: DbClient,
  batchId: string,
  status: UploadBatchStatus,
  errorReason?: string | null
) {
  await tx.uploadElectionBatch.update({
    where: { id: batchId },
    data: {
      status,
      errorReason: errorReason ?? null,
    },
  });
}

function batchStatusForJobStart(type: GeminiJobType): UploadBatchStatus {
  switch (type) {
    case GeminiJobType.ANALYZE:
      return UploadBatchStatus.ANALYZING;
    case GeminiJobType.STRUCTURE:
      return UploadBatchStatus.STRUCTURING;
    case GeminiJobType.INSERT:
      return UploadBatchStatus.INSERTING;
    default:
      return UploadBatchStatus.QUEUED;
  }
}

function buildSummary(
  summary: Record<string, unknown> | null | undefined,
  totalRows: number,
  batchCount: number,
  now: Date,
  forceHidden: boolean
): JsonValue {
  const base = summary && isPlainObject(summary) ? summary : {};
  return {
    ...base,
    totalRows,
    batchCount,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    forceHidden,
  } as JsonValue;
}

function buildJobMetadata(
  stage: string,
  groupKey: string,
  extras?: Record<string, unknown>
): JsonValue {
  return {
    stage,
    groupKey,
    ...(extras || {}),
  };
}

function jsonArray(values: readonly string[]): JsonValue {
  return values as unknown as JsonValue;
}

function jsonArrayOrNull(values: readonly string[]): JsonValue | undefined {
  return values.length ? (values as unknown as JsonValue) : undefined;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toSummaryObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

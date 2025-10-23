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
import { sendWithResend } from "@/lib/email/resend";
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

export class JobNotReadyError extends Error {
  jobId: string;
  status: GeminiJobStatus;

  constructor(jobId: string, status: GeminiJobStatus) {
    super(`Job ${jobId} is not ready (status: ${status})`);
    this.name = "JobNotReadyError";
    this.jobId = jobId;
    this.status = status;
  }
}

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

type StageSummary = {
  queuedAt?: string | null;
  analyzeCompletedAt?: string | null;
  structureCompletedAt?: string | null;
  insertCompletedAt?: string | null;
};

type StageChangeFlags = {
  analyzeJustCompleted: boolean;
  structureJustCompleted: boolean;
  insertJustCompleted: boolean;
};

type SummaryUpdate = {
  uploadStatus: SpreadsheetUploadStatus;
  summary: Record<string, unknown>;
  stageChanges: StageChangeFlags;
  counts: { total: number; byStatus: Record<string, number> };
  fallbackCounts: { analyze: number; structure: number };
  failureCount: number;
};

const TEAM_EMAIL = "team@elevracommunity.com";

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

  const uploadRecord = await prisma.$transaction(async (tx) => {
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

  const summaryUpdate = await refreshUploadSummary(prisma, uploadRecord.id);
  await sendStageNotification({
    uploadId: uploadRecord.id,
    type: UploadNotificationType.QUEUED,
    summary: summaryUpdate?.summary,
  });
  await processSummaryUpdate(uploadRecord.id, summaryUpdate);

  return uploadRecord;
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

export async function hasDispatchableJobs(now = new Date()): Promise<boolean> {
  const job = await prisma.geminiJob.findFirst({
    where: {
      status: GeminiJobStatus.READY,
      nextRunAt: {
        lte: now,
      },
    },
    select: { id: true },
  });
  return Boolean(job);
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
      throw new JobNotReadyError(jobId, job.status);
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
  let summaryUpdate: SummaryUpdate | null = null;
  let uploadIdRef: string | null = null;

  await prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);
    uploadIdRef = job.uploadId;

    const { value: parsed, cleaned } = parseJsonLoose(analysisText);
    if (job.batchId) {
      await tx.uploadElectionBatch.update({
        where: { id: job.batchId },
        data: {
          analysisJson: (parsed ?? cleaned) as JsonValue,
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
      responseBody: (parsed ?? cleaned) as JsonValue,
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
      summaryUpdate = await refreshUploadSummary(tx, job.uploadId);
    }
  });

  if (uploadIdRef && summaryUpdate) {
    const summaryData = summaryUpdate as SummaryUpdate;
    await processSummaryUpdate(uploadIdRef, summaryData);
    if (summaryData.uploadStatus === SpreadsheetUploadStatus.COMPLETED) {
      await cleanupUploadData(uploadIdRef);
    }
  }
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
  let summaryUpdate: SummaryUpdate | null = null;
  let uploadIdRef: string | null = null;

  await prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);
    uploadIdRef = job.uploadId;

    const { value: parsed, cleaned } = parseJsonLoose(structuredText);
    if (job.batchId) {
      await tx.uploadElectionBatch.update({
        where: { id: job.batchId },
        data: {
          structuredJson: (parsed ?? cleaned) as JsonValue,
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
      responseBody: (parsed ?? cleaned) as JsonValue,
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
      summaryUpdate = await refreshUploadSummary(tx, job.uploadId);
    }
  });

  if (uploadIdRef && summaryUpdate) {
    const summaryData = summaryUpdate as SummaryUpdate;
    await processSummaryUpdate(uploadIdRef, summaryData);
    if (summaryData.uploadStatus === SpreadsheetUploadStatus.COMPLETED) {
      await cleanupUploadData(uploadIdRef);
    }
  }
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
  let summaryUpdate: SummaryUpdate | null = null;
  let uploadIdRef: string | null = null;

  await prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);
    uploadIdRef = job.uploadId;

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
      summaryUpdate = await refreshUploadSummary(tx, job.uploadId);
      await maybeEnqueueFinalizationJobs(tx, job.uploadId);
    }
  });

  if (uploadIdRef && summaryUpdate) {
    const summaryData = summaryUpdate as SummaryUpdate;
    await processSummaryUpdate(uploadIdRef, summaryData);
    if (summaryData.uploadStatus === SpreadsheetUploadStatus.COMPLETED) {
      await cleanupUploadData(uploadIdRef);
    }
  }
}

export async function recordWorkbookSuccess({
  jobId,
  attemptId,
  workbookBase64,
  filename,
  summary,
}: WorkbookSuccessOptions) {
  let summaryUpdate: SummaryUpdate | null = null;
  let uploadIdRef: string | null = null;

  await prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);
    uploadIdRef = job.uploadId;

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
      summaryUpdate = await refreshUploadSummary(tx, job.uploadId);
    }
  });

  if (uploadIdRef && summaryUpdate) {
    const summaryData = summaryUpdate as SummaryUpdate;
    await processSummaryUpdate(uploadIdRef, summaryData);
    if (summaryData.uploadStatus === SpreadsheetUploadStatus.COMPLETED) {
      await cleanupUploadData(uploadIdRef);
    }
  }
}

export async function recordNotificationSuccess({
  jobId,
  attemptId,
  messageId,
  recipients,
}: NotificationSuccessOptions) {
  let summaryUpdate: SummaryUpdate | null = null;
  let uploadIdRef: string | null = null;

  await prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);
    uploadIdRef = job.uploadId;

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
      summaryUpdate = await refreshUploadSummary(tx, job.uploadId);
    }
  });

  if (uploadIdRef && summaryUpdate) {
    const summaryData = summaryUpdate as SummaryUpdate;
    await processSummaryUpdate(uploadIdRef, summaryData);
    if (summaryData.uploadStatus === SpreadsheetUploadStatus.COMPLETED) {
      await cleanupUploadData(uploadIdRef);
    }
  }
}

type BatchFailureContext = {
  uploadId: string;
  batchId: string;
  jobType: GeminiJobType;
  errorMessage: string;
};

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
  let summaryUpdate: SummaryUpdate | null = null;
  let uploadIdRef: string | null = null;
  let failureContext: BatchFailureContext | null = null;

  await prisma.$transaction(async (tx) => {
    const job = await tx.geminiJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Gemini job ${jobId} not found`);
    uploadIdRef = job.uploadId ?? null;

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
      await setBatchStatus(
        tx,
        job.batchId,
        UploadBatchStatus.NEEDS_REUPLOAD,
        errorMessage
      );
    }

    if (job.uploadId) {
      summaryUpdate = await refreshUploadSummary(tx, job.uploadId);
      if (status === GeminiJobStatus.FAILED) {
        await maybeEnqueueFinalizationJobs(tx, job.uploadId);
      }
    }

    if (job.uploadId && job.batchId && status === GeminiJobStatus.FAILED) {
      failureContext = {
        uploadId: job.uploadId,
        batchId: job.batchId,
        jobType: job.type,
        errorMessage,
      };
    }
  });

  if (uploadIdRef && summaryUpdate) {
    const summaryData = summaryUpdate as SummaryUpdate;
    await processSummaryUpdate(uploadIdRef, summaryData);
    if (summaryData.uploadStatus === SpreadsheetUploadStatus.COMPLETED) {
      await cleanupUploadData(uploadIdRef);
    }
  }
  if (failureContext) {
    await sendBatchFailureNotification(failureContext);
  }
}

export async function resetStaleJobs(
  maxDurationMs = DEFAULT_JOB_TIMEOUT_MS
) {
  const cutoff = new Date(Date.now() - maxDurationMs);
  const summaryQueue: Array<{ uploadId: string; update: SummaryUpdate }> = [];
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
        await setBatchStatus(
          tx,
          job.batchId,
          UploadBatchStatus.NEEDS_REUPLOAD,
          timeoutMessage
        );
      }

      if (job.uploadId) {
        const update = await refreshUploadSummary(tx, job.uploadId);
        if (update) {
          summaryQueue.push({ uploadId: job.uploadId, update });
        }
      }
    });
  }

  for (const entry of summaryQueue) {
    const updateSnapshot = entry.update;
    await processSummaryUpdate(entry.uploadId, updateSnapshot);
    if (updateSnapshot.uploadStatus === SpreadsheetUploadStatus.COMPLETED) {
      await cleanupUploadData(entry.uploadId);
    }
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
  const blockingStatuses = [
    UploadBatchStatus.QUEUED,
    UploadBatchStatus.ANALYZING,
    UploadBatchStatus.STRUCTURING,
    UploadBatchStatus.INSERTING,
  ];
  const pending = await tx.uploadElectionBatch.count({
    where: {
      uploadId,
      status: {
        in: blockingStatuses,
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

async function refreshUploadSummary(
  tx: DbClient,
  uploadId: string
): Promise<SummaryUpdate | null> {
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
  if (!upload) return null;
  const now = new Date();
  const nowIso = now.toISOString();
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
  const previousStages = toStageSummary(baseSummary.stages);

  const analyzeCompleteNow =
    counts.total > 0 &&
    (counts.byStatus[UploadBatchStatus.QUEUED] || 0) === 0 &&
    (counts.byStatus[UploadBatchStatus.ANALYZING] || 0) === 0;
  const structureCompleteNow =
    analyzeCompleteNow && (counts.byStatus[UploadBatchStatus.STRUCTURING] || 0) === 0;
  const insertCompleteNow =
    structureCompleteNow &&
    (counts.byStatus[UploadBatchStatus.INSERTING] || 0) === 0 &&
    (counts.byStatus[UploadBatchStatus.COMPLETED] || 0) === counts.total &&
    counts.total > 0;

  const analyzeJustCompleted =
    analyzeCompleteNow && !previousStages.analyzeCompletedAt;
  const structureJustCompleted =
    structureCompleteNow && !previousStages.structureCompletedAt;
  const insertJustCompleted =
    insertCompleteNow && !previousStages.insertCompletedAt;

  const stageInfo: StageSummary = {
    queuedAt: previousStages.queuedAt ?? nowIso,
    analyzeCompletedAt: previousStages.analyzeCompletedAt ?? (analyzeJustCompleted ? nowIso : null),
    structureCompletedAt: previousStages.structureCompletedAt ?? (structureJustCompleted ? nowIso : null),
    insertCompletedAt: previousStages.insertCompletedAt ?? (insertJustCompleted ? nowIso : null),
  };

  const [analyzeFallback, structureFallback] = await Promise.all([
    tx.geminiJobAttempt.count({
      where: {
        job: { uploadId, type: GeminiJobType.ANALYZE },
        isFallback: true,
      },
    }),
    tx.geminiJobAttempt.count({
      where: {
        job: { uploadId, type: GeminiJobType.STRUCTURE },
        isFallback: true,
      },
    }),
  ]);

  const failureCount =
    (counts.byStatus[UploadBatchStatus.FAILED] || 0) +
    (counts.byStatus[UploadBatchStatus.NEEDS_REUPLOAD] || 0);

  const nextSummary = {
    ...baseSummary,
    totals: counts,
    stages: stageInfo,
    fallbacks: {
      analyze: analyzeFallback,
      structure: structureFallback,
    },
    failureCount,
    updatedAt: nowIso,
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

  return {
    uploadStatus,
    summary: nextSummary,
    stageChanges: {
      analyzeJustCompleted,
      structureJustCompleted,
      insertJustCompleted,
    },
    counts,
    fallbackCounts: {
      analyze: analyzeFallback,
      structure: structureFallback,
    },
    failureCount,
  };
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

function parseJsonLoose(
  text: string
): { value: unknown | null; cleaned: string } {
  const trimmed = text.trim();
  try {
    return { value: JSON.parse(trimmed), cleaned: trimmed };
  } catch {
    const repaired = repairJsonString(trimmed);
    if (repaired !== trimmed) {
      try {
        return { value: JSON.parse(repaired), cleaned: repaired };
      } catch {
        // continue
      }
    }
    return { value: null, cleaned: repaired };
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

function toStageSummary(value: unknown): StageSummary {
  if (!value || typeof value !== "object") {
    return {};
  }
  const input = value as Record<string, unknown>;
  return {
    queuedAt: typeof input.queuedAt === "string" ? input.queuedAt : null,
    analyzeCompletedAt:
      typeof input.analyzeCompletedAt === "string" ? input.analyzeCompletedAt : null,
    structureCompletedAt:
      typeof input.structureCompletedAt === "string"
        ? input.structureCompletedAt
        : null,
    insertCompletedAt:
      typeof input.insertCompletedAt === "string" ? input.insertCompletedAt : null,
  };
}

function repairJsonString(text: string): string {
  let output = text;
  // Remove Markdown code fences (e.g., ```json ... ```).
  output = output.replace(/^```(?:json)?\s*([\s\S]*?)```$/gi, "$1");
  // Replace smart quotes with standard ASCII equivalents.
  output = output
    .replace(/\u2018|\u2019|\u201A|\u201B/g, "'")
    .replace(/\u201C|\u201D|\u201E|\u201F/g, '"');
  // Normalize explicit "N/A" strings to null to avoid invalid tokens like ""N/A"".
  output = output.replace(/"N\/A"/g, "null");
  // Replace bare N/A tokens (not adjacent to quotes) with null.
  output = output.replace(/\bN\/A\b/g, (match, offset, str) => {
    const prev = str[offset - 1];
    const next = str[offset + match.length];
    if (prev === '"' || next === '"') {
      return match;
    }
    return "null";
  });
  // Remove trailing commas before object/array terminators.
  output = output.replace(/,\s*(?=[}\]])/g, "");
  return output;
}

async function processSummaryUpdate(
  uploadId: string,
  update: SummaryUpdate | null
) {
  if (!update) return;
  if (update.stageChanges.analyzeJustCompleted) {
    await sendStageNotification({
      uploadId,
      type: UploadNotificationType.ANALYZE_COMPLETE,
      summary: update.summary,
    });
  }
  if (update.stageChanges.structureJustCompleted) {
    await sendStageNotification({
      uploadId,
      type: UploadNotificationType.STRUCTURE_COMPLETE,
      summary: update.summary,
    });
  }
  if (update.stageChanges.insertJustCompleted) {
    await sendStageNotification({
      uploadId,
      type: UploadNotificationType.INSERT_COMPLETE,
      summary: update.summary,
    });
  }
}

type StageNotificationArgs = {
  uploadId: string;
  type: UploadNotificationType;
  summary?: Record<string, unknown>;
};

async function sendStageNotification({
  uploadId,
  type,
  summary,
}: StageNotificationArgs) {
  if (type !== UploadNotificationType.BATCH_FAILURE) {
    const existing = await prisma.uploadNotificationLog.findFirst({
      where: {
        uploadId,
        type,
        status: UploadNotificationStatus.SENT,
      },
    });
    if (existing) return;
  }

  const upload = await prisma.spreadsheetUpload.findUnique({
    where: { id: uploadId },
    select: {
      uploaderEmail: true,
      originalFilename: true,
      summaryJson: true,
    },
  });
  if (!upload) return;

  const summaryData = summary ?? toSummaryObject(upload.summaryJson);
  const recipients = collectRecipients(upload.uploaderEmail);
  if (!recipients.length) return;

  const { subject, html, metadata } = buildStageNotificationContent(
    type,
    uploadId,
    upload.originalFilename ?? undefined,
    summaryData
  );

  await deliverNotification({
    uploadId,
    type,
    recipients,
    subject,
    html,
    metadata: {
      ...metadata,
      summary: summaryData,
    },
  });
}

async function sendBatchFailureNotification(ctx: BatchFailureContext) {
  const existing = await prisma.uploadNotificationLog.findFirst({
    where: {
      uploadId: ctx.uploadId,
      type: UploadNotificationType.BATCH_FAILURE,
      status: UploadNotificationStatus.SENT,
      metadata: { path: ["batchId"], equals: ctx.batchId },
    },
  });
  if (existing) return;

  const [upload, batch] = await Promise.all([
    prisma.spreadsheetUpload.findUnique({
      where: { id: ctx.uploadId },
      select: { uploaderEmail: true, originalFilename: true },
    }),
    prisma.uploadElectionBatch.findUnique({
      where: { id: ctx.batchId },
      select: {
        municipality: true,
        state: true,
        position: true,
      },
    }),
  ]);
  if (!upload) return;

  const recipients = collectRecipients(upload.uploaderEmail);
  if (!recipients.length) return;

  const title = upload.originalFilename ?? ctx.uploadId;
  const batchLabel = batch
    ? [batch.position, batch.municipality, batch.state]
        .filter(Boolean)
        .join(" – ")
    : ctx.batchId;

  const subject = `Gemini batch failure – ${title}`;
  const html = `
    <p>Gemini could not process the batch <strong>${escapeHtml(
      batchLabel
    )}</strong>.</p>
    <ul>
      <li><strong>Upload ID:</strong> ${escapeHtml(ctx.uploadId)}</li>
      <li><strong>Job type:</strong> ${escapeHtml(ctx.jobType)}</li>
      <li><strong>Error:</strong> ${escapeHtml(ctx.errorMessage)}</li>
    </ul>
    <p>The batch has been marked for manual review. Use the admin dashboard to retry once the issue is resolved.</p>
  `;

  await deliverNotification({
    uploadId: ctx.uploadId,
    type: UploadNotificationType.BATCH_FAILURE,
    recipients,
    subject,
    html,
    metadata: {
      batchId: ctx.batchId,
      jobType: ctx.jobType,
      error: ctx.errorMessage,
    },
  });
}

type DeliverNotificationArgs = {
  uploadId: string;
  type: UploadNotificationType;
  recipients: string[];
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
};

async function deliverNotification({
  uploadId,
  type,
  recipients,
  subject,
  html,
  metadata,
}: DeliverNotificationArgs) {
  if (!recipients.length) return;

  const batchIdFilter =
    metadata && typeof (metadata as Record<string, unknown>).batchId === "string"
      ? String((metadata as Record<string, unknown>).batchId)
      : undefined;

  const dedupeConditions: Prisma.UploadNotificationLogWhereInput = {
    uploadId,
    type,
    status: UploadNotificationStatus.SENT,
  };
  if (batchIdFilter) {
    dedupeConditions.metadata = {
      path: ["batchId"],
      equals: batchIdFilter,
    };
  }

  const existing = await prisma.uploadNotificationLog.findFirst({
    where: dedupeConditions,
  });
  if (existing) return;

  const log = await prisma.uploadNotificationLog.create({
    data: {
      uploadId,
      email: recipients.join(", "),
      type,
      status: UploadNotificationStatus.QUEUED,
      metadata: normalizeMetadata(metadata),
    },
  });

  try {
    const result = await sendWithResend({
      to: recipients,
      subject,
      html,
    });
    await prisma.uploadNotificationLog.update({
      where: { id: log.id },
      data: {
        status: UploadNotificationStatus.SENT,
        responseId: result?.id ?? null,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to send upload notification", {
      uploadId,
      type,
      error,
    });
    await prisma.uploadNotificationLog.update({
      where: { id: log.id },
      data: {
        status: UploadNotificationStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

function buildStageNotificationContent(
  type: UploadNotificationType,
  uploadId: string,
  originalFilename: string | undefined,
  summary: Record<string, unknown>
): { subject: string; html: string; metadata?: Record<string, unknown> } {
  const totals = readTotals(summary);
  const fallbacks = readFallbacks(summary);
  const stageSource =
    (summary as { stages?: unknown }).stages !== undefined
      ? (summary as { stages?: unknown }).stages
      : undefined;
  const stages = toStageSummary(stageSource);
  const title = originalFilename || uploadId;

  const baseLines = [
    `Total batches: ${totals.total}`,
    `Completed: ${totals.byStatus[UploadBatchStatus.COMPLETED] || 0}`,
    `Queued: ${totals.byStatus[UploadBatchStatus.QUEUED] || 0}`,
    `Analyzing: ${totals.byStatus[UploadBatchStatus.ANALYZING] || 0}`,
    `Structuring: ${totals.byStatus[UploadBatchStatus.STRUCTURING] || 0}`,
    `Inserting: ${totals.byStatus[UploadBatchStatus.INSERTING] || 0}`,
    `Failures: ${totals.byStatus[UploadBatchStatus.FAILED] || 0}`,
    `Fallback (analyze): ${fallbacks.analyze}`,
    `Fallback (structure): ${fallbacks.structure}`,
  ];

  let subject = "";
  let intro = "";

  switch (type) {
    case UploadNotificationType.QUEUED:
      subject = `Gemini upload queued – ${title}`;
      intro =
        "The spreadsheet has been queued for Gemini processing. We'll notify you as each phase completes.";
      break;
    case UploadNotificationType.ANALYZE_COMPLETE:
      subject = `Gemini analyze phase complete – ${title}`;
      intro = `All analyze jobs finished at ${formatIso(stages.analyzeCompletedAt)}. Structure jobs are starting next.`;
      break;
    case UploadNotificationType.STRUCTURE_COMPLETE:
      subject = `Gemini structure phase complete – ${title}`;
      intro = `Structure jobs finished at ${formatIso(stages.structureCompletedAt)}. Insert jobs are now running.`;
      break;
    case UploadNotificationType.INSERT_COMPLETE:
      subject = `Gemini insert phase complete – ${title}`;
      intro = `All insert jobs finished at ${formatIso(
        stages.insertCompletedAt
      )}. Workbook generation and final notification will follow.`;
      break;
    default:
      subject = `Gemini update – ${title}`;
      intro = "Here is the current status of your Gemini upload.";
      break;
  }

  const html = `
    <p>${intro}</p>
    ${renderHtmlList(baseLines)}
    <p><strong>Upload ID:</strong> ${escapeHtml(uploadId)}</p>
  `;

  return { subject, html };
}

function readTotals(summary: Record<string, unknown>): {
  total: number;
  byStatus: Record<string, number>;
} {
  const totalsRaw = toSummaryObject(summary.totals);
  const total = typeof totalsRaw.total === "number" ? totalsRaw.total : 0;
  const byStatusRaw = toSummaryObject(totalsRaw.byStatus);
  const byStatus: Record<string, number> = {};
  for (const [key, value] of Object.entries(byStatusRaw)) {
    if (typeof value === "number") {
      byStatus[key] = value;
    }
  }
  return { total, byStatus };
}

function readFallbacks(summary: Record<string, unknown>): {
  analyze: number;
  structure: number;
} {
  const raw = toSummaryObject(summary.fallbacks);
  return {
    analyze: typeof raw.analyze === "number" ? raw.analyze : 0,
    structure: typeof raw.structure === "number" ? raw.structure : 0,
  };
}

function collectRecipients(uploaderEmail?: string | null): string[] {
  const set = new Set<string>();
  set.add(TEAM_EMAIL);
  if (uploaderEmail && uploaderEmail.includes("@")) {
    set.add(uploaderEmail);
  }
  return Array.from(set);
}

function renderHtmlList(items: string[]): string {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return "";
  const inner = filtered
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return `<ul>${inner}</ul>`;
}

function formatIso(value?: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const adjusted = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  return adjusted.toLocaleString("en-US", { timeZone: "UTC" });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeMetadata(value?: Record<string, unknown>): Prisma.InputJsonValue {
  if (!value) {
    return JSON.parse("null") as Prisma.InputJsonValue;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return value as Prisma.InputJsonValue;
  }
}

async function cleanupUploadData(uploadId: string) {
  await prisma.uploadElectionBatch.updateMany({
    where: { uploadId },
    data: {
      rawRows: Prisma.JsonNull,
      analysisJson: Prisma.JsonNull,
      structuredJson: Prisma.JsonNull,
    },
  });
  await mergeUploadSummary(prisma, uploadId, {
    cleanedAt: new Date().toISOString(),
  });
}

export async function retryUploadBatch(uploadId: string, batchId: string) {
  let summaryUpdate: SummaryUpdate | null = null;
  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadElectionBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch || batch.uploadId !== uploadId) {
      throw new Error("Batch not found for upload");
    }

    if (batch.analyzeJobId) {
      await tx.geminiJobAttempt.deleteMany({
        where: { jobId: batch.analyzeJobId },
      });
      await tx.geminiJob.update({
        where: { id: batch.analyzeJobId },
        data: {
          status: GeminiJobStatus.READY,
          retryCount: 0,
          lastError: null,
          startedAt: null,
          completedAt: null,
          nextRunAt: new Date(),
        },
      });
    }
    if (batch.structureJobId) {
      await tx.geminiJobAttempt.deleteMany({
        where: { jobId: batch.structureJobId },
      });
      await tx.geminiJob.update({
        where: { id: batch.structureJobId },
        data: {
          status: GeminiJobStatus.PENDING,
          retryCount: 0,
          lastError: null,
          startedAt: null,
          completedAt: null,
          nextRunAt: new Date(),
        },
      });
    }
    if (batch.insertJobId) {
      await tx.geminiJobAttempt.deleteMany({
        where: { jobId: batch.insertJobId },
      });
      await tx.geminiJob.update({
        where: { id: batch.insertJobId },
        data: {
          status: GeminiJobStatus.PENDING,
          retryCount: 0,
          lastError: null,
          startedAt: null,
          completedAt: null,
          nextRunAt: new Date(),
        },
      });
    }

    await tx.uploadElectionBatch.update({
      where: { id: batchId },
      data: {
        status: UploadBatchStatus.QUEUED,
        errorReason: null,
        analysisJson: Prisma.JsonNull,
        structuredJson: Prisma.JsonNull,
      },
    });

    summaryUpdate = await refreshUploadSummary(tx, uploadId);
  });

  if (summaryUpdate) {
    await processSummaryUpdate(uploadId, summaryUpdate);
  }

  return getUploadProgress(uploadId);
}

export async function skipUploadBatch(
  uploadId: string,
  batchId: string,
  reason?: string
) {
  let summaryUpdate: SummaryUpdate | null = null;
  let failureContext: BatchFailureContext | null = null;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadElectionBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch || batch.uploadId !== uploadId) {
      throw new Error("Batch not found for upload");
    }

    const note = reason?.trim().length ? reason.trim() : "Marked for re-upload";

    if (batch.analyzeJobId) {
      await tx.geminiJob.update({
        where: { id: batch.analyzeJobId },
        data: {
          status: GeminiJobStatus.SKIPPED,
          lastError: note,
          completedAt: new Date(),
        },
      });
    }
    if (batch.structureJobId) {
      await tx.geminiJob.update({
        where: { id: batch.structureJobId },
        data: {
          status: GeminiJobStatus.SKIPPED,
          lastError: note,
          completedAt: new Date(),
        },
      });
    }
    if (batch.insertJobId) {
      await tx.geminiJob.update({
        where: { id: batch.insertJobId },
        data: {
          status: GeminiJobStatus.SKIPPED,
          lastError: note,
          completedAt: new Date(),
        },
      });
    }

    await tx.uploadElectionBatch.update({
      where: { id: batchId },
      data: {
        status: UploadBatchStatus.NEEDS_REUPLOAD,
        errorReason: note,
        analysisJson: Prisma.JsonNull,
        structuredJson: Prisma.JsonNull,
      },
    });

    summaryUpdate = await refreshUploadSummary(tx, uploadId);
    failureContext = {
      uploadId,
      batchId,
      jobType: GeminiJobType.ANALYZE,
      errorMessage: note,
    };
  });

  if (summaryUpdate) {
    await processSummaryUpdate(uploadId, summaryUpdate);
  }
  if (failureContext) {
    await sendBatchFailureNotification(failureContext);
  }

  return getUploadProgress(uploadId);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import {
  listDispatchableJobs,
  markJobAsInProgress,
  recordAnalyzeSuccess,
  recordStructureSuccess,
  recordInsertSuccess,
  recordWorkbookSuccess,
  recordNotificationSuccess,
  recordJobFailure,
  resetStaleJobs,
  unlockDependentJobs,
  JobNotReadyError,
} from "./queue";
import {
  reserveModelCapacity,
  adjustModelUsage,
  cleanupOldRateWindows,
} from "./rate-limit";
import {
  executeAnalyzeJob,
  executeStructureJob,
  executeInsertJob,
  executeWorkbookJob,
  executeNotificationJob,
  type GeminiJobWithRelations,
} from "./job-handlers";
import {
  GEMINI_DISPATCH_DEFAULT_TIME_BUDGET_MS,
  GEMINI_DISPATCH_MAX_PER_TICK,
} from "./constants";
import { GeminiJobType } from "@prisma/client";

export type DispatcherOptions = {
  maxJobs?: number;
  timeBudgetMs?: number;
};

export type DispatcherRunStats = {
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
  rateLimited: number;
  staleResets: number;
  errors?: Array<{ jobId: string; message: string }>;
};

export async function runGeminiDispatcher(
  options: DispatcherOptions = {}
): Promise<DispatcherRunStats> {
  const maxJobs = options.maxJobs ?? GEMINI_DISPATCH_MAX_PER_TICK;
  const timeBudget = options.timeBudgetMs ?? GEMINI_DISPATCH_DEFAULT_TIME_BUDGET_MS;
  const startedAt = Date.now();
  const stats: DispatcherRunStats = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    rateLimited: 0,
    staleResets: 0,
    errors: [],
  };

  stats.staleResets = await resetStaleJobs();
  await cleanupOldRateWindows(prisma);

  const jobs = await listDispatchableJobs(maxJobs);
  if (jobs.length === 0) {
    return stats;
  }

  const concurrencyEnv = Number(process.env.GEMINI_DISPATCH_CONCURRENCY ?? "4");
  const maxConcurrency = Math.max(
    1,
    Math.min(
      jobs.length,
      Number.isFinite(concurrencyEnv) && concurrencyEnv > 0 ? concurrencyEnv : 4
    )
  );

  let timeExpired = false;
  let cursor = 0;

  const processJob = async (job: GeminiJobWithRelations) => {
    const models = buildModelList(job);
    if (!models.length) {
      stats.skipped += 1;
      return;
    }

    for (const candidate of models) {
      const reservation = await reserveModelCapacity(prisma, {
        model: candidate.name,
        requestTokens: job.estimatedRequestTokens ?? 0,
        responseTokens: job.estimatedResponseTokens ?? 0,
      });

      if (!reservation.allowed) {
        stats.rateLimited += 1;
        await scheduleRetry(job.id, reservation.retryAt, candidate.reason);
        continue;
      }

      let attemptId: string | null = null;
      try {
        const claim = await markJobAsInProgress(job.id, {
          modelUsed: candidate.name,
          isFallback: candidate.isFallback,
          rateWindowStart: reservation.windowStart,
        });
        attemptId = claim.attempt.id;
        stats.attempted += 1;
        const result = await executeJob(job, candidate.name);
        await handleJobSuccess(job, claim.attempt.id, result);
        await adjustUsageDelta(job, candidate.name, reservation.windowStart, result);
        stats.succeeded += 1;
        return;
      } catch (err: any) {
        if (err instanceof JobNotReadyError) {
          stats.skipped += 1;
          return;
        }
        const retryable = isRetryableError(err);
        const message = normalizeErrorMessage(err);
        stats.failed += 1;
        console.error("[gemini-dispatch] job failure", {
          jobId: job.id,
          type: job.type,
          model: candidate.name,
          retryable,
          message,
          stack: err instanceof Error ? err.stack : undefined,
        });
        if (stats.errors && stats.errors.length < 10) {
          stats.errors.push({ jobId: job.id, message });
        }
        if (attemptId) {
          await recordJobFailure({
            jobId: job.id,
            attemptId,
            errorMessage: message,
            errorType: err?.name || "error",
            retryable,
          });
        }
        if (!retryable) {
          return;
        }
        const retryDelay = err?.retryAfter ? Number(err.retryAfter) * 1000 : undefined;
        if (retryDelay) {
          await scheduleRetry(job.id, new Date(Date.now() + retryDelay));
        }
      }
    }

    stats.skipped += 1;
  };

  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= jobs.length) return;
      if (timeExpired || Date.now() - startedAt > timeBudget) {
        timeExpired = true;
        stats.skipped += 1;
        continue;
      }
      await processJob(jobs[index]);
    }
  };

  await Promise.all(Array.from({ length: maxConcurrency }, () => worker()));

  return stats;
}

function buildModelList(job: GeminiJobWithRelations) {
  const preferred = parseModelArray(job.preferredModels);
  const fallback = parseModelArray(job.fallbackModels);
  const models: Array<{ name: string; isFallback: boolean; reason?: string }> = [];
  preferred.forEach((name) =>
    models.push({ name, isFallback: false, reason: "preferred" })
  );
  fallback.forEach((name) =>
    models.push({ name, isFallback: true, reason: "fallback" })
  );
  return models;
}

async function executeJob(
  job: GeminiJobWithRelations,
  model: string
): Promise<
  | AnalyzeJobResult
  | StructureJobResult
  | InsertJobResult
  | WorkbookJobResult
  | NotificationJobResult
> {
  switch (job.type) {
    case GeminiJobType.ANALYZE:
      return executeAnalyzeJob(job, model);
    case GeminiJobType.STRUCTURE:
      return executeStructureJob(job, model);
    case GeminiJobType.INSERT:
      return executeInsertJob(job);
    case GeminiJobType.WORKBOOK:
      return executeWorkbookJob(job);
    case GeminiJobType.NOTIFICATION:
      return executeNotificationJob(job);
    default:
      throw new Error(`Unsupported job type: ${job.type}`);
  }
}

async function handleJobSuccess(
  job: GeminiJobWithRelations,
  attemptId: string,
  result: JobResult
) {
  if (job.type === GeminiJobType.ANALYZE) {
    const analyze = result as AnalyzeJobResult;
    await recordAnalyzeSuccess({
      jobId: job.id,
      attemptId,
      analysisText: analyze.text,
      requestTokens: analyze.requestTokens,
      responseTokens: analyze.responseTokens,
      batchTokens: analyze.totalTokens,
      statusCode: analyze.statusCode,
    });
    return;
  }
  if (job.type === GeminiJobType.STRUCTURE) {
    const structure = result as StructureJobResult;
    await recordStructureSuccess({
      jobId: job.id,
      attemptId,
      structuredText: structure.text,
      requestTokens: structure.requestTokens,
      responseTokens: structure.responseTokens,
      batchTokens: structure.totalTokens,
      statusCode: structure.statusCode,
    });
    return;
  }
  if (job.type === GeminiJobType.INSERT) {
    const insert = result as InsertJobResult;
    await recordInsertSuccess({
      jobId: job.id,
      attemptId,
      resultSummary: insert.resultSummary,
    });
    await unlockDependentJobs(prisma, job.id);
    return;
  }
  if (job.type === GeminiJobType.WORKBOOK) {
    const workbook = result as WorkbookJobResult;
    await recordWorkbookSuccess({
      jobId: job.id,
      attemptId,
      workbookBase64: workbook.workbookBase64,
      filename: workbook.filename,
      summary: workbook.summary,
    });
    return;
  }
  if (job.type === GeminiJobType.NOTIFICATION) {
    const notification = result as NotificationJobResult;
    await recordNotificationSuccess({
      jobId: job.id,
      attemptId,
      messageId: notification.messageId,
      recipients: notification.recipients,
    });
    return;
  }
}

async function adjustUsageDelta(
  job: GeminiJobWithRelations,
  model: string,
  windowStart: Date,
  result: JobResult
) {
  if (
    job.type === GeminiJobType.INSERT ||
    job.type === GeminiJobType.WORKBOOK ||
    job.type === GeminiJobType.NOTIFICATION
  )
    return;
  const analytics = result as AnalyzeJobResult;
  const requestEstimate = job.estimatedRequestTokens ?? 0;
  const responseEstimate = job.estimatedResponseTokens ?? 0;
  const requestActual = analytics.requestTokens ?? requestEstimate;
  const responseActual = analytics.responseTokens ?? responseEstimate;
  const requestDelta = requestActual - requestEstimate;
  const responseDelta = responseActual - responseEstimate;
  if (requestDelta === 0 && responseDelta === 0) return;
  await adjustModelUsage(prisma, model, windowStart, {
    requestTokensDelta: requestDelta,
    responseTokensDelta: responseDelta,
  });
}

async function scheduleRetry(
  jobId: string,
  retryAt: Date,
  reason?: string
) {
  await prisma.geminiJob.update({
    where: { id: jobId },
    data: {
      nextRunAt: retryAt,
      lastError: reason ? `Rate limited: ${reason}` : "Rate limited",
    },
  });
}

function parseModelArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return true;
  const status = (err as { status?: number }).status;
  if (status === 400 || status === 403 || status === 404) return false;
  return true;
}

function normalizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const stackLine = err.stack?.split("\n")[1]?.trim();
    return stackLine ? `${err.message} (${stackLine})` : err.message;
  }
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

type AnalyzeJobResult = Awaited<ReturnType<typeof executeAnalyzeJob>>;
type StructureJobResult = Awaited<ReturnType<typeof executeStructureJob>>;
type InsertJobResult = Awaited<ReturnType<typeof executeInsertJob>>;

type WorkbookJobResult = Awaited<ReturnType<typeof executeWorkbookJob>>;

type NotificationJobResult = Awaited<ReturnType<typeof executeNotificationJob>>;

type JobResult =
  | AnalyzeJobResult
  | StructureJobResult
  | InsertJobResult
  | WorkbookJobResult
  | NotificationJobResult;

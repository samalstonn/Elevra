/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/prisma/prisma";
import { Prisma } from "@prisma/client";
import {
  readGeminiBatchResponses,
  startGeminiBatch,
  estimateTokensForBatch,
  type GeminiBatchMode,
  type GeminiBatchRequest,
} from "@/lib/gemini-batch";
import {
  buildStructureRequest,
  type GeminiPreparedGroup,
} from "@/lib/gemini-batch-prep";
import { ingestStructuredPayload } from "@/lib/admin/structured-ingest";
import { sendWithResend } from "@/lib/email/resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_ANALYZE_JOBS_PER_RUN = 3;
const MAX_STRUCTURE_JOBS_PER_RUN = 3;
const MAX_INGEST_PER_RUN = 2;
const MAX_ENQUEUED_TOKENS = 5_000_000;
const ACTIVE_JOB_STATUSES = [
  "PENDING_ANALYZE",
  "ANALYZE_SUBMITTED",
  "STRUCTURE_SUBMITTED",
  "STRUCTURE_COMPLETED",
  "INGEST_PENDING",
  "INGEST_RUNNING",
] as const;

const TEAM_EMAIL = "team@elevracommunity.com";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Use POST" });
}

export async function POST() {
  const geminiEnabled = process.env.GEMINI_ENABLED
    ? process.env.GEMINI_ENABLED === "true"
    : process.env.NODE_ENV === "production";
  if (!geminiEnabled || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      ok: false,
      skipped: true,
      reason: "Gemini disabled or missing API key",
    });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const summary = {
    analyzeChecked: 0,
    analyzeCompleted: 0,
    structureStarted: 0,
    structureCompleted: 0,
    ingested: 0,
    errors: [] as string[],
  };

  await processAnalyzeJobs(ai, summary).catch((error) => {
    console.error("[cron gemini] analyze processing failed", error);
    summary.errors.push(`analyze:${error instanceof Error ? error.message : String(error)}`);
  });

  await startStructureJobs(ai, summary).catch((error) => {
    console.error("[cron gemini] structure start failed", error);
    summary.errors.push(`structure-start:${error instanceof Error ? error.message : String(error)}`);
  });

  await processStructureJobs(ai, summary).catch((error) => {
    console.error("[cron gemini] structure processing failed", error);
    summary.errors.push(`structure:${error instanceof Error ? error.message : String(error)}`);
  });

  await processIngestion(summary).catch((error) => {
    console.error("[cron gemini] ingestion failed", error);
    summary.errors.push(`ingest:${error instanceof Error ? error.message : String(error)}`);
  });

  return NextResponse.json({ ok: summary.errors.length === 0, summary });
}

async function processAnalyzeJobs(
  ai: GoogleGenAI,
  summary: {
    analyzeChecked: number;
    analyzeCompleted: number;
    structureStarted: number;
    structureCompleted: number;
    ingested: number;
    errors: string[];
  }
) {
  const jobs = await prisma.geminiBatchJob.findMany({
    where: {
      status: "ANALYZE_SUBMITTED",
    },
    orderBy: { analyzeSubmittedAt: "asc" },
    take: MAX_ANALYZE_JOBS_PER_RUN,
    include: { groups: { orderBy: { order: "asc" } } },
  });

  for (const job of jobs) {
    summary.analyzeChecked += 1;
    if (!job.analyzeJobName || !job.analyzeMode) {
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          analyzeError: "Missing analyze job reference",
          lastProcessedAt: new Date(),
        },
      });
      continue;
    }

    const state = await ai.batches.get({ name: job.analyzeJobName });
    if (state.state === "JOB_STATE_SUCCEEDED") {
      await handleAnalyzeSuccess(ai, job.id, state, job.analyzeMode as GeminiBatchMode);
      summary.analyzeCompleted += 1;
    } else if (state.state === "JOB_STATE_FAILED" || state.state === "JOB_STATE_CANCELLED") {
      const detail = state.error?.message || state.state;
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          analyzeError: detail,
          lastProcessedAt: new Date(),
        },
      });
    }
  }
}

async function handleAnalyzeSuccess(
  ai: GoogleGenAI,
  jobId: number,
  jobState: any,
  mode: GeminiBatchMode
) {
  const job = await prisma.geminiBatchJob.findUnique({
    where: { id: jobId },
    include: { groups: { orderBy: { order: "asc" } } },
  });
  if (!job) return;

  const keys = job.groups.map((group) => group.key);
  const responses = await readGeminiBatchResponses({
    ai,
    job: jobState,
    mode,
    keys,
  });

  const now = new Date();
  let successCount = 0;
  const updates: Promise<unknown>[] = [];
  responses.forEach((item, index) => {
    const group = job.groups[index];
    if (!group) return;
    if (item.error) {
      updates.push(
        prisma.geminiBatchGroup.update({
          where: { id: group.id },
          data: {
            analyzeError: item.error,
            status: "ANALYZE_FAILED",
            analyzeCompletedAt: now,
          },
        })
      );
      return;
    }
    if (item.text) {
      successCount += 1;
      updates.push(
        prisma.geminiBatchGroup.update({
          where: { id: group.id },
          data: {
            analyzeText: item.text,
            status: "ANALYZE_COMPLETED",
            analyzeCompletedAt: now,
          },
        })
      );
    }
  });

  await Promise.all(updates);

  await prisma.geminiBatchJob.update({
    where: { id: jobId },
    data: {
      status: successCount > 0 ? "ANALYZE_COMPLETED" : "FAILED",
      analyzeCompletedAt: now,
      lastProcessedAt: now,
    },
  });

  const shouldSendEmail = successCount > 0 && !job.analyzeEmailSentAt;
  if (shouldSendEmail) {
    const uploads = new Set<string>([
      job.uploaderEmail,
      TEAM_EMAIL,
    ]);
    const recipients = Array.from(uploads).filter(Boolean);

    try {
      await sendWithResend({
        to: recipients,
        subject: `Gemini analyze completed for job #${jobId}`,
        html:
          `<p>Gemini analysis finished for job <strong>${
            job.displayName || jobId
          }</strong>.</p>` +
          `<p>${successCount} group(s) ready for structuring.</p>`,
      });
      await prisma.geminiBatchJob.update({
        where: { id: jobId },
        data: { analyzeEmailSentAt: new Date() },
      });
    } catch (error) {
      console.error("[cron gemini] failed to send analyze email", error);
    }
  }
}

async function startStructureJobs(
  ai: GoogleGenAI,
  summary: {
    analyzeChecked: number;
    analyzeCompleted: number;
    structureStarted: number;
    structureCompleted: number;
    ingested: number;
    errors: string[];
  }
) {
  const jobs = await prisma.geminiBatchJob.findMany({
    where: {
      status: "ANALYZE_COMPLETED",
    },
    orderBy: { analyzeCompletedAt: "asc" },
    take: MAX_STRUCTURE_JOBS_PER_RUN,
    include: { groups: { orderBy: { order: "asc" } } },
  });

  if (jobs.length === 0) return;

  for (const job of jobs) {
    const groupsForStructure = job.groups.filter(
      (group) => group.status === "ANALYZE_COMPLETED" && group.analyzeText
    );
    if (groupsForStructure.length === 0) {
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          structureError: "No analyze results available",
          lastProcessedAt: new Date(),
        },
      });
      continue;
    }

    if (!job.structurePrompt) {
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          structureError: "Missing structure prompt",
          lastProcessedAt: new Date(),
        },
      });
      continue;
    }

    const structureConfig: Record<string, unknown> = {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: job.responseSchema ?? {},
      maxOutputTokens: Number(
        process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "4096"
      ),
    };
    const useThinking =
      (process.env.GEMINI_THINKING || "").toLowerCase() === "true";
    const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? "0");
    if (useThinking) {
      structureConfig.thinkingConfig = {
        thinkingBudget: isNaN(thinkingBudget) ? 0 : thinkingBudget,
      };
    }

    const preparedGroups: GeminiPreparedGroup[] = groupsForStructure.map(
      (group) => toPreparedGroupFromRecord(group)
    );

    const structureRequests: GeminiBatchRequest[] = preparedGroups.map(
      (prepared, index) =>
        buildStructureRequest(
          job.structurePrompt!,
          groupsForStructure[index]?.analyzeText || "",
          prepared,
          structureConfig
        )
    );

    const { total: estimatedTokens, perRequest } = estimateTokensForBatch(
      structureRequests
    );

    const activeTokensAggregate = await prisma.geminiBatchJob.aggregate({
      _sum: { estimatedTokens: true },
      where: {
        status: { in: [...ACTIVE_JOB_STATUSES] },
        estimatedTokens: { not: null },
      },
    });
    const activeTokens = activeTokensAggregate._sum.estimatedTokens ?? 0;
    if (estimatedTokens + activeTokens > MAX_ENQUEUED_TOKENS) {
      summary.errors.push(
        `structure-start: token limit reached for job ${job.id}`
      );
      continue;
    }

    const attempts: Array<{ model: string; label: "primary" | "fallback" }> = [
      { model: process.env.GEMINI_MODEL || "gemini-2.5-pro", label: "primary" },
    ];
    const fallback = process.env.GEMINI_MODEL_FALLBACK || "gemini-1.5-pro";
    if (fallback && fallback !== attempts[0].model) {
      attempts.push({ model: fallback, label: "fallback" });
    }

    let startResult: {
      jobName: string;
      mode: GeminiBatchMode;
      model: string;
      fallbackUsed: boolean;
    } | null = null;

    for (const attempt of attempts) {
      try {
        const started = await startGeminiBatch({
          ai,
          model: attempt.model,
          displayName: `${job.displayName || "gemini-structure"}-structure`,
          requests: structureRequests,
          keys: preparedGroups.map((group) => group.key),
        });
        startResult = {
          jobName: started.jobName,
          mode: started.mode,
          model: attempt.model,
          fallbackUsed: attempt.label === "fallback",
        };
        break;
      } catch (error) {
        console.error(
          `[cron gemini] failed to start structure batch with model ${attempt.model}`,
          error
        );
      }
    }

    if (!startResult) {
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          structureError: "Unable to start structure batch job",
          lastProcessedAt: new Date(),
        },
      });
      continue;
    }

    const now = new Date();
    await prisma.geminiBatchJob.update({
      where: { id: job.id },
      data: {
        status: "STRUCTURE_SUBMITTED",
        structureJobName: startResult.jobName,
        structureMode: startResult.mode,
        structureModel: startResult.model,
        structureSubmittedAt: now,
        structureFallbackUsed: startResult.fallbackUsed,
        estimatedTokens,
        lastProcessedAt: now,
      },
    });

    await Promise.all(
      groupsForStructure.map((group, index) =>
        prisma.geminiBatchGroup.update({
          where: { id: group.id },
          data: {
            structureTokenEstimate: perRequest[index] ?? null,
            status: "STRUCTURE_RUNNING",
          },
        })
      )
    );

    summary.structureStarted += 1;
  }
}

async function processStructureJobs(
  ai: GoogleGenAI,
  summary: {
    analyzeChecked: number;
    analyzeCompleted: number;
    structureStarted: number;
    structureCompleted: number;
    ingested: number;
    errors: string[];
  }
) {
  const jobs = await prisma.geminiBatchJob.findMany({
    where: {
      status: "STRUCTURE_SUBMITTED",
    },
    orderBy: { structureSubmittedAt: "asc" },
    take: MAX_STRUCTURE_JOBS_PER_RUN,
    include: { groups: { orderBy: { order: "asc" } } },
  });

  for (const job of jobs) {
    if (!job.structureJobName || !job.structureMode) {
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          structureError: "Missing structure job reference",
          lastProcessedAt: new Date(),
        },
      });
      continue;
    }

    const state = await ai.batches.get({ name: job.structureJobName });
    if (state.state === "JOB_STATE_SUCCEEDED") {
      await handleStructureSuccess(ai, job.id, state, job.structureMode as GeminiBatchMode);
      summary.structureCompleted += 1;
    } else if (state.state === "JOB_STATE_FAILED" || state.state === "JOB_STATE_CANCELLED") {
      const detail = state.error?.message || state.state;
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          structureError: detail,
          lastProcessedAt: new Date(),
        },
      });
    }
  }
}

async function handleStructureSuccess(
  ai: GoogleGenAI,
  jobId: number,
  jobState: any,
  mode: GeminiBatchMode
) {
  const job = await prisma.geminiBatchJob.findUnique({
    where: { id: jobId },
    include: { groups: { orderBy: { order: "asc" } } },
  });
  if (!job) return;

  const runningGroups = job.groups.filter(
    (group) => group.status === "STRUCTURE_RUNNING"
  );
  const keys = runningGroups.map((group) => group.key);
  if (!keys.length) {
    await prisma.geminiBatchJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        structureError: "No structure groups in running state",
        lastProcessedAt: new Date(),
      },
    });
    return;
  }

  const groupMap = new Map(runningGroups.map((group) => [group.key, group]));
  const responses = await readGeminiBatchResponses({
    ai,
    job: jobState,
    mode,
    keys,
  });

  const now = new Date();
  let successCount = 0;
  const updates: Promise<unknown>[] = [];

  responses.forEach((item, index) => {
    const key = keys[index];
    if (!key) return;
    const group = groupMap.get(key);
    if (!group) return;

    if (item.error) {
      updates.push(
        prisma.geminiBatchGroup.update({
          where: { id: group.id },
          data: {
            structureError: item.error,
            status: "STRUCTURE_FAILED",
            structureCompletedAt: now,
          },
        })
      );
      return;
    }

    if (item.text) {
      let structured: Prisma.InputJsonValue | undefined;
      try {
        structured = JSON.parse(item.text) as Prisma.InputJsonValue;
        successCount += 1;
      } catch (error) {
        updates.push(
          prisma.geminiBatchGroup.update({
            where: { id: group.id },
            data: {
              structureError: `Invalid JSON: ${
                error instanceof Error ? error.message : String(error)
              }`,
              status: "STRUCTURE_FAILED",
              structureCompletedAt: now,
            },
          })
        );
        return;
      }

      updates.push(
        prisma.geminiBatchGroup.update({
          where: { id: group.id },
          data: {
            structureText: item.text,
            structured: structured ?? Prisma.JsonNull,
            status: "STRUCTURE_COMPLETED",
            structureCompletedAt: now,
          },
        })
      );
    }
  });

  await Promise.all(updates);

  await prisma.geminiBatchJob.update({
    where: { id: jobId },
    data: {
      status: successCount > 0 ? "INGEST_PENDING" : "FAILED",
      structureCompletedAt: now,
      lastProcessedAt: now,
      structureError:
        successCount > 0
          ? null
          : job.structureError || "Structure job produced no valid output",
    },
  });
}

async function processIngestion(
  summary: {
    analyzeChecked: number;
    analyzeCompleted: number;
    structureStarted: number;
    structureCompleted: number;
    ingested: number;
    errors: string[];
  }
) {
  const jobs = await prisma.geminiBatchJob.findMany({
    where: {
      status: "INGEST_PENDING",
    },
    orderBy: { structureCompletedAt: "asc" },
    take: MAX_INGEST_PER_RUN,
    include: { groups: { orderBy: { order: "asc" } } },
  });

  for (const job of jobs) {
    const hiddenFlag = Boolean(job.forceHidden || process.env.NODE_ENV === "production");
    const aggregated = {
      elections: [] as any[],
    };

    for (const group of job.groups) {
      if (group.status !== "STRUCTURE_COMPLETED") continue;
      if (!group.structured) continue;
      const value = group.structured as { elections?: any[] };
      if (Array.isArray(value?.elections)) {
        aggregated.elections.push(...value.elections);
      }
    }

    if (aggregated.elections.length === 0) {
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          ingestError: "No structured elections available",
          lastProcessedAt: new Date(),
        },
      });
      continue;
    }

    const start = new Date();
    await prisma.geminiBatchJob.update({
      where: { id: job.id },
      data: {
        status: "INGEST_RUNNING",
        ingestRequestedAt: start,
        lastProcessedAt: start,
      },
    });

    try {
      const results = await ingestStructuredPayload({
        input: aggregated,
        hiddenFlag,
        uploadedBy: job.uploaderEmail,
      });

      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          ingestCompletedAt: new Date(),
          lastProcessedAt: new Date(),
          notes: JSON.stringify({ ingestResults: results }),
          ingestError: null,
        },
      });

      await prisma.geminiBatchGroup.updateMany({
        where: {
          jobId: job.id,
          status: "STRUCTURE_COMPLETED",
        },
        data: {
          status: "INGEST_COMPLETED",
          ingestCompletedAt: new Date(),
        },
      });

      summary.ingested += 1;

      const uploads = new Set<string>([
        job.uploaderEmail,
        TEAM_EMAIL,
      ]);
      const recipients = Array.from(uploads).filter(Boolean);

      if (!job.ingestEmailSentAt) {
        await sendWithResend({
          to: recipients,
          subject: `Gemini ingestion completed for job #${job.id}`,
          html: `<p>Gemini batch job <strong>${job.displayName || job.id}</strong> finished ingestion.</p>` +
            `<p>Created ${results.length} election records.</p>`,
        }).catch((error) => {
          console.error("[cron gemini] failed to send ingest email", error);
        });

        await prisma.geminiBatchJob.update({
          where: { id: job.id },
          data: {
            ingestEmailSentAt: new Date(),
          },
        });
      }
    } catch (error) {
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          ingestError:
            error instanceof Error ? error.message : String(error),
          lastProcessedAt: new Date(),
        },
      });
      summary.errors.push(`ingest:${job.id}`);
    }
  }
}

function toPreparedGroupFromRecord(group: {
  key: string;
  municipality: string | null;
  state: string | null;
  position: string | null;
  rows: unknown;
}): GeminiPreparedGroup {
  const rowsValue = Array.isArray(group.rows)
    ? (group.rows as unknown[])
    : [];
  return {
    key: group.key,
    municipality: group.municipality ?? undefined,
    state: group.state ?? undefined,
    position: group.position ?? undefined,
    rows: rowsValue,
  };
}

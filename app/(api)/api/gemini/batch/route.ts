/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "node:fs";
import path from "node:path";
import prisma from "@/prisma/prisma";
import { Prisma } from "@prisma/client";
import {
  convertSchema,
  estimateTokensForBatch,
  startGeminiBatch,
  type GeminiBatchRequest,
} from "@/lib/gemini-batch";
import {
  buildAnalyzeRequest,
  buildMockOutput,
  limitRows,
  prepareGroups,
  type GeminiIncomingGroup,
} from "@/lib/gemini-batch-prep";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_ROW_LIMIT_PROD = 30;
const DEFAULT_ROW_LIMIT_DEV = 100;
const MAX_CONCURRENT_BATCH_JOBS = 95;
const MAX_ENQUEUED_TOKENS = 5_000_000;

const ACTIVE_JOB_STATUSES = [
  "PENDING_ANALYZE",
  "ANALYZE_SUBMITTED",
  "STRUCTURE_SUBMITTED",
  "STRUCTURE_COMPLETED",
  "INGEST_PENDING",
  "INGEST_RUNNING",
] as const;

export async function POST(req: NextRequest) {
  try {
    const {
      groups,
      promptPathAnalyze,
      promptPathStructure,
      schemaPath,
      displayName,
      uploaderEmail,
      uploaderUserId,
      forceHidden,
    } = (await req.json()) as {
      groups?: GeminiIncomingGroup[];
      promptPathAnalyze?: string;
      promptPathStructure?: string;
      schemaPath?: string;
      displayName?: string;
      uploaderEmail?: string;
      uploaderUserId?: string;
      forceHidden?: boolean;
    };

    if (!Array.isArray(groups) || groups.length === 0) {
      return Response.json({ error: "No groups provided" }, { status: 400 });
    }

    const preparedGroups = prepareGroups(groups);
    const isProd = process.env.NODE_ENV === "production";
    const rowLimit = Number(
      process.env.GEMINI_MAX_ROWS ?? (isProd ? DEFAULT_ROW_LIMIT_PROD : DEFAULT_ROW_LIMIT_DEV)
    );

    const geminiEnabled = process.env.GEMINI_ENABLED
      ? process.env.GEMINI_ENABLED === "true"
      : isProd;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";
    const fallbackModel = process.env.GEMINI_MODEL_FALLBACK || "gemini-1.5-pro";

    if (geminiEnabled && !process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const limitedGroups = preparedGroups.map((group) => ({
      ...group,
      rows: limitRows(group.rows, rowLimit, isProd ? DEFAULT_ROW_LIMIT_PROD : DEFAULT_ROW_LIMIT_DEV),
    }));

    const totalRows = limitedGroups.reduce(
      (acc, group) => acc + (Array.isArray(group.rows) ? group.rows.length : 0),
      0
    );

    const analyzePromptPath = promptPathAnalyze
      ? path.resolve(process.cwd(), promptPathAnalyze)
      : path.resolve(process.cwd(), "election-source/gemini-prompt1.txt");
    const structurePromptPath = promptPathStructure
      ? path.resolve(process.cwd(), promptPathStructure)
      : path.resolve(process.cwd(), "election-source/gemini-prompt2.txt");
    const schemaFilePath = schemaPath
      ? path.resolve(process.cwd(), schemaPath)
      : path.resolve(process.cwd(), "election-source/structured-output.json");

    const [analyzePrompt, structurePrompt, schemaRaw] = await Promise.all([
      fs.readFile(analyzePromptPath, "utf8"),
      fs.readFile(structurePromptPath, "utf8"),
      fs.readFile(schemaFilePath, "utf8"),
    ]);

    const responseSchema = convertSchema(JSON.parse(schemaRaw));

    if (!geminiEnabled) {
      const mockGroups = limitedGroups.map((group, index) =>
        buildMockOutput(group, index)
      );
      const uploader = uploaderEmail || "team@elevracommunity.com";
      const job = await prisma.geminiBatchJob.create({
        data: {
          displayName: displayName || "gemini-analyze",
          uploaderEmail: uploader,
          uploaderUserId: uploaderUserId || null,
          status: "COMPLETED",
          analyzeCompletedAt: new Date(),
          structureCompletedAt: new Date(),
          ingestCompletedAt: new Date(),
          analyzeEmailSentAt: new Date(),
          ingestEmailSentAt: new Date(),
          totalRows,
          groupCount: limitedGroups.length,
          analyzePrompt,
          structurePrompt,
          responseSchema,
          forceHidden: Boolean(forceHidden),
          groups: {
            create: mockGroups.map((group, index) => {
              const parsedStructured = (() => {
                try {
                  return JSON.parse(group.structureText) as Prisma.InputJsonValue;
                } catch {
                  return undefined;
                }
              })();

              return {
                key: group.key,
                order: index,
                municipality: preparedGroups[index]?.municipality ?? null,
                state: preparedGroups[index]?.state ?? null,
                position: preparedGroups[index]?.position ?? null,
                rowCount: Array.isArray(preparedGroups[index]?.rows)
                  ? preparedGroups[index]?.rows?.length ?? 0
                  : 0,
                rows: (limitedGroups[index]?.rows ?? []) as Prisma.InputJsonValue,
                analyzeText: group.analyzeText,
                structureText: group.structureText,
                structured: parsedStructured ?? Prisma.JsonNull,
                status: "INGEST_COMPLETED",
                analyzeCompletedAt: new Date(),
                structureCompletedAt: new Date(),
                ingestCompletedAt: new Date(),
              };
            }),
          },
        },
      });

      return Response.json({
        mock: true,
        jobId: job.id,
        status: job.status,
        groupCount: job.groupCount,
        schema: responseSchema,
        forceHidden: Boolean(forceHidden),
        displayName: job.displayName,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const analyzeConfig: Record<string, unknown> = {
      temperature: 0,
      maxOutputTokens: Number(
        process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "4096"
      ),
    };
    const useThinking =
      (process.env.GEMINI_THINKING || "").toLowerCase() === "true";
    const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? "0");
    if (useThinking) {
      analyzeConfig.thinkingConfig = {
        thinkingBudget: isNaN(thinkingBudget) ? 0 : thinkingBudget,
      };
    }

    const analyzeRequests: GeminiBatchRequest[] = limitedGroups.map((group) =>
      buildAnalyzeRequest(analyzePrompt, group, analyzeConfig)
    );

    const { total: estimatedTokens, perRequest } = estimateTokensForBatch(
      analyzeRequests
    );

    const activeJobs = await prisma.geminiBatchJob.count({
      where: { status: { in: [...ACTIVE_JOB_STATUSES] } },
    });
    if (activeJobs >= MAX_CONCURRENT_BATCH_JOBS) {
      return NextResponse.json(
        {
          error: "Too many Gemini batch jobs running. Please wait and retry.",
        },
        { status: 429 }
      );
    }

    const activeTokensAggregate = await prisma.geminiBatchJob.aggregate({
      _sum: { estimatedTokens: true },
      where: {
        status: { in: [...ACTIVE_JOB_STATUSES] },
        estimatedTokens: { not: null },
      },
    });
    const activeTokens = activeTokensAggregate._sum.estimatedTokens ?? 0;
    if (estimatedTokens + activeTokens > MAX_ENQUEUED_TOKENS) {
      return NextResponse.json(
        {
          error:
            "Gemini batch token limit reached. Please wait for other jobs to finish.",
        },
        { status: 429 }
      );
    }

    const uploader = uploaderEmail || "team@elevracommunity.com";
    const job = await prisma.geminiBatchJob.create({
      data: {
        displayName: displayName || "gemini-analyze",
        uploaderEmail: uploader,
        uploaderUserId: uploaderUserId || null,
        status: "PENDING_ANALYZE",
        estimatedTokens,
        totalRows,
        groupCount: limitedGroups.length,
        analyzePrompt,
        structurePrompt,
        responseSchema,
        forceHidden: Boolean(forceHidden),
        groups: {
          create: limitedGroups.map((group, index) => ({
            key: group.key,
            order: index,
            municipality: group.municipality ?? null,
            state: group.state ?? null,
            position: group.position ?? null,
            rowCount: Array.isArray(group.rows) ? group.rows.length : 0,
            rows: group.rows as Prisma.InputJsonValue,
            analyzeTokenEstimate: perRequest[index] ?? null,
            status: "PENDING_ANALYZE",
          })),
        },
      },
    });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const attempts: Array<{ model: string; label: "primary" | "fallback" }> = [
      { model, label: "primary" },
    ];
    if (fallbackModel && fallbackModel !== model) {
      attempts.push({ model: fallbackModel, label: "fallback" });
    }

    let startResult: {
      start: { jobName: string; mode: string };
      modelUsed: string;
      fallbackUsed: boolean;
    } | null = null;

    for (const attempt of attempts) {
      try {
        const started = await startGeminiBatch({
          ai,
          model: attempt.model,
          displayName: job.displayName ?? "gemini-analyze",
          requests: analyzeRequests,
          keys: limitedGroups.map((group) => group.key),
        });
        startResult = {
          start: started,
          modelUsed: attempt.model,
          fallbackUsed: attempt.label === "fallback",
        };
        break;
      } catch (error) {
        console.error(
          `[gemini-batch] failed to start batch with model ${attempt.model}`,
          error
        );
      }
    }

    if (!startResult) {
      await prisma.geminiBatchJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          analyzeError:
            "Unable to start Gemini batch job. Please retry or use non-batch mode.",
          lastProcessedAt: new Date(),
        },
      });
      return NextResponse.json(
        {
          error: "Failed to start Gemini batch job. Check server logs for details.",
        },
        { status: 500 }
      );
    }

    const now = new Date();
    const updated = await prisma.geminiBatchJob.update({
      where: { id: job.id },
      data: {
        status: "ANALYZE_SUBMITTED",
        analyzeJobName: startResult.start.jobName,
        analyzeMode: startResult.start.mode,
        analyzeSubmittedAt: now,
        analyzeModel: startResult.modelUsed,
        analyzeFallbackUsed: startResult.fallbackUsed,
        lastProcessedAt: now,
        responseSchema,
      },
    });

    return NextResponse.json({
      mock: false,
      jobId: updated.id,
      status: updated.status,
      analyzeJobName: updated.analyzeJobName,
      analyzeMode: updated.analyzeMode,
      analyzeModel: updated.analyzeModel,
      analyzeFallbackUsed: updated.analyzeFallbackUsed,
      pollIntervalMs: Number(process.env.GEMINI_BATCH_POLL_INTERVAL_MS ?? "30000"),
      tokenEstimate: estimatedTokens,
      groupCount: updated.groupCount,
      schema: responseSchema,
      forceHidden: Boolean(forceHidden),
      displayName: updated.displayName,
    });
  } catch (error: any) {
    console.error("/api/gemini/batch error", error);
    const message =
      typeof error === "string"
        ? error
        : error?.message || error?.toString() || "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}

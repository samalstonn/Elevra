/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  GeminiJob,
  UploadElectionBatch,
  SpreadsheetUpload,
} from "@prisma/client";
import {
  GeminiJobType,
  GeminiJobAttemptStatus,
  UploadBatchStatus,
} from "@prisma/client";
import type { Row } from "@/election-source/build-spreadsheet";
import type { GenerateContentResponse } from "@google/genai";
import { getGeminiClient, getGeminiRuntimeConfig } from "./client";
import {
  getAnalyzePrompt,
  getStructurePrompt,
  getStructureResponseSchema,
} from "./prompts";
import { seedStructuredData } from "@/lib/admin/seedStructured";
import { buildWorkbookForUpload } from "./workbook";
import { sendWithResend } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

export type GeminiJobWithRelations = GeminiJob & {
  batch: UploadElectionBatch | null;
  upload: SpreadsheetUpload | null;
};

export type AnalyzeJobResult = {
  text: string;
  requestTokens?: number;
  responseTokens?: number;
  totalTokens?: number;
  statusCode?: number;
};

export type StructureJobResult = AnalyzeJobResult;

export type InsertJobResult = {
  resultSummary: Record<string, unknown> | null;
};

export async function executeAnalyzeJob(
  job: GeminiJobWithRelations,
  model: string
): Promise<AnalyzeJobResult> {
  const runtime = getGeminiRuntimeConfig();
  const rows = coerceRows(job.batch?.rawRows);
  const limitedRows = limitRows(rows, runtime.enabled);

  if (!runtime.enabled) {
    const mock = buildMockOutputs(limitedRows);
    return {
      text: mock.analyzeText,
      requestTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      statusCode: 200,
    };
  }

  const prompt = await getAnalyzePrompt();
  const ai = getGeminiClient();
  const config: Record<string, unknown> = {
    temperature: 0,
    maxOutputTokens: runtime.maxOutputTokens,
  };
  if (runtime.useThinking) {
    config.thinkingConfig = {
      thinkingBudget: runtime.thinkingBudget,
    };
  }
  if (runtime.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `${prompt}\n\nElection details input (JSON rows):\n${JSON.stringify(
            limitedRows,
            null,
            2
          )}\n`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config,
  } as any);

  const text = response.text ?? extractTextFromResponse(response) ?? "";
  if (!text.trim()) {
    throw new Error("Analyze job returned empty output");
  }
  const usage = response.usageMetadata;
  return {
    text,
    requestTokens: usage?.promptTokenCount,
    responseTokens: usage?.candidatesTokenCount,
    totalTokens: usage?.totalTokenCount,
    statusCode: undefined,
  };
}

export async function executeStructureJob(
  job: GeminiJobWithRelations,
  model: string
): Promise<StructureJobResult> {
  const runtime = getGeminiRuntimeConfig();
  const rows = coerceRows(job.batch?.rawRows);
  const limitedRows = limitRows(rows, runtime.enabled);

  const analysisData = job.batch?.analysisJson;
  if (!analysisData) {
    throw new Error("Structure job missing analysis output");
  }

  const analysisText =
    typeof analysisData === "string"
      ? analysisData
      : JSON.stringify(analysisData, null, 2);

  if (!runtime.enabled) {
    const mock = buildMockOutputs(limitedRows);
    return {
      text: mock.structuredText,
      requestTokens: 0,
      responseTokens: 0,
      totalTokens: 0,
      statusCode: 200,
    };
  }

  const prompt = await getStructurePrompt();
  const responseSchema = await getStructureResponseSchema();
  const ai = getGeminiClient();
  const config: Record<string, unknown> = {
    temperature: 0,
    responseMimeType: "application/json",
    responseSchema,
    maxOutputTokens: runtime.maxOutputTokens,
  };
  if (runtime.useThinking) {
    config.thinkingConfig = {
      thinkingBudget: runtime.thinkingBudget,
    };
  }

  const contents = [
    {
      role: "user",
      parts: [
        { text: prompt },
        {
          text: `\n\nAttached data (from previous step):\n${analysisText}`,
        },
        {
          text: `\n\nOriginal spreadsheet rows:\n${JSON.stringify(
            limitedRows,
            null,
            2
          )}`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config,
  } as any);

  const text = response.text ?? extractTextFromResponse(response) ?? "";
  if (!text.trim()) {
    throw new Error("Structure job returned empty output");
  }
  const usage = response.usageMetadata;
  return {
    text,
    requestTokens: usage?.promptTokenCount,
    responseTokens: usage?.candidatesTokenCount,
    totalTokens: usage?.totalTokenCount,
    statusCode: undefined,
  };
}

export async function executeInsertJob(
  job: GeminiJobWithRelations
): Promise<InsertJobResult> {
  const structuredData = job.batch?.structuredJson;
  if (!structuredData) {
    throw new Error("Insert job missing structured JSON payload");
  }

  const payload =
    typeof structuredData === "string"
      ? JSON.parse(structuredData)
      : structuredData;

  const uploaderEmail = job.upload?.uploaderEmail || "unknown@elevra";
  const forceHidden = job.upload?.forceHidden ?? true;

  const seedResult = await seedStructuredData({
    data: payload as any,
    uploadedBy: uploaderEmail,
    forceHidden,
  });

  return {
    resultSummary: {
      hidden: seedResult.hidden,
      inserted: seedResult.results.length,
      results: seedResult.results,
    },
  };
}

export type WorkbookJobResult = {
  workbookBase64: string;
  filename: string;
  summary: Record<string, unknown> | null;
};

export async function executeWorkbookJob(
  job: GeminiJobWithRelations
): Promise<WorkbookJobResult> {
  if (!job.uploadId) {
    throw new Error("Workbook job missing upload context");
  }
  const build = await buildWorkbookForUpload(job.uploadId);
  return {
    workbookBase64: build.buffer.toString("base64"),
    filename: build.filename,
    summary: build.summary,
  };
}

export type NotificationJobResult = {
  messageId: string;
  recipients: string[];
};

export async function executeNotificationJob(
  job: GeminiJobWithRelations
): Promise<NotificationJobResult> {
  if (!job.uploadId) {
    throw new Error("Notification job missing upload context");
  }
  const upload = await prisma.spreadsheetUpload.findUnique({
    where: { id: job.uploadId },
    include: { batches: true },
  });
  if (!upload) {
    throw new Error(`Upload ${job.uploadId} not found for notification`);
  }

  const workbookJob = await prisma.geminiJob.findFirst({
    where: {
      uploadId: job.uploadId,
      type: GeminiJobType.WORKBOOK,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!workbookJob) {
    throw new Error("No workbook job found for notification");
  }
  const workbookAttempt = await prisma.geminiJobAttempt.findFirst({
    where: {
      jobId: workbookJob.id,
      status: GeminiJobAttemptStatus.SUCCEEDED,
    },
    orderBy: { completedAt: "desc" },
  });
  if (!workbookAttempt || !workbookAttempt.responseBody) {
    throw new Error("Workbook data unavailable for notification");
  }

  const payload = workbookAttempt.responseBody as
    | {
        workbookBase64?: string;
        filename?: string;
      }
    | null;
  if (!payload?.workbookBase64) {
    throw new Error("Workbook attachment missing in attempt payload");
  }

  const filename = payload.filename || `elevra-upload-${job.uploadId}.xlsx`;
  const summary = toSummaryObject(upload.summaryJson);
  const totals = (summary?.totals as { total?: number; byStatus?: Record<string, number> }) || {};
  const totalBatches = totals.total ?? upload.batches.length;
  const completedBatches = totals.byStatus?.COMPLETED ?? totalBatches;
  const attentionBatches = upload.batches.filter((batch) =>
    batch.status === UploadBatchStatus.NEEDS_REUPLOAD ||
    batch.status === UploadBatchStatus.FAILED
  );

  const recipients = Array.from(
    new Set(
      [upload.uploaderEmail, process.env.ADMIN_EMAIL, "team@elevracommunity.com"]
        .filter((value): value is string => Boolean(value))
    )
  );

  const html = buildFinalEmailHtml({
    upload,
    summary,
    totalBatches,
    completedBatches,
    attentionBatches,
  });

  const sendResult = await sendWithResend({
    to: recipients,
    subject: `Elevra upload ${job.uploadId} completed`,
    html,
    attachments: [
      {
        filename,
        content: payload.workbookBase64,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  });

  return {
    messageId: sendResult?.id ?? "",
    recipients,
  };
}

function coerceRows(value: unknown): Row[] {
  if (Array.isArray(value)) {
    return value as Row[];
  }
  return [];
}

function limitRows(rows: Row[], geminiEnabled: boolean): Row[] {
  const isProd = process.env.NODE_ENV === "production";
  const defaultLimit = geminiEnabled && isProd ? 30 : 100;
  const envLimit = Number(process.env.GEMINI_MAX_ROWS ?? defaultLimit);
  const limit = Number.isFinite(envLimit) && envLimit > 0 ? envLimit : defaultLimit;
  return rows.slice(0, limit);
}

function extractTextFromResponse(response: GenerateContentResponse): string | undefined {
  if (typeof response.text === "string" && response.text.trim().length > 0) {
    return response.text;
  }
  const firstCandidate = response.candidates?.[0];
  const parts = firstCandidate?.content?.parts;
  if (!Array.isArray(parts)) return undefined;
  const textParts = parts
    .map((part) => (typeof part === "object" && part ? (part as { text?: string }).text : undefined))
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  if (textParts.length) {
    return textParts.join("");
  }
  return undefined;
}

function toSummaryObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function buildFinalEmailHtml({
  upload,
  summary,
  totalBatches,
  completedBatches,
  attentionBatches,
}: {
  upload: SpreadsheetUpload;
  summary: Record<string, unknown> | null;
  totalBatches: number;
  completedBatches: number;
  attentionBatches: UploadElectionBatch[];
}) {
  const insertResults = Array.isArray(summary?.insertResults)
    ? (summary?.insertResults as Array<{ candidateSlugs?: string[] }>)
    : [];
  const insertedCount = insertResults.reduce((sum, item) => sum + (item.candidateSlugs?.length ?? 0), 0);
  const hidden = summary?.hidden ?? upload.forceHidden;
  const attentionLines = attentionBatches.map((batch) => {
    const parts = [batch.position, batch.municipality, batch.state].filter(Boolean);
    const label = parts.length ? parts.join(" – ") : batch.id;
    const statusLabel =
      batch.status === UploadBatchStatus.NEEDS_REUPLOAD
        ? "Needs reupload"
        : batch.status === UploadBatchStatus.FAILED
        ? "Failed"
        : batch.status;
    return `${label} (${statusLabel})`;
  });
  const attentionSection = attentionLines.length
    ? `<p><strong>Batches needing reupload or manual attention:</strong></p>${renderHtmlList(
        attentionLines
      )}<p>These batches were not inserted and need to be retried once the source data is fixed.</p>`
    : "";

  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;">
    <h2>Spreadsheet upload completed</h2>
    <p>
      Upload <strong>${upload.id}</strong> has finished processing.
    </p>
    <ul>
      <li>Total batches: ${totalBatches}</li>
      <li>Completed batches: ${completedBatches}</li>
      <li>Batches needing reupload: ${attentionBatches.length}</li>
      <li>Candidates inserted: ${insertedCount}</li>
      <li>Hidden by default: ${hidden ? "Yes" : "No"}</li>
    </ul>
    ${attentionSection}
    <p>The generated workbook is attached for your records.</p>
  </body>
</html>`;
}

function buildMockOutputs(rows: Row[]) {
  const first = rows[0] || ({} as Row);
  const city = first.municipality || "Sample City";
  const state = first.state || "Sample State";
  const year = String(first.year || "2025");
  const candidateName = `${first.firstName || "Jane"} ${first.lastName || "Doe"}`.trim();

  const analyzeText = JSON.stringify(
    [
      {
        election: {
          title: "Mock Election",
          type: "LOCAL",
          date: `11/05/${year.slice(-4)}`,
          city,
          state,
          number_of_seats: "N/A",
          description: "Mock analysis generated locally.",
        },
        candidates: [
          {
            name: candidateName,
            currentRole: first.position || "Candidate",
            party: "N/A",
            image_url: "N/A",
            linkedin_url: "N/A",
            campaign_website_url: "N/A",
            bio: "Mock candidate generated locally.",
            key_policies: ["Community engagement", "Transparency"],
            home_city: city,
            hometown_state: state,
            additional_notes: "N/A",
            sources: ["Local import test"],
          },
        ],
      },
    ],
    null,
    2
  );

  const structuredText = JSON.stringify(
    {
      elections: [
        {
          election: {
            title: "Mock Election (Structured)",
            type: "LOCAL",
            date: `11/05/${year.slice(-4)}`,
            city,
            state,
            number_of_seats: "N/A",
            description: "Structured mock output (Gemini disabled).",
          },
          candidates: [
            {
              name: candidateName,
              currentRole: first.position || "Candidate",
              party: "",
              image_url: "",
              linkedin_url: "",
              campaign_website_url: "",
              bio: "Mock candidate for local testing.",
              key_policies: ["Transparency", "Community"],
              home_city: city,
              hometown_state: state,
              additional_notes: "",
              sources: ["Local mock"],
            },
          ],
        },
      ],
    },
    null,
    2
  );

  return { analyzeText, structuredText };
}

function renderHtmlList(items: string[]): string {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return "";
  const inner = filtered
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return `<ul>${inner}</ul>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

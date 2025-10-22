/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  convertSchema,
  executeGeminiBatch,
  type GeminiBatchRequest,
} from "@/lib/gemini-batch";
import {
  getAnalyzePrompt,
  getStructurePrompt,
  getStructureResponseSchema,
} from "@/lib/gemini/prompts";
import { reportGeminiError } from "@/lib/gemini/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 800;

const DEFAULT_POLL_INTERVAL = 15_000;
const DEFAULT_POLL_TIMEOUT = 600_000; // 10 minutes for Vercel limits

type IncomingGroup = {
  key?: string;
  municipality?: string;
  state?: string;
  position?: string;
  rows: unknown[];
};

type PreparedGroup = IncomingGroup & { key: string; rows: unknown[] };

type GroupResult = {
  key: string;
  index: number;
  analyzeText?: string;
  structureText?: string;
  analyzeError?: string;
  structureError?: string;
};

export async function POST(req: NextRequest) {
  try {
    const {
      groups,
      promptPathAnalyze,
      promptPathStructure,
      schemaPath,
      displayName,
      pollIntervalMs,
      maxWaitMs,
    } = (await req.json()) as {
      groups?: IncomingGroup[];
      promptPathAnalyze?: string;
      promptPathStructure?: string;
      schemaPath?: string;
      displayName?: string;
      pollIntervalMs?: number;
      maxWaitMs?: number;
    };

    if (!Array.isArray(groups) || groups.length === 0) {
      return Response.json({ error: "No groups provided" }, { status: 400 });
    }

    const preparedGroups: PreparedGroup[] = groups.map((group, idx) => ({
      ...group,
      key:
        typeof group.key === "string" && group.key.trim().length > 0
          ? group.key.trim()
          : `group-${idx}`,
      rows: Array.isArray(group.rows) ? group.rows : [],
    }));

    const isProd = process.env.NODE_ENV === "production";
    const geminiEnabled = process.env.GEMINI_ENABLED
      ? process.env.GEMINI_ENABLED === "true"
      : isProd;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";
    const fallbackModel = process.env.GEMINI_MODEL_FALLBACK || "gemini-1.5-pro";
    const maxOutputTokens = Number(
      process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "4096"
    );
    const rowLimit = Number(
      process.env.GEMINI_MAX_ROWS ?? (isProd ? "30" : "100")
    );

    const pollInterval = Number.isFinite(pollIntervalMs)
      ? Math.max(5_000, Number(pollIntervalMs))
      : DEFAULT_POLL_INTERVAL;
    const pollTimeout = Number.isFinite(maxWaitMs)
      ? Math.max(60_000, Number(maxWaitMs))
      : DEFAULT_POLL_TIMEOUT;

    if (geminiEnabled && !process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const limitedGroups = preparedGroups.map((group) => ({
      ...group,
      rows: limitRows(group.rows, rowLimit, isProd ? 30 : 100),
    }));

    const [analyzePrompt, structurePrompt, responseSchema] =
      await Promise.all([
        promptPathAnalyze
          ? fs.readFile(path.resolve(process.cwd(), promptPathAnalyze), "utf8")
          : getAnalyzePrompt(),
        promptPathStructure
          ? fs.readFile(path.resolve(process.cwd(), promptPathStructure), "utf8")
          : getStructurePrompt(),
        (async () => {
          if (schemaPath) {
            const raw = await fs.readFile(
              path.resolve(process.cwd(), schemaPath),
              "utf8"
            );
            return convertSchema(JSON.parse(raw));
          }
          return await getStructureResponseSchema();
        })(),
      ]);

    if (!geminiEnabled) {
      const mockGroups = limitedGroups.map((group, index) =>
        buildMockOutput(group, index)
      );
      return Response.json({ mock: true, model, groups: mockGroups });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const useThinking =
      (process.env.GEMINI_THINKING || "").toLowerCase() === "true";
    const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? "0");

    const analyzeConfig: Record<string, unknown> = {
      temperature: 0,
      maxOutputTokens: isNaN(maxOutputTokens) ? 4096 : maxOutputTokens,
    };
    if (useThinking) {
      analyzeConfig.thinkingConfig = {
        thinkingBudget: isNaN(thinkingBudget) ? 0 : thinkingBudget,
      };
    }

    const analyzeRequests = limitedGroups.map((group) =>
      buildAnalyzeRequest(analyzePrompt, group, analyzeConfig)
    );

    const analyzeBatch = await executeGeminiBatch({
      ai,
      model,
      fallbackModel,
      displayName: displayName || "gemini-analyze",
      requests: analyzeRequests,
      keys: limitedGroups.map((group) => group.key),
      pollInterval,
      pollTimeout,
    });

    const perGroup: GroupResult[] = limitedGroups.map((group, index) => ({
      key: group.key,
      index,
    }));

    analyzeBatch.responses.forEach((item, idx) => {
      if (!perGroup[idx]) return;
      if (item.error) perGroup[idx].analyzeError = item.error;
      if (item.text) perGroup[idx].analyzeText = item.text;
    });

    const groupsForStructure = limitedGroups.filter((_, idx) => {
      const result = perGroup[idx];
      return result && result.analyzeText && !result.analyzeError;
    });

    let structureBatch: Awaited<ReturnType<typeof executeGeminiBatch>> | null =
      null;

    if (groupsForStructure.length > 0) {
      const structureConfig: Record<string, unknown> = {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema,
        maxOutputTokens: isNaN(maxOutputTokens) ? 4096 : maxOutputTokens,
      };
      if (useThinking) {
        structureConfig.thinkingConfig = {
          thinkingBudget: isNaN(thinkingBudget) ? 0 : thinkingBudget,
        };
      }

      const structureRequests = groupsForStructure.map((group) => {
        const idx = limitedGroups.findIndex((g) => g.key === group.key);
        const analysisText = idx >= 0 ? perGroup[idx]?.analyzeText ?? "" : "";
        return buildStructureRequest(
          structurePrompt,
          analysisText,
          group,
          structureConfig
        );
      });

      structureBatch = await executeGeminiBatch({
        ai,
        model,
        fallbackModel,
        displayName: displayName || "gemini-structure",
        requests: structureRequests,
        keys: groupsForStructure.map((group) => group.key),
        pollInterval,
        pollTimeout,
      });

      structureBatch.responses.forEach((item, idx) => {
        const key = groupsForStructure[idx]?.key;
        if (!key) return;
        const targetIndex = limitedGroups.findIndex((group) => group.key === key);
        if (targetIndex < 0 || !perGroup[targetIndex]) return;
        if (item.error) perGroup[targetIndex].structureError = item.error;
        if (item.text) perGroup[targetIndex].structureText = item.text;
      });
    }

    return Response.json({
      mock: false,
      analyze: {
        jobName: analyzeBatch.jobName,
        modelUsed: analyzeBatch.modelUsed,
        fallbackUsed: analyzeBatch.fallbackUsed,
      },
      structure: structureBatch
        ? {
            jobName: structureBatch.jobName,
            modelUsed: structureBatch.modelUsed,
            fallbackUsed: structureBatch.fallbackUsed,
          }
        : null,
      groups: perGroup,
    });
  } catch (error: any) {
    console.error("/api/gemini/batch error", error);
    reportGeminiError(error, {
      message: "/api/gemini/batch error",
      tags: { component: "api-route", route: "batch" },
      extra: {
        requestId: req.headers.get("x-request-id") ?? undefined,
      },
      fingerprint: ["gemini", "api", "batch"],
    });
    const message =
      typeof error === "string"
        ? error
        : error?.message || error?.toString() || "Internal Server Error";
    return Response.json({ error: message }, { status: 500 });
  }
}

function limitRows(rows: unknown[], limitConfig: number, fallback: number) {
  if (!Array.isArray(rows)) return [];
  const limit = Number.isFinite(limitConfig) ? Number(limitConfig) : fallback;
  return rows.slice(0, limit > 0 ? limit : fallback);
}

function buildAnalyzeRequest(
  prompt: string,
  group: PreparedGroup,
  config: Record<string, unknown>
): GeminiBatchRequest {
  const rowsBlock = `\n\nElection details input (JSON rows):\n${JSON.stringify(
    group.rows,
    null,
    2
  )}\n`;
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${prompt}${rowsBlock}`,
          },
        ],
      },
    ],
    config: { ...config },
  };
}

function buildStructureRequest(
  prompt: string,
  previousOutput: string,
  group: PreparedGroup,
  config: Record<string, unknown>
): GeminiBatchRequest {
  const parts: Array<{ text: string }> = [
    { text: prompt },
    {
      text: `\n\nAttached data (from previous step):\n${previousOutput}`,
    },
  ];
  if (Array.isArray(group.rows)) {
    parts.push({
      text:
        "\n\nOriginal spreadsheet rows (may include email to preserve):\n" +
        JSON.stringify(group.rows, null, 2),
    });
  }
  return {
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    config: { ...config },
  };
}

function buildMockOutput(group: PreparedGroup, index: number): GroupResult {
  const rows = Array.isArray(group.rows) && group.rows.length
    ? group.rows
    : [{}];
  const first = rows[0] as Record<string, any>;
  const city = first?.municipality || group.municipality || "Sample City";
  const state = first?.state || group.state || "Sample State";
  const year = first?.year || "2025";
  const candidateName = `${first?.firstName || "Jane"} ${
    first?.lastName || "Doe"
  }`.trim();

  const analyzeText = JSON.stringify(
    [
      {
        election: {
          title: "Mock Election",
          type: "LOCAL",
          date: `11/05/${String(year).slice(-4)}`,
          city,
          state,
          number_of_seats: "N/A",
          description: "Mock analysis (Gemini disabled).",
        },
        candidates: [
          {
            name: candidateName,
            currentRole: first?.position || "Candidate",
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

  const structureText = JSON.stringify(
    {
      elections: [
        {
          election: {
            title: "Mock Election (Structured)",
            type: "LOCAL",
            date: `11/05/${String(year).slice(-4)}`,
            city,
            state,
            number_of_seats: "N/A",
            description: "Structured mock output (Gemini disabled).",
          },
          candidates: [
            {
              name: candidateName,
              currentRole: first?.position || "Candidate",
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

  return {
    key: group.key,
    index,
    analyzeText,
    structureText,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI, Type } from "@google/genai";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export type GeminiBatchRequest = {
  contents: Array<{ role: "user"; parts: Array<{ text: string }> }>;
  config: Record<string, unknown>;
};

export type GeminiBatchResult = {
  jobName: string;
  modelUsed: string;
  fallbackUsed: boolean;
  responses: Array<{ text?: string; error?: string }>;
};

type BatchMode = "inline" | "file";

const INLINE_SIZE_LIMIT = 18 * 1024 * 1024; // under 20MB limit

export async function executeGeminiBatch({
  ai,
  model,
  fallbackModel,
  displayName,
  requests,
  keys,
  pollInterval,
  pollTimeout,
}: {
  ai: GoogleGenAI;
  model: string;
  fallbackModel?: string;
  displayName: string;
  requests: GeminiBatchRequest[];
  keys: string[];
  pollInterval: number;
  pollTimeout: number;
}): Promise<GeminiBatchResult> {
  const attempts: Array<{ model: string; label: "primary" | "fallback" }> = [
    { model, label: "primary" },
  ];
  if (fallbackModel && fallbackModel !== model) {
    attempts.push({ model: fallbackModel, label: "fallback" });
  }

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const batch = await createBatchJob({
        ai,
        model: attempt.model,
        displayName,
        requests,
        keys,
        pollInterval,
        pollTimeout,
      });
      return {
        ...batch,
        modelUsed: attempt.model,
        fallbackUsed: attempt.label === "fallback",
      };
    } catch (error) {
      console.warn(
        `[gemini-batch] ${attempt.label} model ${attempt.model} failed`,
        error
      );
      lastError = error;
    }
  }

  throw lastError ?? new Error("Gemini batch job failed");
}

async function createBatchJob({
  ai,
  model,
  displayName,
  requests,
  keys,
  pollInterval,
  pollTimeout,
}: {
  ai: GoogleGenAI;
  model: string;
  displayName: string;
  requests: GeminiBatchRequest[];
  keys: string[];
  pollInterval: number;
  pollTimeout: number;
}) {
  const inlinePayload = requests.map((request) => ({
    contents: request.contents,
    config: request.config ?? {},
  }));

  const inlineSize = Buffer.byteLength(JSON.stringify(inlinePayload), "utf8");
  let mode: BatchMode = "inline";
  let job;
  const keyMap = new Map<string, number>();

  if (inlineSize <= INLINE_SIZE_LIMIT) {
    job = await ai.batches.create({
      model,
      src: inlinePayload,
      config: { displayName },
    });
    keys.forEach((key, index) => keyMap.set(key, index));
  } else {
    mode = "file";
    const payload = inlinePayload.map((request, index) => ({
      key: keys[index] ?? `group-${index}`,
      index,
      request,
    }));
    const tmpPath = path.join(
      os.tmpdir(),
      `gemini-batch-${Date.now()}-${Math.round(Math.random() * 1e6)}.jsonl`
    );
    await fs.writeFile(
      tmpPath,
      payload.map((item) => JSON.stringify(item)).join("\n"),
      "utf8"
    );
    const uploaded = await ai.files.upload({
      file: tmpPath,
      config: { mimeType: "jsonl" },
    });
    await fs.unlink(tmpPath).catch(() => undefined);
    keys.forEach((key, index) => keyMap.set(key, index));
    job = await ai.batches.create({
      model,
      src: uploaded.name as string,
      config: { displayName },
    });
  }

  const completed = await waitForCompletion({
    ai,
    jobName: job.name || "",
    pollInterval,
    pollTimeout,
  });

  const responses = await parseBatchResponses({
    ai,
    job: completed,
    mode,
    keys,
    keyMap,
  });

  return {
    jobName: completed.name ?? "",
    responses,
  };
}

async function waitForCompletion({
  ai,
  jobName,
  pollInterval,
  pollTimeout,
}: {
  ai: GoogleGenAI;
  jobName: string;
  pollInterval: number;
  pollTimeout: number;
}) {
  if (!jobName) throw new Error("Gemini batch job missing name");

  const start = Date.now();
  while (Date.now() - start < pollTimeout) {
    const job = await ai.batches.get({ name: jobName });
    if (job.state === "JOB_STATE_SUCCEEDED") return job;
    if (job.state === "JOB_STATE_FAILED" || job.state === "JOB_STATE_CANCELLED") {
      const detail =
        job.error?.message ||
        (Array.isArray(job.error?.details) && job.error.details.length
          ? job.error.details.join("; ")
          : job.state);
      throw new Error(detail || "Gemini batch job failed");
    }
    await delay(pollInterval);
  }
  throw new Error("Gemini batch job timed out");
}

async function parseBatchResponses({
  ai,
  job,
  mode,
  keys,
  keyMap,
}: {
  ai: GoogleGenAI;
  job: any;
  mode: BatchMode;
  keys: string[];
  keyMap: Map<string, number>;
}): Promise<Array<{ text?: string; error?: string }>> {
  const results = keys.map(() => ({} as { text?: string; error?: string }));

  if (job.dest?.inlinedResponses) {
    job.dest.inlinedResponses.forEach((item: any, index: number) => {
      const text = extractText(item?.response);
      const error = extractError(item?.error);
      const key = keys[index] ?? `group-${index}`;
      const target = keyMap.get(key) ?? index;
      if (text) results[target].text = text;
      if (error) results[target].error = error;
    });
    return results;
  }

  if (mode === "inline") return results;

  const fileName = job.dest?.fileName;
  if (!fileName) return results;

  const tmpPath = path.join(
    os.tmpdir(),
    `gemini-batch-result-${Date.now()}-${Math.round(Math.random() * 1e6)}.jsonl`
  );
  await ai.files.download({ file: fileName, downloadPath: tmpPath });
  const fileContent = await fs.readFile(tmpPath, "utf8");
  await fs.unlink(tmpPath).catch(() => undefined);
  const lines = fileContent.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      const key = parsed.key as string | undefined;
      const target =
        (key ? keyMap.get(key) : undefined) ??
        (typeof parsed.index === "number" ? parsed.index : undefined);
      if (target === undefined || target < 0 || target >= results.length) continue;
      if (parsed.error) {
        results[target].error = extractError(parsed.error);
      } else if (parsed.response) {
        results[target].text = extractText(parsed.response);
      }
    } catch (error) {
      console.warn("Failed to parse Gemini batch line", error);
    }
  }
  return results;
}

export function extractText(response: any): string | undefined {
  if (!response) return undefined;
  if (typeof response.text === "string") return response.text;
  const candidates = response.candidates;
  if (Array.isArray(candidates) && candidates.length > 0) {
    const first = candidates[0];
    const parts = first?.content?.parts || first?.parts;
    if (Array.isArray(parts)) {
      const textParts = parts
        .map((part: any) => part?.text)
        .filter((part: unknown): part is string => typeof part === "string");
      if (textParts.length) return textParts.join("");
    }
  }
  return undefined;
}

export function extractError(error: any): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (error.message) return String(error.message);
  if (Array.isArray(error.details) && error.details.length) {
    return error.details.map((detail: unknown) => String(detail)).join("; ");
  }
  return typeof error === "object" ? JSON.stringify(error) : String(error);
}

export function convertSchema(node: any): any {
  if (!node || typeof node !== "object") return {};
  const output: Record<string, unknown> = {};
  const type = mapType(node.type);
  if (type !== undefined) output.type = type;
  if (Array.isArray(node.enum)) output.enum = node.enum.map(String);
  if (Array.isArray(node.required)) output.required = node.required;
  if (node.properties && typeof node.properties === "object") {
    output.properties = {} as Record<string, unknown>;
    for (const [key, value] of Object.entries(node.properties)) {
      (output.properties as Record<string, unknown>)[key] = convertSchema(value);
    }
  }
  if (node.items) output.items = convertSchema(node.items);
  return output;
}

function mapType(type?: string) {
  if (!type) return undefined;
  switch (type.toLowerCase()) {
    case "object":
      return Type.OBJECT;
    case "array":
      return Type.ARRAY;
    case "string":
      return Type.STRING;
    case "number":
      return Type.NUMBER;
    case "integer":
      return Type.INTEGER;
    case "boolean":
      return Type.BOOLEAN;
    case "null":
      return Type.NULL;
    default:
      return undefined;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { convertSchema } from "@/lib/gemini-batch";

let analyzePromptCache: string | null = null;
let structurePromptCache: string | null = null;
let structureSchemaCache: unknown | null = null;

type ResourceTarget = string | URL;

function resolveResource(target: ResourceTarget): string | URL {
  if (typeof target === "string") {
    if (path.isAbsolute(target)) {
      return target;
    }
    return path.resolve(process.cwd(), target);
  }
  return target;
}

function getAnalyzePromptTarget(): ResourceTarget {
  if (process.env.GEMINI_PROMPT_ANALYZE_PATH) {
    return process.env.GEMINI_PROMPT_ANALYZE_PATH;
  }
  return new URL("./defaults/gemini-prompt1.txt", import.meta.url);
}

function getStructurePromptTarget(): ResourceTarget {
  if (process.env.GEMINI_PROMPT_STRUCTURE_PATH) {
    return process.env.GEMINI_PROMPT_STRUCTURE_PATH;
  }
  return new URL("./defaults/gemini-prompt2.txt", import.meta.url);
}

function getStructureSchemaTarget(): ResourceTarget {
  if (process.env.GEMINI_STRUCTURE_SCHEMA_PATH) {
    return process.env.GEMINI_STRUCTURE_SCHEMA_PATH;
  }
  return new URL("./defaults/structured-output.json", import.meta.url);
}

export async function getAnalyzePrompt(): Promise<string> {
  if (analyzePromptCache) return analyzePromptCache;
  const filePath = resolveResource(getAnalyzePromptTarget());
  analyzePromptCache = await fs.readFile(filePath, "utf8");
  return analyzePromptCache;
}

export async function getStructurePrompt(): Promise<string> {
  if (structurePromptCache) return structurePromptCache;
  const filePath = resolveResource(getStructurePromptTarget());
  structurePromptCache = await fs.readFile(filePath, "utf8");
  return structurePromptCache;
}

export async function getStructureResponseSchema(): Promise<unknown> {
  if (structureSchemaCache) return structureSchemaCache;
  const filePath = resolveResource(getStructureSchemaTarget());
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  structureSchemaCache = convertSchema(parsed);
  return structureSchemaCache;
}

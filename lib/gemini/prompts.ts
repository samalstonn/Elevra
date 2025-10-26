import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertSchema } from "@/lib/gemini-batch";

let analyzePromptCache: string | null = null;
let structurePromptCache: string | null = null;
let structureSchemaCache: unknown | null = null;

type ResourceTarget = string;

function defaultsPath(file: string): string {
  return path.join(process.cwd(), "lib/gemini/defaults", file);
}

function resolveResource(target: ResourceTarget): string {
  if (target.startsWith("file://")) {
    return fileURLToPath(target);
  }
  if (path.isAbsolute(target)) {
    return target;
  }
  return path.resolve(process.cwd(), target);
}

function getAnalyzePromptTarget(): ResourceTarget {
  if (process.env.GEMINI_PROMPT_ANALYZE_PATH) {
    return process.env.GEMINI_PROMPT_ANALYZE_PATH;
  }
  return defaultsPath("gemini-prompt1.txt");
}

function getStructurePromptTarget(): ResourceTarget {
  if (process.env.GEMINI_PROMPT_STRUCTURE_PATH) {
    return process.env.GEMINI_PROMPT_STRUCTURE_PATH;
  }
  return defaultsPath("gemini-prompt2.txt");
}

function getStructureSchemaTarget(): ResourceTarget {
  if (process.env.GEMINI_STRUCTURE_SCHEMA_PATH) {
    return process.env.GEMINI_STRUCTURE_SCHEMA_PATH;
  }
  return defaultsPath("structured-output.json");
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

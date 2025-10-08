import { promises as fs } from "node:fs";
import path from "node:path";
import { convertSchema } from "@/lib/gemini-batch";

let analyzePromptCache: string | null = null;
let structurePromptCache: string | null = null;
let structureSchemaCache: unknown | null = null;

function resolveFromRoot(relativePath: string) {
  return path.resolve(process.cwd(), relativePath);
}

function getAnalyzePromptPath() {
  return (
    process.env.GEMINI_PROMPT_ANALYZE_PATH ||
    "election-source/gemini-prompt1.txt"
  );
}

function getStructurePromptPath() {
  return (
    process.env.GEMINI_PROMPT_STRUCTURE_PATH ||
    "election-source/gemini-prompt2.txt"
  );
}

function getStructureSchemaPath() {
  return (
    process.env.GEMINI_STRUCTURE_SCHEMA_PATH ||
    "election-source/structured-output.json"
  );
}

export async function getAnalyzePrompt(): Promise<string> {
  if (analyzePromptCache) return analyzePromptCache;
  const filePath = resolveFromRoot(getAnalyzePromptPath());
  analyzePromptCache = await fs.readFile(filePath, "utf8");
  return analyzePromptCache;
}

export async function getStructurePrompt(): Promise<string> {
  if (structurePromptCache) return structurePromptCache;
  const filePath = resolveFromRoot(getStructurePromptPath());
  structurePromptCache = await fs.readFile(filePath, "utf8");
  return structurePromptCache;
}

export async function getStructureResponseSchema(): Promise<unknown> {
  if (structureSchemaCache) return structureSchemaCache;
  const filePath = resolveFromRoot(getStructureSchemaPath());
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  structureSchemaCache = convertSchema(parsed);
  return structureSchemaCache;
}

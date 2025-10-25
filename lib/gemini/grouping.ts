import type { Prisma } from "@prisma/client";
import type { Row } from "@/election-source/build-spreadsheet";

export type UploadBatchGroup = {
  key: string;
  municipality: string;
  state: string;
  position: string;
  rows: Row[];
  rawRowsJson: Prisma.InputJsonValue;
  estimatedAnalyzeTokens: number;
  estimatedStructureTokens: number;
};

const ANALYZE_PROMPT_OVERHEAD = 1_200; // heuristic prompt size for analysis prompt
const STRUCTURE_PROMPT_OVERHEAD = 1_600; // includes analysis handoff context
const CHARS_PER_TOKEN = 4; // rough GPT-style heuristic

export function groupRowsForUpload(rows: Row[]): UploadBatchGroup[] {
  const groups = new Map<string, UploadBatchGroup>();
  rows.forEach((row) => {
    const key = normalizeGroupKey(row);
    if (!groups.has(key)) {
      const baseGroup: UploadBatchGroup = {
        key,
        municipality: (row.municipality || "").trim(),
        state: (row.state || "").trim(),
        position: String(row.position ?? "").trim(),
        rows: [],
        rawRowsJson: [],
        estimatedAnalyzeTokens: 0,
        estimatedStructureTokens: 0,
      };
      groups.set(key, baseGroup);
    }
    groups.get(key)!.rows.push(row);
  });

  return Array.from(groups.values())
    .map((group) => {
      // Convert rows into JsonValue while computing token heuristics once.
      const jsonRows = group.rows.map((r) => ({ ...r }));
      const jsonString = JSON.stringify(jsonRows);
      const chars = jsonString.length;
      const analyzeTokens = Math.ceil((chars + ANALYZE_PROMPT_OVERHEAD) / CHARS_PER_TOKEN);
      const structureTokens = Math.ceil(
        (chars + STRUCTURE_PROMPT_OVERHEAD) / CHARS_PER_TOKEN
      );
      return {
        ...group,
        rawRowsJson: jsonRows as unknown as Prisma.InputJsonValue,
        estimatedAnalyzeTokens: analyzeTokens,
        estimatedStructureTokens: structureTokens,
      };
    })
    .sort((a, b) => {
      const stateCompare = a.state.localeCompare(b.state);
      if (stateCompare !== 0) return stateCompare;
      const municipalityCompare = a.municipality.localeCompare(b.municipality);
      if (municipalityCompare !== 0) return municipalityCompare;
      return a.position.localeCompare(b.position);
    });
}

export function normalizeGroupKey(row: Row): string {
  const city = (row.municipality || "").trim().toLowerCase();
  const state = (row.state || "").trim().toLowerCase();
  const position = String(row.position ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return `${city}|${state}|${position || "unknown-position"}`;
}

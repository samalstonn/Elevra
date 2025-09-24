import { GoogleGenAI } from "@google/genai";
import { buildSemanticCatalog } from "./catalog";
import { getCachedEmbedding, storeEmbedding, getCacheSnapshot } from "./cache";
import { parseLocationFromQuery } from "./location";
import { cosineSimilarity } from "./vector";
import type {
  ParsedLocation,
  SemanticRouteEntry,
  SemanticRouteMatch,
  SemanticRouteScoredEntry,
} from "./types";

type KeywordMatch = {
  url: string;
  rationale: string;
};

const EMBEDDING_MODEL = "text-embedding-004";
const DEFAULT_THRESHOLD = 0.78;
const DEFAULT_BATCH_SIZE = 16;

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY (or GOOGLE_API_KEY) for semantic routing embeddings"
    );
  }
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }
  const client = getClient();
  const response = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
  });
  const embeddings = response.embeddings ?? [];
  return embeddings.map((item) => item.values ?? []);
}

async function ensureEmbeddings(
  entries: SemanticRouteEntry[],
  batchSize: number
): Promise<Map<string, number[]>> {
  const vectors = new Map<string, number[]>();
  const missing: SemanticRouteEntry[] = [];

  for (const entry of entries) {
    const cached = await getCachedEmbedding(entry.id);
    if (cached && cached.length > 0) {
      vectors.set(entry.id, cached);
    } else {
      missing.push(entry);
    }
  }

  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    const texts = batch.map((entry) => entry.embeddingText);
    const embeddings = await embedBatch(texts);
    embeddings.forEach((vector, index) => {
      const entry = batch[index];
      if (!entry) return;
      vectors.set(entry.id, vector);
      storeEmbedding(entry.id, vector).catch((error) => {
        console.warn(
          "semantic-routing: unable to persist embedding",
          entry.id,
          error
        );
      });
    });
  }

  return vectors;
}

async function embedQuery(query: string): Promise<number[]> {
  const vectors = await embedBatch([query]);
  return vectors[0] ?? [];
}

function scoreEntries(
  queryVector: number[],
  entries: SemanticRouteEntry[],
  entryVectors: Map<string, number[]>
): SemanticRouteScoredEntry[] {
  const scored: SemanticRouteScoredEntry[] = [];
  for (const entry of entries) {
    const vector = entryVectors.get(entry.id);
    if (!vector || vector.length === 0) continue;
    const rawScore = cosineSimilarity(queryVector, vector);
    const similarity = entry.weight ? rawScore * entry.weight : rawScore;
    scored.push({ entry, similarity, embedding: vector });
  }
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored;
}

async function keywordFallback(
  query: string,
  entries: SemanticRouteEntry[]
): Promise<KeywordMatch | null> {
  const lower = query.toLowerCase();

  if (/(live|today|happening|current)/.test(lower)) {
    return {
      url: "/live-elections",
      rationale: "Matched live elections keywords",
    };
  }

  if (/results?|who won|votes?|ballot/.test(lower)) {
    const location = await parseLocationFromQuery(query);
    if (location) {
      const params = new URLSearchParams();
      params.set("city", location.city);
      params.set("state", location.state);
      return {
        url: `/results?${params.toString()}`,
        rationale: "Detected election results query with location",
      };
    }
    return {
      url: "/results",
      rationale: "Detected generic election results query",
    };
  }

  // Direct candidate name match fallback.
  const candidateEntry = entries.find((entry) => {
    if (entry.type !== "candidate" || !entry.keywords) return false;
    return entry.keywords.some((keyword) =>
      keyword ? lower.includes(keyword.toLowerCase()) : false
    );
  });
  if (candidateEntry) {
    return {
      url: candidateEntry.url,
      rationale: "Matched candidate name keyword",
    };
  }

  return null;
}

function formatResultsUrl(baseUrl: string, location: ParsedLocation | null): string {
  if (!location) return baseUrl;
  const params = new URLSearchParams();
  params.set("city", location.city);
  params.set("state", location.state);
  return `${baseUrl}?${params.toString()}`;
}

export async function resolveSemanticRoute(
  query: string,
  options?: { debug?: boolean }
): Promise<SemanticRouteMatch> {
  if (typeof window !== "undefined") {
    throw new Error("resolveSemanticRoute must be called server-side");
  }
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return {
      url: "/search?query=",
      score: 0,
      source: "fallback",
      rationale: "Empty query",
    };
  }

  const threshold = Number(
    process.env.SEMANTIC_ROUTER_THRESHOLD ?? DEFAULT_THRESHOLD
  );
  const batchSize = Number(
    process.env.SEMANTIC_ROUTER_BATCH_SIZE ?? DEFAULT_BATCH_SIZE
  );
  const effectiveBatchSize = Number.isNaN(batchSize) ? DEFAULT_BATCH_SIZE : batchSize;

  const catalog = await buildSemanticCatalog();
  const entryVectors = await ensureEmbeddings(catalog, effectiveBatchSize);
  const queryVector = await embedQuery(trimmed);
  if (queryVector.length === 0) {
    throw new Error("Failed to compute embedding for query");
  }

  const scored = scoreEntries(queryVector, catalog, entryVectors);
  const top = scored[0];
  const topScore = top?.similarity ?? 0;

  if (top && topScore >= threshold) {
    if (top.entry.type === "candidate") {
      return {
        url: top.entry.url,
        score: topScore,
        source: "embedding",
        matchedEntry: {
          id: top.entry.id,
          type: top.entry.type,
          url: top.entry.url,
          keywords: top.entry.keywords,
        },
        rationale: "Best semantic match is a candidate profile",
        debug: options?.debug
          ? {
              topMatches: scored.slice(0, 5).map((item) => ({
                id: item.entry.id,
                score: Number(item.similarity.toFixed(4)),
              })),
            }
          : undefined,
      };
    }

    if (top.entry.type === "live-elections") {
      return {
        url: top.entry.url,
        score: topScore,
        source: "embedding",
        matchedEntry: {
          id: top.entry.id,
          type: top.entry.type,
          url: top.entry.url,
          keywords: top.entry.keywords,
        },
        rationale: "Best semantic match is live elections hub",
        debug: options?.debug
          ? {
              topMatches: scored.slice(0, 5).map((item) => ({
                id: item.entry.id,
                score: Number(item.similarity.toFixed(4)),
              })),
            }
          : undefined,
      };
    }

    if (top.entry.type === "results") {
      const location = await parseLocationFromQuery(trimmed);
      return {
        url: formatResultsUrl(top.entry.url, location),
        score: topScore,
        source: "embedding",
        matchedEntry: {
          id: top.entry.id,
          type: top.entry.type,
          url: top.entry.url,
          keywords: top.entry.keywords,
        },
        rationale: location
          ? "Detected election results intent with location"
          : "Matched election results hub",
        debug: options?.debug
          ? {
              topMatches: scored.slice(0, 5).map((item) => ({
                id: item.entry.id,
                score: Number(item.similarity.toFixed(4)),
              })),
            }
          : undefined,
      };
    }
  }

  // Keyword-based fallback
  const keywordRoute = await keywordFallback(trimmed, catalog);
  if (keywordRoute) {
    return {
      url: keywordRoute.url,
      score: topScore,
      source: "keyword",
      rationale: keywordRoute.rationale,
      matchedEntry: top
        ? {
            id: top.entry.id,
            type: top.entry.type,
            url: top.entry.url,
            keywords: top.entry.keywords,
          }
        : undefined,
    };
  }

  const searchUrl = `/search?query=${encodeURIComponent(trimmed)}`;
  return {
    url: searchUrl,
    score: topScore,
    source: "fallback",
    rationale: "Fell back to search page",
    matchedEntry: top
      ? {
          id: top.entry.id,
          type: top.entry.type,
          url: top.entry.url,
          keywords: top.entry.keywords,
        }
      : undefined,
    debug: options?.debug
      ? {
          topMatches: scored.slice(0, 5).map((item) => ({
            id: item.entry.id,
            score: Number(item.similarity.toFixed(4)),
          })),
        }
      : undefined,
  };
}

export function getSemanticCacheSnapshot() {
  return getCacheSnapshot();
}

import { promises as fs } from "node:fs";
import path from "node:path";

const CACHE_PATH = path.join(
  process.cwd(),
  "lib",
  "semantic-routing",
  "embedding-cache.json"
);

interface CacheFile {
  version: number;
  entries: Record<string, number[]>;
}

const CACHE_VERSION = 1;
const memoryCache = new Map<string, number[]>();
let hasLoadedFromDisk = false;
let persistTimer: NodeJS.Timeout | null = null;

async function loadCacheFromDisk() {
  if (hasLoadedFromDisk) return;
  hasLoadedFromDisk = true;
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as CacheFile;
    if (parsed.version === CACHE_VERSION && parsed.entries) {
      for (const [id, vector] of Object.entries(parsed.entries)) {
        if (Array.isArray(vector)) {
          memoryCache.set(id, vector);
        }
      }
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code !== "ENOENT") {
      console.warn("semantic-routing: unable to read embedding cache", error);
    }
  }
}

function schedulePersist() {
  if (process.env.NODE_ENV === "production") {
    return; // Avoid file system writes in production (e.g., serverless envs)
  }
  if (persistTimer) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(async () => {
    try {
      const entries = Object.fromEntries(memoryCache.entries());
      const payload: CacheFile = {
        version: CACHE_VERSION,
        entries,
      };
      await fs.writeFile(CACHE_PATH, JSON.stringify(payload, null, 2), "utf8");
    } catch (error) {
      console.warn("semantic-routing: failed to persist embedding cache", error);
    }
  }, 500);
}

export async function getCachedEmbedding(id: string): Promise<number[] | null> {
  await loadCacheFromDisk();
  const vector = memoryCache.get(id);
  return vector ? [...vector] : null;
}

export async function storeEmbedding(id: string, vector: number[]): Promise<void> {
  await loadCacheFromDisk();
  memoryCache.set(id, [...vector]);
  schedulePersist();
}

export function getCacheSnapshot(): Record<string, number[]> {
  return Object.fromEntries(memoryCache.entries());
}

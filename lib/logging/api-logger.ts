import { appendFile, mkdir } from "fs/promises";
import { dirname, join } from "path";

const defaultDirectory =
  process.env.API_LOG_DIRECTORY ?? join(process.cwd(), "logging");
const LOG_FILE_PATH =
  process.env.API_LOG_FILE ?? join(defaultDirectory, "api.log");

export type ApiLogEntry = {
  method: string;
  pathname: string;
  timestamp: string;
  slug?: string;
};

async function ensureLogFileDirectory() {
  try {
    await mkdir(dirname(LOG_FILE_PATH), { recursive: true });
  } catch {
    // Ignore errors (e.g., read-only FS in serverless)
  }
}

function sanitizeLogField(value: string, maxLength = 512): string {
  try {
    let s = String(value);
    // Replace control chars (includes \r, \n, \t) with spaces
    s = s.replace(/[\u0000-\u001F\u007F]/g, " ");
    // Collapse repeated whitespace
    s = s.replace(/\s+/g, " ").trim();
    // Truncate to safe length
    if (s.length > maxLength) s = s.slice(0, maxLength);
    return s;
  } catch {
    return "";
  }
}

export async function logApiCall(entry: ApiLogEntry) {
  // Best-effort local file append (useful in dev/self-hosted)
  try {
    await ensureLogFileDirectory();
    const safePathname = sanitizeLogField(entry.pathname);
    const safeSlug = entry.slug ? sanitizeLogField(entry.slug) : undefined;
    const parts = [entry.timestamp, entry.method.toUpperCase(), safePathname];
    if (safeSlug) parts.push(`slug=${safeSlug}`);
    const line = `${parts.join(" ")}\n`;
    await appendFile(LOG_FILE_PATH, line, { encoding: "utf8" });
  } catch {
    // Ignore file write failures (e.g., serverless read-only FS)
  }
}

export function getApiLogFilePath() {
  return LOG_FILE_PATH;
}

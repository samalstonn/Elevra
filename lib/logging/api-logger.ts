import { appendFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { tmpdir } from "os";

const defaultDirectory = process.env.API_LOG_DIRECTORY ?? join(tmpdir(), "elevra-logs");
const LOG_FILE_PATH = process.env.API_LOG_FILE ?? join(defaultDirectory, "api.log");

export type ApiLogEntry = {
  method: string;
  pathname: string;
  timestamp: string;
};

async function ensureLogFileDirectory() {
  await mkdir(dirname(LOG_FILE_PATH), { recursive: true });
}

export async function logApiCall(entry: ApiLogEntry) {
  await ensureLogFileDirectory();
  const line = `${entry.timestamp} ${entry.method.toUpperCase()} ${entry.pathname}\n`;
  await appendFile(LOG_FILE_PATH, line, { encoding: "utf8" });
}

export function getApiLogFilePath() {
  return LOG_FILE_PATH;
}

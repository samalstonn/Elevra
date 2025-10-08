export type GeminiModelRateConfig = {
  rpm: number; // requests per minute
  tpm: number; // tokens per minute
  rpd?: number; // requests per day
  batchTokens?: number; // per batch token enqueue limits
};

/**
 * Rate limit strategy keyed by model id.
 * These values follow the product docs provided by the user.
 */
export const GEMINI_MODEL_RATE_LIMITS: Record<string, GeminiModelRateConfig> = {
  "gemini-2.5-pro": {
    rpm: 150,
    tpm: 2_000_000,
    rpd: 10_000,
    batchTokens: 5_000_000,
  },
  "gemini-1.5-pro": {
    rpm: 1_000,
    tpm: 4_000_000,
  },
  "gemini-2.5-flash": {
    rpm: 1_000,
    tpm: 1_000_000,
    rpd: 10_000,
  },
  "gemini-2.0-flash": {
    rpm: 2_000,
    tpm: 4_000_000,
    batchTokens: 3_000_000,
  },
};

export const ANALYZE_PRIMARY_MODEL = "gemini-2.5-pro" as const;
export const ANALYZE_FALLBACK_MODELS = ["gemini-1.5-pro"] as const;

export const STRUCTURE_PRIMARY_MODEL = "gemini-2.5-flash" as const;
export const STRUCTURE_FALLBACK_MODELS = ["gemini-2.0-flash"] as const;

export const INSERT_PRIMARY_MODEL = "gemini-2.5-pro" as const;
export const INSERT_FALLBACK_MODELS = ["gemini-1.5-pro"] as const;

export const DEFAULT_JOB_MAX_RETRIES = 5;
export const DEFAULT_JOB_TIMEOUT_MS = 1000 * 60 * 8; // 8 minutes safety window per job

export const GEMINI_DISPATCH_MAX_PER_TICK = 20;

export const GEMINI_DISPATCH_DEFAULT_TIME_BUDGET_MS = 1000 * 50; // ~50 seconds to stay under Vercel cron limits

export const MIN_RETRY_DELAY_MS = 1000 * 30; // 30s base delay before retrying

export function getModelRateConfig(model: string): GeminiModelRateConfig | null {
  return GEMINI_MODEL_RATE_LIMITS[model] ?? null;
}

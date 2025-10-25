import { GoogleGenAI } from "@google/genai";

let cachedClient: GoogleGenAI | null = null;

export type GeminiRuntimeConfig = {
  enabled: boolean;
  model: string;
  fallbackModel: string;
  maxOutputTokens: number;
  useThinking: boolean;
  thinkingBudget: number;
  useSearch: boolean;
};

export function getGeminiRuntimeConfig(): GeminiRuntimeConfig {
  const isProd = process.env.NODE_ENV === "production";
  const enabledEnv = process.env.GEMINI_ENABLED;
  const enabled = enabledEnv ? enabledEnv === "true" : isProd;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";
  const fallbackModel = process.env.GEMINI_MODEL_FALLBACK || "gemini-1.5-pro";
  const maxOutputTokens = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "4096");
  const useThinking = (process.env.GEMINI_THINKING || "").toLowerCase() === "true";
  const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? "0");
  const useSearch =
    (process.env.GEMINI_TOOLS_GOOGLE_SEARCH || "").toLowerCase() === "true";

  return {
    enabled,
    model,
    fallbackModel,
    maxOutputTokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : 4096,
    useThinking,
    thinkingBudget: Number.isFinite(thinkingBudget) ? thinkingBudget : 0,
    useSearch,
  };
}

export function getGeminiClient(): GoogleGenAI {
  if (!cachedClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

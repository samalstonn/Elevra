import * as Sentry from "@sentry/nextjs";
import "@/sentry.server.config";

type GeminiErrorContext = {
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  fingerprint?: string[];
  level?: Sentry.SeverityLevel;
  message?: string;
};

export function reportGeminiError(
  error: unknown,
  context: GeminiErrorContext = {}
): string | undefined {
  const { extra, tags, fingerprint, level, message } = context;
  const captureContext = {
    tags: {
      feature: "gemini",
      ...tags,
    },
    extra: {
      ...(message ? { message } : null),
      ...extra,
    },
    fingerprint,
    level,
  };

  return Sentry.captureException(
    normalizeError(error),
    captureContext as Parameters<typeof Sentry.captureException>[1]
  );
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
}

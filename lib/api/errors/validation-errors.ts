// lib/api/errors/validation-errors.ts

import { ZodError, ZodIssue } from "zod";

/**
 * Formats a Zod error into a user-friendly format
 */
export function formatZodError<T = unknown>(error: ZodError<T>) {
  const formattedErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    (formattedErrors[key] ??= []).push(issue.message);
  }

  return {
    errors: formattedErrors,
    issues: error.issues,
  };
}

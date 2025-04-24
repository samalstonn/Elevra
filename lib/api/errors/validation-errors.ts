// lib/api/errors/validation-errors.ts

import { ZodError, ZodIssue } from "zod";

/**
 * Formats a Zod error into a user-friendly format
 */
export function formatZodError(error: ZodError) {
  const formattedErrors: Record<string, string> = {};

  error.issues.forEach((issue: ZodIssue) => {
    const path = issue.path.join(".");
    formattedErrors[path || "_"] = issue.message;
  });

  return {
    errors: formattedErrors,
    issues: error.issues,
  };
}

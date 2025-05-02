// lib/api/validation.ts

import { z } from "zod";
import { ValidationError } from "./errors/error-types";

/**
 * Validates request body against a Zod schema
 */
export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors from Zod
      const details = error.issues.reduce((acc, issue) => {
        const path = issue.path.join(".") || "_";
        acc[path] = issue.message;
        return acc;
      }, {} as Record<string, string>);

      throw new ValidationError("Validation failed", { fields: details });
    }

    throw new ValidationError("Invalid request data");
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    // Convert URLSearchParams to a plain object
    const queryObject: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      if (queryObject[key]) {
        // If the key already exists, convert to array or push to existing array
        if (Array.isArray(queryObject[key])) {
          (queryObject[key] as string[]).push(value);
        } else {
          queryObject[key] = [queryObject[key] as string, value];
        }
      } else {
        queryObject[key] = value;
      }
    });

    return schema.parse(queryObject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors from Zod
      const details = error.issues.reduce((acc, issue) => {
        const path = issue.path.join(".") || "_";
        acc[path] = issue.message;
        return acc;
      }, {} as Record<string, string>);

      throw new ValidationError("Invalid query parameters", {
        fields: details,
      });
    }

    throw new ValidationError("Invalid query parameters");
  }
}

/**
 * Validates URL parameters against a Zod schema
 */
export function validateParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors from Zod
      const details = error.issues.reduce((acc, issue) => {
        const path = issue.path.join(".") || "_";
        acc[path] = issue.message;
        return acc;
      }, {} as Record<string, string>);

      throw new ValidationError("Invalid URL parameters", { fields: details });
    }

    throw new ValidationError("Invalid URL parameters");
  }
}

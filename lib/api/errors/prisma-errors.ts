// lib/api/errors/prisma-errors.ts

import { AppError } from "./app-error";
import { ConflictError, NotFoundError, ValidationError } from "./error-types";

// Define a type that captures the essential structure of Prisma errors
export interface PrismaErrorLike {
  code: string;
  message: string;
  meta?: Record<string, any>;
}

/**
 * Maps Prisma error codes to user-friendly error messages
 */
export function handlePrismaError(error: PrismaErrorLike): AppError {
  switch (error.code) {
    // Not found errors
    case "P2001": // Record does not exist
    case "P2025": {
      // Record to update/delete not found
      const resourceName = getResourceNameFromError(error) || "Resource";
      const resourceId = getResourceIdFromError(error);

      // Only pass resourceId if it's not null
      return resourceId !== null
        ? new NotFoundError(resourceName, resourceId)
        : new NotFoundError(resourceName);
    }

    // Unique constraint violations
    case "P2002": {
      const fields = (error.meta?.target as string[]) || ["field"];
      return new ConflictError(
        `A record with this ${fields.join(", ")} already exists`,
        { fields }
      );
    }

    // Foreign key constraint failures
    case "P2003": {
      const field = (error.meta?.field_name as string) || "field";
      return new ValidationError(`Invalid reference: ${field}`, { field });
    }

    // Field constraint failures
    case "P2004": {
      const constraint = (error.meta?.constraint as string) || "constraint";
      return new ValidationError(`Database constraint failed: ${constraint}`, {
        constraint,
      });
    }

    // Required field missing
    case "P2011":
      return new ValidationError(
        `Required field missing: ${error.meta?.constraint || "unknown"}`,
        { field: error.meta?.constraint }
      );

    // Invalid field value
    case "P2007":
      return new ValidationError(`Invalid data provided`, {
        details: error.message,
      });

    // Default - return a generic error
    default:
      return new AppError(
        "A database error occurred",
        `PRISMA_${error.code}`,
        500,
        { prismaError: error.code }
      );
  }
}

/**
 * Attempts to extract a resource name from a Prisma error
 */
function getResourceNameFromError(error: PrismaErrorLike): string | null {
  try {
    // Try to get model name from error message
    const modelMatch = error.message.match(/on\s+(\w+)\s+/);
    if (modelMatch && modelMatch[1]) {
      return modelMatch[1];
    }

    // Check meta information
    if (error.meta?.model_name) {
      return error.meta.model_name as string;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Attempts to extract a resource ID from a Prisma error
 */
function getResourceIdFromError(
  error: PrismaErrorLike
): string | number | null {
  try {
    if (error.meta?.id) {
      return error.meta.id as string | number;
    }

    return null;
  } catch {
    return null;
  }
}

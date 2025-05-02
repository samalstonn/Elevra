// lib/api/errors/error-handler.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./app-error";
import { formatZodError } from "./validation-errors";
import { logger } from "@/lib/logger";

/**
 * Generates a unique trace ID for error tracking
 */
function generateTraceId(): string {
  return `err-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 7)}`;
}

/**
 * Centralized error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  logger.error("Handling API error", error);

  // Generate a unique trace ID
  const traceId = generateTraceId();

  // Handle known application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          traceId,
          status: error.status,
        },
      },
      { status: error.status }
    );
  }

  // Handle Prisma errors by checking for properties that Prisma errors typically have
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("P")
  ) {
    // This is likely a Prisma error
    const prismaError = error as any;
    let status = 500;
    let code = `PRISMA_${prismaError.code}`;
    let message = "A database error occurred";
    let details: Record<string, any> = { prismaError: prismaError.code };

    // Handle common Prisma error codes
    switch (prismaError.code) {
      case "P2001": // Record does not exist
      case "P2025": // Record to update/delete not found
        status = 404;
        code = "RESOURCE_NOT_FOUND";
        message = "The requested resource does not exist";
        break;

      case "P2002": // Unique constraint failed
        status = 409;
        code = "RESOURCE_CONFLICT";
        message = "A resource with this identifier already exists";
        details = { fields: prismaError.meta?.target || ["unknown"] };
        break;

      case "P2003": // Foreign key constraint failed
      case "P2004": // Constraint failed
        status = 400;
        code = "VALIDATION_ERROR";
        message = "Invalid reference to a related resource";
        break;
    }

    return NextResponse.json(
      {
        error: {
          code,
          message,
          details,
          traceId,
          status,
        },
      },
      { status }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = formatZodError(error);

    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: formattedErrors,
          traceId,
          status: 400,
        },
      },
      { status: 400 }
    );
  }

  // Handle standard JS errors
  if (error instanceof Error) {
    // In production, don't expose error messages
    const isProduction = process.env.NODE_ENV === "production";
    const message = isProduction
      ? "An unexpected error occurred"
      : error.message;

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message,
          traceId,
          status: 500,
        },
      },
      { status: 500 }
    );
  }

  // Generic fallback for unknown errors
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        traceId,
        status: 500,
      },
    },
    { status: 500 }
  );
}

/**
 * Wraps an API route handler with error handling
 */
export function withErrorHandling<T>(
  handler: (req: Request, ctx: T) => Promise<Response>
) {
  return async (req: Request, ctx: T): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

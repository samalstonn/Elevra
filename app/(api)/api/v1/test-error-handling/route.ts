// app/api/test-error-handling/route.ts

import { NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/errors/error-handler";
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
} from "@/lib/api/errors/error-types";

// Helper function to simulate errors
function simulateError(type: string): Error {
  switch (type) {
    case "validation":
      return new ValidationError("Invalid data", {
        field: "name",
        message: "Name is required",
      });
    case "not-found":
      return new NotFoundError("User", 123);
    case "auth":
      return new AuthenticationError();
    case "database":
      // Simulate a Prisma error structure without importing Prisma
      const error = new Error("Database connection failed") as any;
      error.code = "P2025";
      error.meta = { model_name: "User", id: 456 };
      return error;
    default:
      return new Error("Unknown error");
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const errorType = searchParams.get("type") || "default";

    // Simulate an error
    throw simulateError(errorType);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/test-error-handling?type=validation
// GET /api/test-error-handling?type=not-found
// GET /api/test-error-handling?type=auth
// GET /api/test-error-handling?type=database

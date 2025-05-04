// lib/api/errors/error-types.ts

import { AppError } from "./app-error";

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message || "Validation failed", "VALIDATION_ERROR", 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message?: string) {
    super(message || "Authentication required", "AUTHENTICATION_REQUIRED", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message?: string) {
    super(
      message || "You do not have permission to access this resource",
      "ACCESS_DENIED",
      403
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(
      `${resource} not found`,
      "RESOURCE_NOT_FOUND",
      404,
      id
        ? { resourceType: resource, resourceId: id }
        : { resourceType: resource }
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "RESOURCE_CONFLICT", 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, resetTime?: Date) {
    super("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", 429, {
      limit,
      resetAt: resetTime?.toISOString(),
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message?: string) {
    super(
      message || "An unexpected error occurred",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message?: string) {
    super(
      message || "Service temporarily unavailable",
      "SERVICE_UNAVAILABLE",
      503
    );
  }
}

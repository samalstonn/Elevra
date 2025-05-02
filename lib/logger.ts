// lib/logger.ts

type LogLevel = "debug" | "info" | "warn" | "error";

type LogData = Record<string, unknown>;
type ErrorData = Error | unknown;

/**
 * Structured logger for consistent log formatting
 */
export const logger = {
  debug: (message: string, data?: LogData) => log("debug", message, data),
  info: (message: string, data?: LogData) => log("info", message, data),
  warn: (message: string, data?: LogData) => log("warn", message, data),
  error: (message: string, error?: ErrorData) => log("error", message, error),

  // Special methods for specific contexts
  api: {
    request: (method: string, url: string, data?: LogData) => {
      log("info", `API Request: ${method} ${url}`, data);
    },
    response: (method: string, url: string, status: number, data?: LogData) => {
      log("info", `API Response: ${method} ${url} ${status}`, data);
    },
    error: (method: string, url: string, error: ErrorData) => {
      log("error", `API Error: ${method} ${url}`, error);
    },
  },

  db: {
    query: (operation: string, model: string, data?: any) => {
      log("debug", `DB ${operation} on ${model}`, data);
    },
    error: (operation: string, model: string, error: any) => {
      log("error", `DB Error: ${operation} on ${model}`, error);
    },
  },
};

/**
 * Internal logging function
 */
function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...(data ? { data: sanitizeData(data) } : {}),
  };

  // In production, you might want to use a proper logging service
  // For example, send logs to Datadog, LogRocket, etc.

  if (process.env.NODE_ENV === "development") {
    // Pretty print in development
    console[level](
      `[${timestamp}] ${level.toUpperCase()}: ${message}`,
      data ? data : ""
    );
  } else {
    // JSON format in production for easier parsing
    console[level](JSON.stringify(logData));
  }
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data: any): any {
  if (!data) return data;

  // For errors, extract useful properties
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env.NODE_ENV !== "production" ? data.stack : undefined,
      ...(data as any),
    };
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  // Handle objects
  if (typeof data === "object") {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Mask sensitive fields
      if (
        ["password", "token", "secret", "authorization", "key", "apiKey"].some(
          (term) => key.toLowerCase().includes(term)
        )
      ) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }

    return sanitized;
  }

  return data;
}

// lib/api/rate-limit.ts

import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { RateLimitError } from "./errors/error-types";
import { handleApiError } from "./errors/error-handler";

// Initialize Redis client
const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;
const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

/**
 * Rate limiting middleware for API routes
 * @param request The incoming request
 * @param options Rate limiting options
 */
export async function rateLimitRequest(
  request: NextRequest,
  options: {
    limit?: number; // Maximum requests per window
    window?: number; // Time window in seconds
    identifier?: string; // Custom identifier (default: IP)
  } = {}
) {
  // If Redis is not available, skip rate limiting
  if (!redis) {
    console.warn(
      "Redis not configured. Falling back to in-memory rate limiter. " +
        "This may not scale across instances or survive restarts."
    );
    // Fallback: in-memory limiter using rate-limiter-flexible
    const { RateLimiterMemory } = await import("rate-limiter-flexible");
    const {
      limit = 60, // Default: 60 requests
      window = 60, // Default: per minute
    } = options;
    const memoryLimiter = new RateLimiterMemory({
      points: limit, // Use the same limit as Redis
      duration: window, // Use the same window as Redis
    });
    return { consume: (key: string) => memoryLimiter.consume(key) };
  }

  const {
    limit = 60, // Default: 60 requests
    window = 60, // Default: per minute
    identifier = getRequestIdentifier(request),
  } = options;

  const key = `ratelimit:${identifier}`;

  try {
    // Increment counter
    const [counter, ttl] = await Promise.all([redis.incr(key), redis.ttl(key)]);

    // Set expiry if first request
    if (counter === 1) {
      await redis.expire(key, window);
    }

    // Calculate reset time
    const resetAt = new Date();
    resetAt.setSeconds(resetAt.getSeconds() + (ttl > 0 ? ttl : window));

    // Check if over limit
    if (counter > limit) {
      throw new RateLimitError(limit, resetAt);
    }

    // Return rate limit info
    return {
      limit,
      remaining: Math.max(0, limit - counter),
      reset: resetAt,
      success: true,
    };
  } catch (error) {
    // If it's our rate limit error, rethrow it
    if (error instanceof RateLimitError) {
      throw error;
    }

    // Log Redis errors but don't block the request
    console.error("Rate limiting error:", error);
    return null;
  }
}

/**
 * Middleware to apply rate limiting to a route handler
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  options: {
    limit?: number;
    window?: number;
  } = {}
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // Apply rate limiting
      await rateLimitRequest(req, options);

      // Continue to handler if within limits
      return await handler(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// lib/api/rate-limit.ts

/**
 * Get a unique identifier for the request (usually IP address)
 */
function getRequestIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // For authenticated requests, combine IP with user ID if available
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    // Extract user identifier from auth header if possible
    // This is just an example - adjust based on your auth system
    try {
      const token = authHeader.replace("Bearer ", "");
      const tokenHash = hashString(token);
      return `${ip}:${tokenHash}`;
    } catch {
      // Fall back to IP only
      return ip;
    }
  }

  return ip;
}

/**
 * Simple string hashing function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// lib/api/responses.ts

import { NextResponse } from "next/server";

/**
 * Creates a standardized success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  message: string,
  code: string,
  status = 400,
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
        status,
      },
    },
    { status }
  );
}

/**
 * Creates a standardized paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
}

/**
 * Creates a standardized empty response (204 No Content)
 */
export function emptyResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Creates a redirect response
 */
export function redirectResponse(url: string, status = 302): NextResponse {
  return NextResponse.redirect(new URL(url), status);
}

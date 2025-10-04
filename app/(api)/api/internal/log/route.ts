import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
// Ensure Sentry.init runs on the server for this route
import "@/sentry.server.config";

import { logApiCall } from "@/lib/logging/api-logger";
import { API_LOG_TOKEN_HEADER } from "@/lib/logging/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const expectedToken = process.env.API_LOG_TOKEN;
    if (expectedToken) {
      const providedToken = request.headers.get(API_LOG_TOKEN_HEADER);
      if (providedToken !== expectedToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = (await request.json()) as unknown;
    const { method, pathname, timestamp, slug } = (payload ?? {}) as Record<string, unknown>;

    if (typeof method !== "string" || typeof pathname !== "string" || typeof timestamp !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const entry = {
      method,
      pathname,
      timestamp,
      slug: typeof slug === "string" ? slug : undefined,
    } as const;

    await logApiCall(entry);
    // Forward to Sentry without blocking the caller
    try {
      const message = `${method.toUpperCase()} ${pathname}`;
      Sentry.addBreadcrumb({
        category: "api",
        level: "info",
        message,
        data: { kind: "api", ...entry },
      });
      // Do not flush here; fire-and-forget to avoid impacting latency
    } catch {}
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to log API call", error);
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}

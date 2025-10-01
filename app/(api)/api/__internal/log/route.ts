import { NextResponse } from "next/server";

import { logApiCall } from "@/lib/logging/api-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { method, pathname, timestamp } = payload ?? {};

    if (typeof method !== "string" || typeof pathname !== "string" || typeof timestamp !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await logApiCall({ method, pathname, timestamp });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to log API call", error);
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}

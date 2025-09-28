import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Server-side proxy that forwards to /api/admin/email with x-admin-secret.
// Uses the incoming request origin so it works in dev, preview, and prod
// without needing NEXT_PUBLIC_APP_URL.
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_EMAIL_SECRET;
  const { origin } = new URL(req.url);

  if (!secret) {
    return NextResponse.json(
      { error: "Missing ADMIN_EMAIL_SECRET env var" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Allow optional override of target admin API path via __proxyPath in body.
    // Defaults to /api/admin/email for backward compatibility.
    const { __proxyPath, ...payload } = (body || {}) as Record<string, unknown>;
    const targetPath = typeof __proxyPath === "string" && __proxyPath.startsWith("/api/admin/")
      ? __proxyPath
      : "/api/admin/email";
    const forwardedHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    };

    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      forwardedHeaders.cookie = cookieHeader;
    }

    const authorizationHeader = req.headers.get("authorization");
    if (authorizationHeader) {
      forwardedHeaders.authorization = authorizationHeader;
    }

    const res = await fetch(`${origin}${targetPath}`, {
      method: "POST",
      headers: forwardedHeaders,
      body: JSON.stringify(payload),
      // no-store to avoid caching
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[email-proxy] forward failed", e);
    return NextResponse.json(
      { error: "Failed to forward email request" },
      { status: 500 }
    );
  }
}

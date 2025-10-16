import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {
  UNSUBSCRIBE_SCOPE,
  verifyUnsubscribeToken,
} from "@/lib/email/unsubscribe";

export const runtime = "nodejs";

function getParam(req: NextRequest, key: string): string | undefined {
  const v = req.nextUrl.searchParams.get(key);
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

async function recordUnsubscribe(email: string, scope: string, req: NextRequest) {
  const lower = email.toLowerCase();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;
  const userAgent = req.headers.get("user-agent") || undefined;

  await prisma.emailUnsubscribe.upsert({
    where: { email_scope: { email: lower, scope } },
    update: { ip, userAgent },
    create: { email: lower, scope, ip, userAgent },
  });
}

export async function GET(req: NextRequest) {
  try {
    const email = getParam(req, "email");
    const scope = getParam(req, "scope") || UNSUBSCRIBE_SCOPE;
    const token = getParam(req, "token") || "";
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (scope !== UNSUBSCRIBE_SCOPE) {
      // Limit scope to candidate-outreach for now
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }
    if (!verifyUnsubscribeToken(token, email, scope)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await recordUnsubscribe(email, scope, req);

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribed</title>
  </head>
  <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; padding: 24px;">
    <h1 style="margin: 0 0 12px;">You’re unsubscribed</h1>
    <p style="margin: 0 0 12px;">${email} will no longer receive Elevra candidate outreach emails.</p>
  </body>
</html>`;

    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    console.error("unsubscribe GET failed", e);
    return NextResponse.json({ error: "Failed to process unsubscribe" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || undefined;
    const scope = (url.searchParams.get("scope") || UNSUBSCRIBE_SCOPE).trim();
    const token = url.searchParams.get("token") || "";
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (scope !== UNSUBSCRIBE_SCOPE) {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }
    if (!verifyUnsubscribeToken(token, email, scope)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await recordUnsubscribe(email, scope, req);

    // Per RFC 8058, respond 200 OK for one‑click POST
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("unsubscribe POST failed", e);
    return NextResponse.json({ error: "Failed to process unsubscribe" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { sendWithResend } from "@/lib/email/resend";

export const runtime = "nodejs";

interface SendEmailBody {
  to: string;
  subject: string;
  html: string;
  from?: string; // optional override
}

export async function POST(req: NextRequest) {
  let body: SendEmailBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body?.subject || !body?.html) {
    return NextResponse.json(
      { success: false, error: "Required fields: subject, html" },
      { status: 400 }
    );
  }

  // Basic env validation for Resend
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing RESEND_API_KEY environment variable",
      },
      { status: 500 }
    );
  }

  try {
    const to = body.to || process.env.ADMIN_EMAIL; // default to admin when not provided
    if (!to) {
      return NextResponse.json(
        { success: false, error: "Missing 'to' and ADMIN_EMAIL is not set" },
        { status: 400 }
      );
    }
    const from = body.from; // optional; helper has default
    await sendWithResend({ to, subject: body.subject, html: body.html, from });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Email send error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

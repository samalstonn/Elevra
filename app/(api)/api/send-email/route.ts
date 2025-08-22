import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

// Match approve-request route: single Gmail transporter using EMAIL_USER / EMAIL_PASS
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

  if (!body?.to || !body?.subject || !body?.html) {
    return NextResponse.json(
      { success: false, error: "Required fields: to, subject, html" },
      { status: 400 }
    );
  }

  // Basic env validation (avoid runtime send attempt with missing creds)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing EMAIL_USER/EMAIL_PASS environment variables",
      },
      { status: 500 }
    );
  }

  try {
    const from = body.from || process.env.EMAIL_USER;
    await transporter.sendMail({
      from,
      to: body.to,
      subject: body.subject,
      html: body.html,
    });
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

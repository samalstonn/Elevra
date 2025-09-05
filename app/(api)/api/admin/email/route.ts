import { NextRequest, NextResponse } from "next/server";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";

export const runtime = "nodejs";

type AdminEmailPayload = {
  // Defaults to process.env.ADMIN_EMAIL if omitted
  to?: string | string[];
  subject: string;
  // Generic admin notification template params
  template?: "admin-notification";
  data: {
    title?: string;
    intro?: string;
    rows?: { label: string; value: string }[];
    ctaLabel?: string;
    ctaUrl?: string;
    footerNote?: string;
  };
};

export async function POST(req: NextRequest) {
  let body: AdminEmailPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY env var" },
      { status: 500 }
    );
  }

  const to = body.to || process.env.ADMIN_EMAIL;
  if (!to) {
    return NextResponse.json(
      { error: "Missing 'to' and ADMIN_EMAIL is not set" },
      { status: 400 }
    );
  }

  if (!body.subject) {
    return NextResponse.json({ error: "Missing 'subject'" }, { status: 400 });
  }

  const template = body.template || "admin-notification";
  if (template !== "admin-notification") {
    return NextResponse.json(
      { error: `Unknown template: ${template}` },
      { status: 400 }
    );
  }

  const title = body.data.title || "Elevra Admin Notification";
  const html = renderAdminNotification({
    title,
    intro: body.data.intro,
    rows: body.data.rows,
    ctaLabel: body.data.ctaLabel,
    ctaUrl: body.data.ctaUrl,
    footerNote: body.data.footerNote,
  });

  try {
    const result = await sendWithResend({ to, subject: body.subject, html });
    return NextResponse.json({ success: true, id: result?.id || null });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

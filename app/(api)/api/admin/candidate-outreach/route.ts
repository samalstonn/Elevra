import { NextRequest, NextResponse } from "next/server";
import { sendWithResend, isEmailDryRun } from "@/lib/email/resend";
import { renderCandidateOutreach } from "@/lib/email/templates/candidateOutreach";

export const runtime = "nodejs";

type OutreachRow = {
  firstName?: string;
  lastName?: string;
  email: string;
  candidateLink: string;
};

type OutreachPayload = {
  state?: string;
  subject?: string;
  from?: string;
  rows: OutreachRow[];
  scheduledAtIso?: string; // Optional ISO timestamp for scheduling
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  // Header guard using ADMIN_EMAIL_SECRET (matches existing admin email route)
  const configured = process.env.ADMIN_EMAIL_SECRET;
  if (!configured) {
    return NextResponse.json(
      { error: "Missing ADMIN_EMAIL_SECRET env var" },
      { status: 500 }
    );
  }
  const provided = req.headers.get("x-admin-secret");
  if (!provided) {
    return NextResponse.json(
      { error: "Missing x-admin-secret header" },
      { status: 401 }
    );
  }
  if (provided !== configured) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: OutreachPayload;
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

  // Validate payload
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Missing or empty 'rows' in body" },
      { status: 400 }
    );
  }

  // Normalize and validate recipients
  const recipients: OutreachRow[] = [];
  const invalid: { index: number; reason: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || ({} as OutreachRow);
    const email = (r.email || "").trim();
    const candidateLink = (r.candidateLink || "").trim();
    if (!email || !EMAIL_RE.test(email)) {
      invalid.push({ index: i, reason: "Invalid email" });
      continue;
    }
    if (!candidateLink || !/^https?:\/\//i.test(candidateLink)) {
      invalid.push({ index: i, reason: "Invalid CandidateLink (must be URL)" });
      continue;
    }
    recipients.push({
      firstName: (r.firstName || "").trim(),
      lastName: (r.lastName || "").trim(),
      email,
      candidateLink,
    });
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No valid recipients after validation", invalid },
      { status: 400 }
    );
  }

  const state = (body.state || "").trim() || undefined;
  const subject = (
    body.subject || `Your Candidate Profile is Live on Elevra`
  ).trim();
  // Parse schedule time if provided
  let scheduledAt: Date | undefined = undefined;
  if (typeof body.scheduledAtIso === "string" && body.scheduledAtIso.trim()) {
    const d = new Date(body.scheduledAtIso);
    if (!Number.isNaN(d.getTime())) {
      // Only schedule if at least 60s in the future, else send immediately
      const minFuture = Date.now() + 60_000;
      scheduledAt = d.getTime() >= minFuture ? d : undefined;
    }
  }

  // Send sequentially to keep it simple and observable
  const sent: { index: number; email: string; id: string | null }[] = [];
  const failures: { index: number; email: string; error: string }[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    try {
      const html = renderCandidateOutreach({
        candidateFirstName: r.firstName || undefined,
        state,
        claimUrl: r.candidateLink,
      });
      const result = await sendWithResend({
        to: r.email,
        subject,
        html,
        from: body.from,
        scheduledAt,
      });
      sent.push({ index: i, email: r.email, id: result?.id || null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ index: i, email: r.email, error: msg });
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    requested: rows.length,
    valid: recipients.length,
    sent: sent.length,
    failures,
    ids: sent.map((s) => s.id).filter(Boolean),
    dryRun: isEmailDryRun(),
  });
}

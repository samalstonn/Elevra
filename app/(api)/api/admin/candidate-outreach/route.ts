import { NextRequest, NextResponse } from "next/server";
import {
  sendBatchWithResend,
  SendEmailParams,
  isEmailDryRun,
  sendWithResend,
} from "@/lib/email/resend";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import {
  createEmailTemplateRenderContext,
  renderEmailTemplate,
  TemplateKey,
} from "@/lib/email/templates/render";
import { deriveSenderFields } from "@/lib/email/templates/sender";
import prisma from "@/prisma/prisma";
import {
  buildListUnsubscribeHeaders,
  buildUnsubscribeUrl,
  renderUnsubscribeFooter,
  UNSUBSCRIBE_SCOPE,
} from "@/lib/email/unsubscribe";
import { buildClickTrackingUrl } from "@/lib/email/tracking";

export const runtime = "nodejs";

type OutreachRow = {
  firstName?: string;
  lastName?: string;
  email: string;
  candidateLink: string;
  municipality?: string;
  position?: string;
  state?: string;
};

type OutreachPayload = {
  subject?: string;
  from?: string;
  rows: OutreachRow[];
  scheduledAtIso?: string; // Optional ISO timestamp for scheduling
  followup?: boolean; // legacy flag for follow-up
  templateType?: TemplateKey; // preferred selector
  baseTemplate?: TemplateKey; // which base to quote for followups
  composeAsFollowup?: boolean; // if true, send a single follow-up that quotes base
  sequence?: { template: TemplateKey; offsetDays?: number }[]; // optional multi-step sequence
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

  // Identify admin user via Clerk session if available
  // (x-admin-secret is a shared secret and does not identify the user by itself)
  // We log the user ID, name, and email for auditing purposes if available.
  // We also log the requester IP from x-forwarded-for or x-real-ip if available.
  // This helps track who initiated the outreach in case of abuse.
  const forwardedFor = req.headers.get("x-forwarded-for");
  const requesterIp = forwardedFor
    ? forwardedFor.split(",")[0]?.trim() || "unknown"
    : req.headers.get("x-real-ip") || "unknown";

  const authState = getAuth(req);
  const adminUserId = authState?.userId ?? "unknown";
  let adminName = "";
  let adminEmail = "";
  let adminDisplay =
    adminUserId === "unknown"
      ? "Unauthenticated (header secret only)"
      : adminUserId;
  let senderName: string | undefined;
  let senderTitle: string | undefined;
  let senderLinkedInUrl: string | undefined;
  let senderLinkedInLabel: string | undefined;

  if (authState?.userId) {
    try {
      const user = await clerkClient.users.getUser(authState.userId);
      adminName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      adminEmail =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses?.[0]?.emailAddress ??
        "";
      const parts: string[] = [];
      if (adminName) parts.push(adminName);
      if (adminEmail) parts.push(`(${adminEmail})`);
      adminDisplay = parts.length > 0 ? parts.join(" ") : authState.userId;

      const senderFields = deriveSenderFields(user);
      senderName = senderFields.senderName || adminName || senderName;
      senderTitle = senderFields.senderTitle || senderTitle;
      senderLinkedInUrl = senderFields.senderLinkedInUrl || senderLinkedInUrl;
      senderLinkedInLabel =
        senderFields.senderLinkedInLabel || senderLinkedInLabel;
    } catch (error) {
      console.error("Failed to load admin user", error);
      adminDisplay = authState.userId;
    }
  }

  if (!senderName && adminName.trim()) {
    senderName = adminName.trim();
  }
  senderName = senderName?.trim() || undefined;
  senderTitle = senderTitle?.trim() || undefined;
  senderLinkedInUrl = senderLinkedInUrl?.trim() || undefined;
  senderLinkedInLabel = senderLinkedInLabel?.trim() || undefined;
  if (senderLinkedInUrl && !/^https?:\/\//i.test(senderLinkedInUrl)) {
    senderLinkedInUrl = `https://${senderLinkedInUrl}`;
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
      municipality: (r.municipality || "").trim(),
      position: (r.position || "").trim(),
      state: (r.state || "").trim(),
    });
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No valid recipients after validation", invalid },
      { status: 400 }
    );
  }

  const defaultInitialSubject = `Your Election is Live on Elevra`;
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
  const requestedTemplateType =
    typeof body.templateType === "string"
      ? (body.templateType as string).trim()
      : undefined;
  // Filter out previously unsubscribed recipients for candidate-outreach
  const emailList = recipients.map((r) => r.email.toLowerCase());
  const unsubscribed = await prisma.emailUnsubscribe.findMany({
    where: {
      scope: UNSUBSCRIBE_SCOPE,
      email: { in: emailList },
    },
    select: { email: true },
  });
  const unsubSet = new Set(unsubscribed.map((u) => u.email.toLowerCase()));
  const suppressed: OutreachRow[] = [];
  const deliverable: OutreachRow[] = [];
  for (const r of recipients) {
    if (unsubSet.has(r.email.toLowerCase())) suppressed.push(r);
    else deliverable.push(r);
  }
  const selectedType: TemplateKey =
    (requestedTemplateType as TemplateKey) ||
    (body.followup ? "followup" : "initial");
  const hasSequence = Array.isArray(body.sequence) && body.sequence.length > 0;
  const steps: { template: TemplateKey; offsetDays?: number }[] = hasSequence
    ? (body.sequence as { template: TemplateKey; offsetDays?: number }[]).map(
        (step) => ({
          template:
            typeof step.template === "string"
              ? (step.template.trim() as TemplateKey)
              : selectedType,
          offsetDays: step.offsetDays,
        })
      )
    : body.composeAsFollowup
    ? [{ template: "followup", offsetDays: 0 }]
    : [{ template: selectedType, offsetDays: 0 }];

  const renderContext = createEmailTemplateRenderContext();

  for (const step of steps) {
    const batchInputs: SendEmailParams[] = [];
    for (let i = 0; i < deliverable.length; i++) {
      const r = deliverable[i];
      const candidateUrl = r.candidateLink;
      const trackedUrl =
        buildClickTrackingUrl({
          email: r.email,
          scope: UNSUBSCRIBE_SCOPE,
          template: step.template,
          url: candidateUrl,
        }) || candidateUrl;
      let rendered: { subject: string; html: string };
      try {
        rendered = await renderEmailTemplate(
          step.template,
          {
            candidateFirstName: r.firstName || undefined,
            state: r.state || undefined,
            claimUrl: trackedUrl,
            templatesUrl: trackedUrl,
            profileUrl: trackedUrl,
            municipality: r.municipality || undefined,
            position: r.position || undefined,
            senderName,
            senderTitle,
            senderLinkedInUrl,
            senderLinkedInLabel,
          },
          { baseForFollowup: body.baseTemplate || "initial" },
          renderContext
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to render template.";
        failures.push({ index: i, email: r.email, error: message });
        continue;
      }
      const { subject, html } = rendered;
      const subjectToUse = (
        body.subject ||
        subject ||
        defaultInitialSubject
      ).trim();

      // Compute scheduledAt per step (offset from base scheduledAtIso or now)
      let stepScheduledAt = scheduledAt;
      if (step.offsetDays && (scheduledAt || true)) {
        const base = scheduledAt ? scheduledAt : new Date();
        const offsetMs = Math.max(
          0,
          Math.floor(step.offsetDays * 24 * 60 * 60 * 1000)
        );
        const offset = new Date(base.getTime() + offsetMs);
        if (offset.getTime() >= Date.now() + 60_000) {
          stepScheduledAt = offset;
        } else if (!scheduledAt) {
          stepScheduledAt = undefined;
        }
      }

      const unsubscribeUrl = buildUnsubscribeUrl(r.email, UNSUBSCRIBE_SCOPE);
      const headers = buildListUnsubscribeHeaders(unsubscribeUrl);
      const htmlWithFooter =
        html + "\n" + renderUnsubscribeFooter(unsubscribeUrl);
      batchInputs.push({
        to: r.email,
        subject: subjectToUse,
        html: htmlWithFooter,
        from: body.from,
        senderName,
        headers,
        scheduledAt: stepScheduledAt,
      });
    }

    const batchResult = await sendBatchWithResend(batchInputs, {
      stopOnError: false,
    });

    for (const s of batchResult.successes) {
      const recipient = deliverable[s.index];
      sent.push({ index: s.index, email: recipient.email, id: s.id });
    }

    for (const f of batchResult.failures) {
      const recipient = deliverable[f.index];
      failures.push({ index: f.index, email: recipient.email, error: f.error });
    }

    // Send Summary Email to team@elevracommunity.com
    if (batchResult.successes.length > 0 && !isEmailDryRun()) {
      const scheduledWindows = Array.from(
        new Set(
          batchInputs
            .map((input) => input.scheduledAt)
            .filter(Boolean)
            .map((value) =>
              value instanceof Date ? value.toISOString() : value?.toString()
            )
        )
      );
      const scheduleSummary =
        scheduledWindows.length === 0
          ? "Immediate send"
          : scheduledWindows.length === 1
          ? scheduledWindows[0]
          : scheduledWindows.join(", ");

      const summaryLines = [
        `Email outreach step "${step.template}" completed.`,
        `Total recipients in step: ${recipients.length}`,
        `Suppressed (unsubscribed) filtered pre-send: ${suppressed.length}`,
        `Successful deliveries: ${batchResult.successes.length}`,
        `Failures: ${batchResult.failures.length}`,
        `Invalid rows filtered pre-send: ${invalid.length}`,
        `Schedule: ${scheduleSummary}`,
        `Triggered by: ${adminDisplay}`,
        `Admin email: ${adminEmail || "N/A"}`,
        `Clerk user ID: ${adminUserId}`,
        `Requester IP: ${requesterIp}`,
      ];

      const failureDetailsHtml =
        batchResult.failures.length > 0
          ? `<ul>${batchResult.failures
              .map((failure) => {
                const to = Array.isArray(failure.to)
                  ? failure.to.join(", ")
                  : failure.to;
                return `<li><strong>${to}</strong>: ${failure.error}</li>`;
              })
              .join("")}</ul>`
          : "<p>No delivery failures reported.</p>";

      const invalidDetailsHtml =
        invalid.length > 0
          ? `<ul>${invalid
              .map(
                (record) => `
                <li>Row ${record.index + 1}: ${record.reason}</li>
              `
              )
              .join("")}</ul>`
          : "<p>None</p>";

      const suppressedDetailsHtml =
        suppressed.length > 0
          ? `<ul>${suppressed
              .map((s) => `<li><strong>${s.email}</strong></li>`)
              .join("")}</ul>`
          : "<p>None</p>";

      const summaryHtml = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">Candidate Outreach Step Summary</h2>
          <p style="margin: 0 0 12px;">We completed the <strong>${
            step.template
          }</strong> step.</p>
          <table style="border-collapse: collapse; margin: 0 0 16px;">
            <tbody>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Template</td>
                <td style="padding: 4px 8px;">${step.template}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Schedule</td>
                <td style="padding: 4px 8px;">${scheduleSummary}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Total recipients</td>
                <td style="padding: 4px 8px;">${recipients.length}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Suppressed (unsubscribed)</td>
                <td style="padding: 4px 8px;">${suppressed.length}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Successful deliveries</td>
                <td style="padding: 4px 8px;">${
                  batchResult.successes.length
                }</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Failures</td>
                <td style="padding: 4px 8px;">${
                  batchResult.failures.length
                }</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Invalid rows filtered</td>
                <td style="padding: 4px 8px;">${invalid.length}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Triggered by</td>
                <td style="padding: 4px 8px;">${adminDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Admin email</td>
                <td style="padding: 4px 8px;">${adminEmail || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Clerk user ID</td>
                <td style="padding: 4px 8px;">${adminUserId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px; font-weight: 600;">Requester IP</td>
                <td style="padding: 4px 8px;">${requesterIp}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin: 0 0 16px;">
            <h3 style="margin: 0 0 8px;">Failure details</h3>
            ${failureDetailsHtml}
          </div>
          <div>
            <h3 style="margin: 0 0 8px;">Invalid rows filtered</h3>
            ${invalidDetailsHtml}
          </div>
          <div>
            <h3 style="margin: 16px 0 8px;">Suppressed (unsubscribed) addresses</h3>
            ${suppressedDetailsHtml}
          </div>
          <pre style="background: #f6f8fa; border-radius: 6px; padding: 12px; margin: 16px 0 0; white-space: pre-wrap;">${summaryLines.join(
            "\n"
          )}</pre>
        </div>
      `;

      const sentAtIso = new Date().toISOString();
      try {
        await sendWithResend({
          to: "team@elevracommunity.com",
          subject: `[Outreach] ${step.template} summary (${batchResult.successes.length}/${recipients.length}) • ${sentAtIso}`,
          html: summaryHtml,
          from: body.from,
          senderName,
        });
      } catch (err) {
        console.error("Error sending summary email:", err);
      }
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    requested: rows.length,
    valid: recipients.length,
    suppressed: suppressed.length,
    sent: sent.length,
    failures,
    ids: sent.map((s) => s.id).filter(Boolean),
    dryRun: isEmailDryRun(),
  });
}

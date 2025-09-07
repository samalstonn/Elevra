import { Resend } from "resend";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

// Use a safe default for local testing. You can override via RESEND_FROM env.
// For production, set RESEND_FROM to a verified domain address.
const defaultFrom =
  process.env.RESEND_FROM || "Team @Elevra <onboarding@resend.dev>";

export function isEmailDryRun(): boolean {
  // Default to dry‑run in local dev unless explicitly disabled.
  const explicit = process.env.EMAIL_DRY_RUN;
  if (explicit === "1") return true;
  if (explicit === "0") return false;
  return process.env.NODE_ENV === "development";
}

export async function sendWithResend({
  to,
  subject,
  html,
  from,
}: SendEmailParams): Promise<{ id: string } | null> {
  // Dry‑run mode: avoid sending real emails during dev/tests unless overridden.
  if (isEmailDryRun()) {
    const fakeId = `dryrun-${Date.now()}`;
    try {
      // Optionally record for inspection
      if (process.env.EMAIL_DRY_RUN_LOG === "1") {
        const entry = {
          at: new Date().toISOString(),
          to,
          subject,
          from: from || process.env.RESEND_FROM,
        };
        const fs = await import("node:fs/promises");
        await fs.appendFile(".test-emails.log", JSON.stringify(entry) + "\n");
      }
    } catch {}
    return { id: fakeId };
  }
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromAddress = from || defaultFrom;

  const result = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
  });

  const maybeError = (result as { error?: unknown }).error;
  if (maybeError) {
    const err = maybeError as { message?: string; error?: string; name?: string };
    const message =
      err.message || err.error || err.name ||
      (typeof maybeError === "string" ? maybeError : "Unknown Resend error");
    const details = (() => {
      try {
        return JSON.stringify(maybeError);
      } catch {
        return String(maybeError);
      }
    })();
    throw new Error(`${message}${details ? ` | details: ${details}` : ""}`);
  }

  const data = (result as { data?: { id: string } | null }).data ?? null;
  return data;
}

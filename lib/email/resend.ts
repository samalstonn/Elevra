import { CreateEmailOptions, Resend } from "resend";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  // Accept Date (UTC ISO) or ISO string with timezone offset to honor local time
  scheduledAt?: Date | string;
};

// In-process rate limiter: default 2 sends per 1000ms (configurable)
const RL_RATE = (() => {
  const v = Number(process.env.EMAIL_RATE_LIMIT_PER_SEC);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 2;
})();
const MAX_PER_WINDOW = RL_RATE;
const WINDOW_MS = 1500;
let sendTimestamps: number[] = [];

async function enforceRateLimit(): Promise<void> {
  while (true) {
    const now = Date.now();
    sendTimestamps = sendTimestamps.filter((t) => now - t < WINDOW_MS);
    if (sendTimestamps.length < MAX_PER_WINDOW) {
      sendTimestamps.push(now);
      return;
    }
    const oldest = Math.min(...sendTimestamps);
    // Add small jitter (0-50ms) to avoid alignment bursts
    const jitter = Math.floor(Math.random() * 50);
    const waitMs = Math.max(10, WINDOW_MS - (now - oldest) + jitter);
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

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
  scheduledAt,
}: SendEmailParams): Promise<{ id: string } | null> {
  // Global process-level throttle
  await enforceRateLimit();
  // Dry‑run mode: avoid sending real emails during dev/tests unless overridden.
  if (isEmailDryRun()) {
    console.log(`dryrun at ${new Date().toISOString()}`);
    const fakeId = `dryrun-${
      typeof scheduledAt === "string"
        ? scheduledAt
        : (scheduledAt ?? new Date()).toISOString()
    }`;
    try {
      // Optionally record for inspection
      if (process.env.EMAIL_DRY_RUN_LOG === "1") {
        const sendParams: CreateEmailOptions = {
          from: from || defaultFrom,
          to,
          subject,
          html,
        };
        sendParams.scheduledAt = scheduledAt
          ? typeof scheduledAt === "string"
            ? scheduledAt
            : scheduledAt.toISOString()
          : "not scheduled";
        const fs = await import("node:fs/promises");
        await fs.appendFile(
          "lib/email/logs/.test-emails.log",
          `[${new Date().toISOString()}] ${JSON.stringify(sendParams)}\n`
        );
      }
    } catch {}
    return { id: fakeId };
  }
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromAddress = from || defaultFrom;
  const sendParams: CreateEmailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    replyTo: process.env.ADMIN_EMAIL,
  };

  if (scheduledAt) {
    sendParams.scheduledAt =
      typeof scheduledAt === "string" ? scheduledAt : scheduledAt.toISOString();
  }

  const result = await resend.emails.send(sendParams);

  const maybeError = (result as { error?: unknown }).error;
  if (maybeError) {
    const err = maybeError as {
      message?: string;
      error?: string;
      name?: string;
    };
    const message =
      err.message ||
      err.error ||
      err.name ||
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

import { CreateEmailOptions, Resend } from "resend";

export type EmailAttachment = {
  filename: string;
  path?: string | URL;
  content?: string;
  mimeType?: string;
};

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  senderName?: string;
  headers?: Record<string, string>;
  // Accept Date (UTC ISO) or ISO string with timezone offset to honor local time
  scheduledAt?: Date | string;
  attachments?: EmailAttachment[];
};

export type SendEmailBatchResult = {
  requested: number;
  successes: Array<{ index: number; to: string | string[]; id: string | null }>;
  failures: Array<{ index: number; to: string | string[]; error: string }>;
  dryRun: boolean;
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

// Format sender address with custom name when provided
function formatSenderAddress(senderName?: string, customFrom?: string): string {
  if (customFrom) {
    return customFrom;
  }

  if (senderName && senderName.trim()) {
    const cleanName = senderName.trim();
    // Validate that the name doesn't contain problematic characters
    if (/^[a-zA-Z\s\-\.]+$/.test(cleanName)) {
      return `${cleanName} <team@admin.elevracommunity.com>`;
    }
  }

  return defaultFrom;
}

function normalizeAttachment(item: EmailAttachment) {
  const normalized: {
    filename: string;
    path?: string;
    content?: string;
    mime_type?: string;
  } = {
    filename: item.filename,
  };
  if (item.path) {
    normalized.path =
      typeof item.path === "string" ? item.path : item.path.toString();
  }
  if (item.content) {
    normalized.content = item.content;
  }
  if (item.mimeType) {
    normalized.mime_type = item.mimeType;
  }
  return normalized;
}

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
  senderName,
  scheduledAt,
  attachments,
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
        const sendParams: CreateEmailOptions & {
          headers?: Record<string, string>;
        } = {
          from: formatSenderAddress(senderName, from),
          to,
          subject,
          html,
          attachments: attachments?.map(normalizeAttachment),
        };
        if (!sendParams.attachments?.length) {
          delete (sendParams as { attachments?: unknown }).attachments;
        }
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
  const fromAddress = formatSenderAddress(senderName, from);
  const sendParams: CreateEmailOptions & { headers?: Record<string, string> } =
    {
      from: fromAddress,
      to,
      subject,
      html,
      replyTo: process.env.ADMIN_EMAIL,
      attachments: attachments?.map(normalizeAttachment),
    };
  if (!sendParams.attachments?.length) {
    delete (sendParams as { attachments?: unknown }).attachments;
  }

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

export async function sendBatchWithResend(
  items: SendEmailParams[],
  opts?: { stopOnError?: boolean }
): Promise<SendEmailBatchResult> {
  const requested = items.length;
  const successes: SendEmailBatchResult["successes"] = [];
  const failures: SendEmailBatchResult["failures"] = [];

  if (requested === 0) {
    return { requested, successes, failures, dryRun: isEmailDryRun() };
  }

  if (isEmailDryRun()) {
    const now = Date.now();
    items.forEach((item, index) => {
      successes.push({
        index,
        to: item.to,
        id: `dryrun-batch-${now}-${index}`,
      });
    });
    return { requested, successes, failures, dryRun: true };
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  const API_ENDPOINT = "https://api.resend.com/emails/batch";
  const MAX_BATCH_SIZE = 100;

  const sendChunk = async (
    chunk: SendEmailParams[],
    offset: number
  ): Promise<void> => {
    await enforceRateLimit();

    const emailsPayload = chunk.map((payload) => {
      const fromAddress = formatSenderAddress(payload.senderName, payload.from);
      const scheduledAtIso = payload.scheduledAt
        ? typeof payload.scheduledAt === "string"
          ? payload.scheduledAt
          : payload.scheduledAt.toISOString()
        : undefined;
      const entry: Record<string, unknown> = {
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      };
      if (process.env.ADMIN_EMAIL) {
        entry.reply_to = process.env.ADMIN_EMAIL;
      }
      if (payload.headers && Object.keys(payload.headers).length > 0) {
        entry.headers = payload.headers;
      }
      if (scheduledAtIso) {
        entry.scheduled_at = scheduledAtIso;
      }
      return entry;
    });

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailsPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      const message = `Resend batch failed (${response.status}): ${text}`;
      throw new Error(message);
    }

    type ResendBatchResponse =
      | Array<{ id?: string | null }>
      | {
          data?: Array<{ id?: string | null }> | null;
          errors?: Array<{ message?: string; code?: string }> | null;
        };

    const json = (await response.json()) as ResendBatchResponse;
    const dataEntries = Array.isArray(json)
      ? json
      : Array.isArray(json.data)
      ? json.data
      : [];
    const errorEntries = Array.isArray(json)
      ? []
      : Array.isArray(json.errors)
      ? json.errors
      : [];

    for (let i = 0; i < chunk.length; i++) {
      const globalIndex = offset + i;
      const item = items[globalIndex];
      const dataEntry = dataEntries[i];
      const errorEntry = errorEntries[i];

      if (dataEntry && dataEntry.id) {
        successes.push({ index: globalIndex, to: item.to, id: dataEntry.id });
        continue;
      }

      if (errorEntry) {
        const messageParts = [] as string[];
        if (errorEntry.message) messageParts.push(errorEntry.message);
        if (errorEntry.code) messageParts.push(`[${errorEntry.code}]`);
        const message =
          messageParts.length > 0
            ? messageParts.join(" ")
            : JSON.stringify(errorEntry);
        failures.push({ index: globalIndex, to: item.to, error: message });
        continue;
      }

      successes.push({
        index: globalIndex,
        to: item.to,
        id: dataEntry?.id ?? null,
      });
    }
  };

  for (let offset = 0; offset < items.length; offset += MAX_BATCH_SIZE) {
    const chunk = items.slice(offset, offset + MAX_BATCH_SIZE);
    try {
      await sendChunk(chunk, offset);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      for (let i = 0; i < chunk.length; i++) {
        const globalIndex = offset + i;
        const item = items[globalIndex];
        failures.push({ index: globalIndex, to: item.to, error: message });
      }
      if (opts?.stopOnError) {
        break;
      }
    }
  }

  return {
    requested,
    successes,
    failures,
    dryRun: false,
  };
}

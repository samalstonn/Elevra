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

export async function sendWithResend({
  to,
  subject,
  html,
  from,
}: SendEmailParams): Promise<{ id: string } | null> {
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

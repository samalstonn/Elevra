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
  process.env.RESEND_FROM || "Elevra Community <onboarding@resend.dev>";

export async function sendWithResend({
  to,
  subject,
  html,
  from,
}: SendEmailParams) {
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

  const maybeError = (result as any)?.error;
  if (maybeError) {
    const message =
      (maybeError && (maybeError.message || maybeError.error || maybeError.name)) ||
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

  return result.data;
}

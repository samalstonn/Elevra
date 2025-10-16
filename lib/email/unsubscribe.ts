import crypto from "node:crypto";

const DEFAULT_SCOPE = "candidate-outreach" as const;

function getAppBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  if (!base) return "";
  return base.replace(/\/$/, "");
}

function requireSecret(): string {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("Missing EMAIL_UNSUBSCRIBE_SECRET env var");
  }
  return secret;
}

export function signUnsubscribeToken(email: string, scope: string = DEFAULT_SCOPE): string {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const normalizedScope = (scope || DEFAULT_SCOPE).trim();
  const h = crypto.createHmac("sha256", requireSecret());
  h.update(`${normalizedEmail}\n${normalizedScope}`);
  return h.digest("base64url");
}

export function verifyUnsubscribeToken(
  token: string,
  email: string,
  scope: string = DEFAULT_SCOPE
): boolean {
  try {
    const expected = signUnsubscribeToken(email, scope);
    // timing-safe comparison
    const a = Buffer.from(token || "", "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(email: string, scope: string = DEFAULT_SCOPE): string | null {
  const base = getAppBaseUrl();
  if (!base) return null;
  const normalizedEmail = (email || "").trim();
  const normalizedScope = (scope || DEFAULT_SCOPE).trim();
  const token = signUnsubscribeToken(normalizedEmail, normalizedScope);
  const url = new URL("/api/unsubscribe", base);
  url.searchParams.set("email", normalizedEmail);
  url.searchParams.set("scope", normalizedScope);
  url.searchParams.set("token", token);
  return url.toString();
}

export function renderUnsubscribeFooter(unsubUrl: string | null): string {
  const link = unsubUrl
    ? `<a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>`
    : "Unsubscribe";
  return `
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
  <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
    You’re receiving this because your email appears in public candidate listings. ${link} from Elevra candidate outreach.
  </p>`;
}

export function buildListUnsubscribeHeaders(unsubUrl: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (unsubUrl) {
    headers["List-Unsubscribe"] = `<${unsubUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  return headers;
}

export const UNSUBSCRIBE_SCOPE: string = DEFAULT_SCOPE;

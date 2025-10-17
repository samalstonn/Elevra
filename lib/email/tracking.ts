import crypto from "node:crypto";

function getBase(): string | null {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  if (!base) return null;
  return base.replace(/\/$/, "");
}

function getSecret(): string | null {
  // Allow dedicated tracking secret, else fall back to unsubscribe secret.
  return (
    process.env.EMAIL_TRACKING_SECRET || process.env.EMAIL_UNSUBSCRIBE_SECRET || null
  );
}

export type TrackingPayload = {
  email: string;
  scope: string; // e.g., candidate-outreach
  template?: string; // initial, followup, etc
  url: string; // final destination (http/https)
};

export function safeNormalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

function sign(payload: TrackingPayload): string {
  const secret = getSecret();
  if (!secret) throw new Error("Missing EMAIL_TRACKING_SECRET or EMAIL_UNSUBSCRIBE_SECRET");
  const email = payload.email.trim().toLowerCase();
  const scope = payload.scope.trim();
  const url = payload.url.trim();
  const template = (payload.template || "").trim();
  const h = crypto.createHmac("sha256", secret);
  h.update(`${email}\n${scope}\n${url}\n${template}`);
  return h.digest("base64url");
}

export function buildClickTrackingUrl(payload: TrackingPayload): string | null {
  const base = getBase();
  const url = safeNormalizeUrl(payload.url);
  if (!base || !url) return null;
  const token = sign({ ...payload, url });
  const u = new URL("/api/track/click", base);
  u.searchParams.set("e", payload.email.trim());
  u.searchParams.set("s", payload.scope.trim());
  if (payload.template) u.searchParams.set("k", payload.template.trim());
  u.searchParams.set("u", Buffer.from(url).toString("base64url"));
  u.searchParams.set("t", token);
  return u.toString();
}

export function verifyClickParams(params: URLSearchParams): {
  ok: boolean;
  email?: string;
  scope?: string;
  template?: string;
  url?: string;
} {
  try {
    const email = (params.get("e") || "").trim();
    const scope = (params.get("s") || "").trim();
    const template = (params.get("k") || "").trim();
    const uEnc = (params.get("u") || "").trim();
    const token = (params.get("t") || "").trim();
    if (!email || !scope || !uEnc || !token) return { ok: false };
    const url = Buffer.from(uEnc, "base64url").toString("utf8");
    const normalized = safeNormalizeUrl(url);
    if (!normalized) return { ok: false };
    const expected = sign({ email, scope, template, url: normalized });
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false };
    }
    return { ok: true, email, scope, template, url: normalized };
  } catch {
    return { ok: false };
  }
}


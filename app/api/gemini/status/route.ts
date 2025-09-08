export const dynamic = "force-dynamic";

export async function GET() {
  const isProd = process.env.NODE_ENV === "production";
  const geminiEnabled = process.env.GEMINI_ENABLED
    ? process.env.GEMINI_ENABLED === "true"
    : isProd; // enabled by default in prod
  const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  return Response.json({
    geminiEnabled,
    model,
    hasApiKey,
    env: process.env.NODE_ENV,
  });
}


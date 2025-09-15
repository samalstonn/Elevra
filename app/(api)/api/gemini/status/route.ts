export const dynamic = "force-dynamic";

export async function GET() {
  const isProd = process.env.NODE_ENV === "production";
  const geminiEnabled = process.env.GEMINI_ENABLED
    ? process.env.GEMINI_ENABLED === "true"
    : isProd; // default: enabled in prod, disabled elsewhere
  const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";
  return Response.json({ geminiEnabled, model });
}


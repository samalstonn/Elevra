import { NextRequest } from "next/server";
import { runGeminiDispatcher } from "@/lib/gemini/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.GEMINI_CRON_SECRET;
  if (secret) {
    const header = req.headers.get("x-cron-secret");
    if (!header || header !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const stats = await runGeminiDispatcher({
    maxJobs: Number(body?.maxJobs) || undefined,
    timeBudgetMs: Number(body?.timeBudgetMs) || undefined,
  });

  return Response.json({ ok: true, stats });
}

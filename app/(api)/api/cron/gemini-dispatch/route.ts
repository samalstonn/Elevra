import { NextRequest } from "next/server";
import { runGeminiDispatcher } from "@/lib/gemini/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(req: NextRequest): boolean {
  const secret = process.env.GEMINI_CRON_SECRET;
  if (!secret) return true;

  const candidate =
    req.headers.get("x-cron-secret") ?? req.headers.get("authorization");
  if (!candidate) return false;
  if (candidate.startsWith("Bearer ")) {
    return candidate.slice(7) === secret;
  }
  return candidate === secret;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const stats = await runGeminiDispatcher({
    maxJobs: Number(body?.maxJobs) || undefined,
    timeBudgetMs: Number(body?.timeBudgetMs) || undefined,
  });

  return Response.json({ ok: true, stats });
}

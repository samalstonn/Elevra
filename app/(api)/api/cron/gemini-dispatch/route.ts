import { NextRequest } from "next/server";
import { runGeminiDispatcher } from "@/lib/gemini/dispatcher";
import { hasDispatchableJobs } from "@/lib/gemini/queue";

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

async function handle(req: NextRequest) {
  if (!authorize(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  if (!force && !(await hasDispatchableJobs())) {
    console.info("[cron] gemini-dispatch skip (queue empty)", {
      method: req.method,
    });
    return Response.json({
      ok: true,
      skipped: true,
      reason: "queue-empty",
      stats: {
        attempted: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        rateLimited: 0,
        staleResets: 0,
      },
    });
  }

  const body = await req.json().catch(() => ({}));
  const stats = await runGeminiDispatcher({
    maxJobs:
      typeof body?.maxJobs === "number"
        ? body.maxJobs
        : typeof body?.maxJobs === "string"
        ? Number.parseInt(body.maxJobs, 10)
        : undefined,
    timeBudgetMs:
      typeof body?.timeBudgetMs === "number"
        ? body.timeBudgetMs
        : typeof body?.timeBudgetMs === "string"
        ? Number.parseInt(body.timeBudgetMs, 10)
        : undefined,
  });

  console.info("[cron] gemini-dispatch run", {
    method: req.method,
    stats,
  });

  return Response.json({ ok: true, stats });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

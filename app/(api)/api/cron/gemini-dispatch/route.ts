import { NextRequest } from "next/server";
import { runGeminiDispatcher } from "@/lib/gemini/dispatcher";
import { hasDispatchableJobs } from "@/lib/gemini/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(req: NextRequest): boolean {
  const secrets = [
    process.env.GEMINI_CRON_SECRET,
    process.env.CRON_SECRET,
    process.env.VERCEL_CRON_SECRET,
  ].filter(Boolean) as string[];
  if (secrets.length === 0) return true;

  const candidates: string[] = [];
  const cronHeader = req.headers.get("x-cron-secret");
  if (cronHeader) {
    candidates.push(cronHeader.trim());
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const trimmed = authHeader.trim();
    candidates.push(trimmed);
    if (/^bearer\s+/i.test(trimmed)) {
      candidates.push(trimmed.replace(/^bearer\s+/i, "").trim());
    }
  }
  if (candidates.length === 0) return false;

  return secrets.some((secret) => candidates.includes(secret));
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

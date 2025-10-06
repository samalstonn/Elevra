import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const rawId = params.id;
  const idValue = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number(idValue);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid batch id" }, { status: 400 });
  }

  const job = await prisma.geminiBatchJob.findUnique({
    where: { id },
    include: {
      groups: { orderBy: { order: "asc" } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const { groups, ...jobData } = job;
  return NextResponse.json({
    job: jobData,
    groups,
  });
}

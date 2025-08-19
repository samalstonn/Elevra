import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// Returns last 30 days (inclusive) of daily profile view counts for a candidate
export async function GET(request: Request) {
  const url = new URL(request.url);
  const candidateID = url.searchParams.get("candidateID");
  const daysParam = url.searchParams.get("days");

  if (!candidateID || isNaN(Number(candidateID))) {
    return NextResponse.json(
      { error: "Invalid or missing candidateID parameter" },
      { status: 400 }
    );
  }

  const days =
    daysParam && !isNaN(Number(daysParam))
      ? Math.min(Number(daysParam), 120)
      : 30; // cap
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);

  const views = await prisma.candidateProfileView.findMany({
    where: {
      candidateId: Number(candidateID),
      viewedAt: { gte: start },
    },
    select: { viewedAt: true },
  });

  // Aggregate by YYYY-MM-DD
  const counts: Record<string, number> = {};
  for (const v of views) {
    const d = new Date(v.viewedAt);
    const key = d.toISOString().slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  }

  // Build full range including zeros
  const data: { date: string; views: number }[] = [];
  let totalViews = 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = counts[key] || 0;
    totalViews += count;
    data.push({ date: key, views: count });
  }

  return NextResponse.json({ data, totalViews });
}

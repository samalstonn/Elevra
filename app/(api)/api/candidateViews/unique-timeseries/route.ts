import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// Returns last N days of daily unique visitor counts (by viewerIp) for a candidate
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
      : 30; // cap to keep payload small

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);

  // Fetch only fields needed
  const views = await prisma.candidateProfileView.findMany({
    where: {
      candidateId: Number(candidateID),
      viewedAt: { gte: start },
    },
    select: { viewedAt: true, viewerIp: true },
  });

  // Aggregate by day -> set of unique IPs (ignore null/empty IPs)
  const dayToIps = new Map<string, Set<string>>();
  const allIps = new Set<string>();
  for (const v of views) {
    const d = new Date(v.viewedAt);
    const key = d.toISOString().slice(0, 10);
    const ip = (v.viewerIp || "").trim();
    if (!dayToIps.has(key)) dayToIps.set(key, new Set());
    if (ip) {
      dayToIps.get(key)!.add(ip);
      allIps.add(ip);
    }
  }

  // Build full range including zeros
  const data: { date: string; uniqueVisitors: number }[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = dayToIps.get(key)?.size ?? 0;
    data.push({ date: key, uniqueVisitors: count });
  }

  return NextResponse.json({
    data,
    totalUniqueVisitors: allIps.size,
    days,
  });
}


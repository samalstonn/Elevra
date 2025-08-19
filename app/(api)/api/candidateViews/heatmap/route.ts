import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export const dynamic = "force-dynamic";

// Returns a 7x24 day-of-week (0=Sun) by hour (0-23) matrix of view counts for the given candidate
// Query params: candidateID (required), days (optional, default 30, max 120)
export async function GET(request: Request) {
  try {
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
        : 30;

    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0); // normalize to midnight UTC
    start.setUTCDate(start.getUTCDate() - days);

    const views = await prisma.candidateProfileView.findMany({
      where: {
        candidateId: Number(candidateID),
        viewedAt: { gte: start },
      },
      select: { viewedAt: true },
    });

    // Initialize 7 x 24 matrix
    const matrix: number[][] = Array.from({ length: 7 }, () =>
      Array(24).fill(0)
    );
    let max = 0;
    for (const v of views) {
      const d = new Date(v.viewedAt);
      // Using local time for readability to candidate
      const day = d.getDay(); // 0=Sunday
      const hour = d.getHours();
      matrix[day][hour] += 1;
      if (matrix[day][hour] > max) max = matrix[day][hour];
    }

    return NextResponse.json({ matrix, max, days });
  } catch (e: any) {
    console.error("/api/candidateViews/heatmap error", e);
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

interface BreakdownItem {
  candidateId: number;
  name: string | null;
  views: number;
}

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

  const candidateId = Number(candidateID);
  const maxDays = 120;
  const days =
    daysParam && !isNaN(Number(daysParam))
      ? Math.min(Number(daysParam), maxDays)
      : 30;

  const now = new Date();
  const startWindow = new Date(now);
  startWindow.setHours(0, 0, 0, 0);
  startWindow.setDate(startWindow.getDate() - days);

  const electionLinks = await prisma.electionLink.findMany({
    where: { candidateId },
    select: { electionId: true },
  });

  const electionIds = Array.from(
    new Set(electionLinks.map((link) => link.electionId))
  );

  if (electionIds.length === 0) {
    return NextResponse.json({
      totalViews: 0,
      candidateCount: 0,
      candidateBreakdown: [],
      electionIds: [],
    });
  }

  const competitors = await prisma.electionLink.findMany({
    where: {
      electionId: { in: electionIds },
      candidateId: { not: candidateId },
      candidate: { hidden: false },
    },
    select: {
      candidateId: true,
      candidate: {
        select: {
          name: true,
        },
      },
    },
  });

  const competitorIds = Array.from(
    new Set(competitors.map((link) => link.candidateId))
  );

  if (competitorIds.length === 0) {
    return NextResponse.json({
      totalViews: 0,
      candidateCount: 0,
      candidateBreakdown: [],
      electionIds,
    });
  }

  const nameMap = new Map<number, string | null>();
  for (const competitor of competitors) {
    if (!nameMap.has(competitor.candidateId)) {
      nameMap.set(competitor.candidateId, competitor.candidate?.name ?? null);
    }
  }

  const viewGroups = await prisma.candidateProfileView.groupBy({
    by: ["candidateId"],
    where: {
      candidateId: { in: competitorIds },
      viewedAt: { gte: startWindow },
    },
    _count: { candidateId: true },
  });

  const viewMap = new Map<number, number>();
  for (const group of viewGroups) {
    viewMap.set(group.candidateId, group._count.candidateId);
  }

  const breakdown: BreakdownItem[] = competitorIds.map((id) => ({
    candidateId: id,
    name: nameMap.get(id) ?? null,
    views: viewMap.get(id) ?? 0,
  }));

  const totalViews = breakdown.reduce((sum, item) => sum + item.views, 0);

  return NextResponse.json({
    totalViews,
    candidateCount: competitorIds.length,
    candidateBreakdown: breakdown,
    electionIds,
    days,
  });
}

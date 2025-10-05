import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { lookupLocationForIp } from "@/lib/ipLocation";

type LocationSummaryItem = {
  location: string;
  views: number;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  source: "ipinfo" | "private" | "unknown";
};

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

  const views = await prisma.candidateProfileView.findMany({
    where: {
      candidateId,
      viewedAt: { gte: startWindow },
    },
    select: {
      viewerIp: true,
    },
  });

  if (views.length === 0) {
    return NextResponse.json({
      totalViews: 0,
      uniqueLocations: 0,
      locations: [],
      days,
    });
  }

  const ipCounts = new Map<string, { raw: string | null; count: number }>();

  for (const view of views) {
    const raw = view.viewerIp ?? null;
    const normalized = raw?.split(",")[0]?.trim();
    const key = normalized && normalized.length > 0 ? normalized : "__unknown__";
    const existing = ipCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      ipCounts.set(key, { raw, count: 1 });
    }
  }

  const locationCounts = new Map<string, LocationSummaryItem>();

  const lookups = await Promise.all(
    Array.from(ipCounts.values()).map(async ({ raw, count }) => {
      const location = await lookupLocationForIp(raw ?? undefined);
      return { location, count };
    })
  );

  for (const { location, count } of lookups) {
    const key = location.label;
    const existing = locationCounts.get(key);
    if (existing) {
      existing.views += count;
      continue;
    }
    locationCounts.set(key, {
      location: location.label,
      views: count,
      city: location.city ?? null,
      region: location.region ?? null,
      country: location.country ?? null,
      source: location.source,
    });
  }

  const locations = Array.from(locationCounts.values()).sort(
    (a, b) => b.views - a.views
  );

  return NextResponse.json({
    totalViews: views.length,
    uniqueLocations: locations.length,
    locations,
    days,
  });
}

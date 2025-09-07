import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "http://universities.hipolabs.com/search" as const;

// Must be a numeric literal for Next.js config parsing
export const revalidate = 86400; // 24 hours

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? undefined;
  const country = searchParams.get("country") ?? undefined;

  // Avoid upstream call and return empty when no filters provided
  if (!name && !country) {
    return NextResponse.json([], {
      headers: {
        "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
      },
    });
  }

  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (country) params.set("country", country);

  const upstream = `${BASE_URL}?${params.toString()}`;

  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
      // Pass through caching hints to Next's fetch caching layer
      next: { revalidate },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream failed: ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as Array<Record<string, unknown>>;

    // Normalize basic fields so downstream UI can rely on them.
    const normalized = Array.isArray(data)
      ? data.map((u) => {
          const stateProvince = u["state-province"] as string | null | undefined;
          return {
            ...u,
            domains: (u["domains"] as unknown[] | undefined) ?? [],
            web_pages: (u["web_pages"] as unknown[] | undefined) ?? [],
            // Some results only provide `state-province`; surface a `state` fallback
            state:
              (u["state"] as string | null | undefined) ?? stateProvince ?? null,
            city: (u["city"] as string | null | undefined) ?? null,
            "state-province": stateProvince ?? null,
          };
        })
      : [];

    return NextResponse.json(normalized, {
      headers: {
        "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
      },
    });
  } catch (err) {
    console.error("[api/universities] upstream fetch failed", err);
    return NextResponse.json(
      { error: "Failed to fetch universities" },
      { status: 500 }
    );
  }
}

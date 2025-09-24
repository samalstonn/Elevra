import { NextResponse } from "next/server";
import { resolveSemanticRoute } from "@/lib/semantic-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseQueryParam(url: URL, key: string): string | undefined {
  const value = url.searchParams.get(key);
  return value != null && value.trim() !== "" ? value : undefined;
}

async function handleResolve(
  query: string,
  debug: boolean
) {
  const result = await resolveSemanticRoute(query, { debug });
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseQueryParam(url, "query");
  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }
  const debug = parseQueryParam(url, "debug") === "1";
  try {
    return await handleResolve(query, debug);
  } catch (error) {
    console.error("semantic-route GET failed", error);
    return NextResponse.json(
      { error: "Failed to resolve route" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string; debug?: boolean };
    if (!body?.query || body.query.trim() === "") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }
    const debug = Boolean(body.debug);
    return await handleResolve(body.query, debug);
  } catch (error) {
    console.error("semantic-route POST failed", error);
    return NextResponse.json(
      { error: "Failed to resolve route" },
      { status: 500 }
    );
  }
}

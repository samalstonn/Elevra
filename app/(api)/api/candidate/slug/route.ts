// app/(api)/api/candidate/slug/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Candidate slug is required" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: {
        slug: slug,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error fetching candidate by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
      { status: 500 }
    );
  }
}

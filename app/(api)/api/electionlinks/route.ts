// app/(api)/api/electionlinks/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const candidateIdParam = searchParams.get("candidateId");
  if (!candidateIdParam) {
    return NextResponse.json(
      { error: "candidateId query param is required" },
      { status: 400 }
    );
  }
  const candidateId = parseInt(candidateIdParam, 10);
  try {
    const links = await prisma.electionLink.findMany({
      where: { candidateId },
      include: { election: true },
    });
    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching election links:", error);
    return NextResponse.json(
      { error: "Failed to fetch election links" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { candidateId, electionId, profile } = await request.json();
    if (typeof candidateId !== "number" || typeof electionId !== "number") {
      return NextResponse.json(
        { error: "candidateId and electionId must be numbers" },
        { status: 400 }
      );
    }
    // Provide defaults for required fields
    const defaults = {
      party: "",
    };
    const data = {
      candidateId,
      electionId,
      ...defaults,
      ...(profile || {}),
    };
    const link = await prisma.electionLink.create({ data });
    return NextResponse.json(link);
  } catch (error) {
    console.error("Error creating election link:", error);
    return NextResponse.json(
      { error: "Failed to create election link" },
      { status: 500 }
    );
  }
}

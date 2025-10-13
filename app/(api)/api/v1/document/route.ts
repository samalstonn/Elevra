import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";

// GET /api/v1/document?candidateId=number&electionId=number
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const candidateIdParam = searchParams.get("candidateId");
    const electionIdParam = searchParams.get("electionId");

    const candidateId = candidateIdParam ? Number(candidateIdParam) : NaN;
    const electionId = electionIdParam ? Number(electionIdParam) : NaN;

    if (!Number.isFinite(candidateId) || !Number.isFinite(electionId)) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // Ensure the authenticated user owns this candidate
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, clerkUserId: userId },
      select: { id: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const doc = await prisma.document.findUnique({
      where: { candidateId_electionId: { candidateId, electionId } },
      select: {
        id: true,
        contentJson: true,
        contentHtml: true,
        updatedAt: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      id: doc.id,
      json: doc.contentJson,
      html: doc.contentHtml,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/document
// Body: { candidateId: number, electionId: number, json: any, html: string }
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { candidateId, electionId, json, html } = body ?? {};

    if (
      typeof candidateId !== "number" ||
      typeof electionId !== "number" ||
      typeof html !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Ensure the authenticated user owns this candidate
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, clerkUserId: userId },
      select: { id: true, slug: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure the composite link exists (Candidate is joined to Election)
    const link = await prisma.electionLink.findUnique({
      where: { candidateId_electionId: { candidateId, electionId } },
      select: { candidateId: true, electionId: true },
    });
    if (!link) {
      return NextResponse.json(
        { error: "Election link not found for candidate" },
        { status: 404 }
      );
    }

    // Upsert the document
    await prisma.document.upsert({
      where: { candidateId_electionId: { candidateId, electionId } },
      create: {
        candidateId,
        electionId,
        contentJson: json ?? {},
        contentHtml: html,
        candidateSlug: candidate.slug,
        clerkUserId: userId,
      },
      update: {
        contentJson: json ?? {},
        contentHtml: html,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


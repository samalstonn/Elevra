import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clerkUserId = searchParams.get("clerkUserId");

  if (!clerkUserId) {
    return NextResponse.json(
      { error: "Missing clerkUserId parameter" },
      { status: 400 }
    );
  }

  try {
    // Find the candidate by Clerk user ID, including endorsements
    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId },
      include: {
        endorsements: {
          select: {
            id: true,
            endorserName: true,
            relationshipDescription: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const totalEndorsements = candidate.endorsements.length;

    const res = NextResponse.json({
      clerkUserId,
      totalEndorsements,
      endorsements: candidate.endorsements,
    });

    console.log("[GET_CANDIDATE_ENDORSEMENTS]", {
      clerkUserId,
      totalEndorsements,
    });
    return res;
  } catch (error) {
    console.error("[GET_CANDIDATE_ENDORSEMENTS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { endorsementId, clerkUserId } = await request.json();
  if (!endorsementId || !clerkUserId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Verify ownership
  const existing = await prisma.endorsement.findUnique({
    where: { id: endorsementId },
  });
  if (!existing || existing.clerkUserId !== clerkUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.endorsement.update({
    where: { id: endorsementId },
    data: { hidden: true },
  });
  return NextResponse.json({ success: true });
}

// app/(api)/api/candidate/endorsements/route.ts
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

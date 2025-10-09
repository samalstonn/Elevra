import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {
  buildSuggestedCandidateWhere,
  suggestedCandidateOrderBy,
} from "@/lib/suggestedCandidates";

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      where: buildSuggestedCandidateWhere(),
      orderBy: suggestedCandidateOrderBy,
      select: {
        id: true,
        name: true,
        slug: true,
        verified: true,
        currentRole: true,
        photo: true,
        clerkUserId: true,
        elections: {
          select: {
            election: {
              select: {
                id: true,
                city: true,
                state: true,
                date: true,
                position: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Error fetching suggested candidates:", error);
    return NextResponse.json(
      { error: "Error fetching suggested candidates" },
      { status: 500 }
    );
  }
}

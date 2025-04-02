import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const {
      candidateId,
      name,
      position,
      party,
      bio,
      website,
      linkedin,
      additionalNotes,
      city,
      state,
      policies,
      electionId,
    } = body;

    // Validate required fields
    if (
      !candidateId ||
      !name ||
      !position ||
      !party ||
      !bio ||
      !city ||
      !state
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the candidate to verify ownership
    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(candidateId) },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if the current user is the owner of this candidate profile
    if (candidate.clerkUserId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to edit this candidate" },
        { status: 403 }
      );
    }

    // Update the candidate
    const updatedCandidate = await prisma.candidate.update({
      where: { id: Number(candidateId) },
      data: {
        name,
        position,
        party,
        bio,
        website: website || null,
        linkedin: linkedin || null,
        additionalNotes: additionalNotes || null,
        city,
        state,
        policies: policies || [],
        // Only update electionId if provided
        ...(electionId ? { electionId: Number(electionId) } : {}),
        // Keep existing fields
        photo: candidate.photo,
        status: candidate.status,
        sources: candidate.sources,
        donations: candidate.donations,
        history: candidate.history,
      },
    });

    return NextResponse.json({
      success: true,
      candidate: updatedCandidate,
    });
  } catch (error: any) {
    console.error("Error updating candidate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update candidate" },
      { status: 500 }
    );
  }
}

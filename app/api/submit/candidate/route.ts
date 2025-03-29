import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Extract the data
    const { 
      name,
      party,
      position,
      bio,
      website,
      twitter,
      linkedin,
      city,
      state,
      additionalNotes,
      policies,
      electionId,
      clerkUserId
    } = body;

    // Validate required fields
    if (!name || !party || !position || !bio || !city || !state || !policies || policies.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate policies array
    if (!Array.isArray(policies) || policies.length > 5) {
      return NextResponse.json(
        { error: "Policies must be an array with at most 5 items" },
        { status: 400 }
      );
    }

    // Create the candidate submission in the database
    const candidateSubmission = await prisma.candidateSubmission.create({
      data: {
        name,
        party,
        position,
        bio,
        website: website || null,
        twitter: twitter || null,
        linkedin: linkedin || null,
        city,
        state,
        additionalNotes: additionalNotes || null,
        policies,
        electionId: electionId || null,
        status: "PENDING",
        clerkUserId: clerkUserId || null,
      }
    });

    return NextResponse.json({
      success: true,
      candidateSubmission
    });

  } catch (error) {
    console.error("Error submitting candidate:", error);
    return NextResponse.json(
      { error: "Failed to submit candidate information" },
      { status: 500 }
    );
  }
}
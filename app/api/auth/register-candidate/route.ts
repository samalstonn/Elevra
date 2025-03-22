import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    // Get auth session to verify clerk user ID
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Parse request body
    const body = await request.json();
    const {
      clerkUserId,
      name,
      email,
      phone,
      city,
      state,
      position,
      website,
      linkedin,
      twitter,
    } = body;

    // Validate clerkUserId matches authenticated user
    if (userId !== clerkUserId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Check if candidate with clerkUserId already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { clerkUserId },
    });

    if (existingCandidate) {
      return NextResponse.json(
        { error: "Candidate already registered with this account" },
        { status: 400 }
      );
    }

    // Create new candidate - note that we're creating a basic candidate record
    // A more complete implementation would include selecting the election or 
    // creating a UserValidationRequest for admin verification
    const candidate = await prisma.candidate.create({
      data: {
        name,
        party: "", // This would need to be collected or set later
        policies: [],
        city,
        state,
        position,
        website: website || null,
        linkedin: linkedin || null,
        twitter: twitter || null,
        clerkUserId,
        sources: [],
        donations: [],
        bio: "",
        history: [],
        verified: false,
        // electionId field is required - in a real implementation, you'd either:
        // 1. Let the user select an election during signup
        // 2. Create a UserValidationRequest instead which admin would approve
        election: {
          // For demo purposes, connect to the first available election
          connect: {
            id: 1, // This needs to be a valid election ID in your database
          },
        },
      },
    });

    return NextResponse.json(candidate);
  } catch (error: any) {
    console.error("Error registering candidate:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 
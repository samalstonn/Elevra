import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // Get auth session to verify the request
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the clerkUserId from query parameters
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get("clerkUserId");

    // Ensure the requested clerkUserId matches the authenticated user
    if (!clerkUserId || clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Find the candidate in the database
    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        name: true,
        party: true,
        position: true,
        city: true,
        state: true,
        status: true,
        bio: true,
        website: true,
        linkedin: true,
        electionId: true,
        policies: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Error fetching candidate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get auth session to verify the request
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const {
      name,
      party,
      position,
      city,
      state,
      bio,
      website,
      linkedin,
      policies,
      clerkUserId,
      additionalNotes,
    } = body;

    // Validate required fields
    if (
      !name ||
      !party ||
      !position ||
      !city ||
      !state ||
      !bio ||
      !policies ||
      policies.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure the clerkUserId matches the authenticated user
    if (clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { clerkUserId },
    });

    if (existingCandidate) {
      return NextResponse.json(
        { error: "Candidate with this user ID already exists" },
        { status: 409 }
      );
    }

    const createData: Omit<Prisma.CandidateCreateInput, "id"> = {
      name,
      party,
      position,
      city,
      state,
      bio,
      website: website || null,
      linkedin: linkedin || null,
      policies,
      clerkUserId,
      additionalNotes: additionalNotes || null,
    };

    try {
      const candidate = await prisma.candidate.create({
        data: createData,
      });
      return NextResponse.json(candidate);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Prisma error:", error);
        return NextResponse.json(
          { error: "Database error creating candidate" },
          { status: 500 }
        );
      }
      console.error("Prisma error:", error);
      return NextResponse.json(
        { error: "Database error creating candidate" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error creating candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Error creating candidate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

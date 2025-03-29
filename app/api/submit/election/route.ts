import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Extract the data
    const { 
      position, 
      date, 
      city, 
      state, 
      description, 
      positions, 
      type, 
      clerkUserId 
    } = body;

    // Validate required fields
    if (!position || !date || !city || !state || !description || !positions || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that positions is a number
    if (isNaN(positions) || positions < 1) {
      return NextResponse.json(
        { error: "Positions must be a positive number" },
        { status: 400 }
      );
    }

    // Create the election submission in the database
    const electionSubmission = await prisma.electionSubmission.create({
      data: {
        position,
        date: new Date(date),
        city,
        state,
        description,
        positions,
        type,
        status: "PENDING",
        clerkUserId: clerkUserId || null,
      }
    });

    return NextResponse.json({
      success: true,
      electionSubmission
    });

  } catch (error) {
    console.error("Error submitting election:", error);
    return NextResponse.json(
      { error: "Failed to submit election information" },
      { status: 500 }
    );
  }
}
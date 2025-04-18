import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
  console.log("GET request received");
  try {
    const { searchParams, pathname } = new URL(request.url);
    const _ = searchParams.get("search");
    const parts = pathname.split("/");
    const idStr = parts[parts.length - 1];
    if (!idStr) {
      return NextResponse.json(
        { message: "Election ID is required" },
        { status: 400 }
      );
    }
    const electionId = parseInt(idStr);

    console.log("Election ID:", electionId);

    const election = await prisma.election.findUnique({
      where: {
        id: electionId,
      },
    });

    // Get the election by ID
    if (!election) {
      return NextResponse.json(
        { message: "Election not found" },
        { status: 404 }
      );
    }

    // Return the election data including city and state
    return NextResponse.json({
      id: election.id,
      city: election.city,
      state: election.state,
    });
  } catch (error) {
    console.error("Error fetching election:", error);
    return NextResponse.json(
      { message: "Error fetching election data" },
      { status: 500 }
    );
  }
}

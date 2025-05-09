// /api/userValidationRequest/route.ts
import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(request: Request) {
  try {
    const {
      fullName = "",
      email = "",
      phone = "",
      position = "",
      website = "",
      linkedin = "",
      additionalInfo = "",
      city = "",
      state = "",
      candidateId,
      clerkUserId,
    } = await request.json();

    if (!candidateId || isNaN(Number(candidateId))) {
      return NextResponse.json(
        { error: "Invalid candidateId" },
        { status: 400 }
      );
    }
    if (
      !clerkUserId ||
      typeof clerkUserId !== "string" ||
      clerkUserId.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Invalid clerkUserId" },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.userValidationRequest.findUnique({
      where: { clerkUserId: clerkUserId },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error:
            "A validation request for this user has already been submitted.",
        },
        { status: 400 }
      );
    }

    // Create a new validation request
    const newRequest = await prisma.userValidationRequest.create({
      data: {
        fullName,
        email,
        phone,
        position,
        website,
        linkedin,
        additionalInfo,
        city,
        state,
        candidateId: Number(candidateId),
        clerkUserId,
        electionId: 0, // Set to 0 for now, update later
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: newRequest.id });
  } catch (err) {
    console.error("Error in POST /api/userValidationRequest:", err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

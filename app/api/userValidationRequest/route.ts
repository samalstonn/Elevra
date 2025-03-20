import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    fullName,
    email,
    phone,
    position,
    website,
    linkedin,
    twitter,
    additionalInfo,
    city,
    state,
    candidateId,
    clerkUserId,
    electionId
  } = body;

  if (!candidateId || isNaN(Number(candidateId))) {
    return NextResponse.json({ error: "Invalid candidateId" }, { status: 400 });
  }
  if (!clerkUserId || typeof clerkUserId !== "string" || clerkUserId.trim() === "") {
    return NextResponse.json({ error: "Invalid clerkUserId" }, { status: 400 });
  }
  if (!electionId || isNaN(Number(electionId))) {
    return NextResponse.json({ error: "Invalid electionId" }, { status: 400 });
  }

  const userValidationRequest = await prisma.userValidationRequest.create({
    data: {
      fullName,
      email,
      phone,
      position,
      website,
      linkedin,
      twitter,
      additionalInfo,
      city,
      state,
      candidateId: Number(candidateId),
      clerkUserId,
      electionId: Number(electionId)
    }
  });

  return NextResponse.json(userValidationRequest);
}

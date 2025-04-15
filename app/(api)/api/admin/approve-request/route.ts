import { NextResponse } from "next/server";
import { PrismaClient, SubmissionStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { requestId } = await req.json();

  if (!requestId || typeof requestId !== "number") {
    return NextResponse.json(
      { error: "Missing or invalid requestId" },
      { status: 400 }
    );
  }

  const request = await prisma.userValidationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: request.candidateId },
  });

  if (!candidate || candidate.electionId !== request.electionId) {
    return NextResponse.json(
      { error: "Invalid candidate or election mismatch" },
      { status: 400 }
    );
  }

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      name: request.fullName,
      website: request.website || null,
      linkedin: request.linkedin || null,
      city: request.city,
      state: request.state,
      position: request.position,
      additionalNotes: request.additionalInfo || null,
      email: request.email,
      phone: request.phone,
      status: SubmissionStatus.APPROVED,
      verified: true,
      clerkUserId: request.clerkUserId,
    },
  });

  await prisma.userValidationRequest.update({
    where: { id: request.id },
    data: { status: SubmissionStatus.APPROVED },
  });

  return NextResponse.redirect(new URL("/admin/user-validation", req.url));
}

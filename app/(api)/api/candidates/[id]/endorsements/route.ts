export const runtime = "nodejs";
import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(request: Request) {
  const {
    candidateId,
    endorserName,
    relationshipDescription,
    content,
    clerkUserId,
  } = await request.json();

  if (!candidateId || isNaN(Number(candidateId))) {
    return NextResponse.json(
      { error: "Invalid candidate ID" },
      { status: 400 }
    );
  }

  if (endorserName === undefined) {
    const endorsements = prisma.endorsement.findMany({
      where: { candidateId: Number(candidateId), hidden: false },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(endorsements);
  } else {
    if (!clerkUserId || typeof clerkUserId !== "string") {
      return NextResponse.json(
        { error: "Invalid clerkUserId" },
        { status: 400 }
      );
    }

    if (!endorserName || !content) {
      return NextResponse.json(
        { error: "Missing required fields: endorserName and content" },
        { status: 400 }
      );
    }
    try {
      const endorsement = await prisma.endorsement.create({
        data: {
          candidateId: Number(candidateId),
          endorserName,
          relationshipDescription,
          content,
          clerkUserId,
        },
      });
      return NextResponse.json(endorsement, { status: 201 });
    } catch (error) {
      console.error("Error creating endorsement:", error);
      return NextResponse.json(
        { error: "Failed to create endorsement" },
        { status: 500 }
      );
    }
  }
}

export async function DELETE(request: Request) {
  const { endorsementId, clerkUserId } = await request.json();
  if (!endorsementId || !clerkUserId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Verify ownership
  const existing = await prisma.endorsement.findUnique({
    where: { id: endorsementId },
  });
  if (!existing || existing.clerkUserId !== clerkUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.endorsement.update({
    where: { id: endorsementId },
    data: { hidden: true },
  });
  return NextResponse.json({ success: true });
}

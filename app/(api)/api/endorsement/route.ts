// app/(api)/api/endorsement/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // optional filters
  const candidateId = searchParams.get("candidateId");
  const clerkUserId = searchParams.get("clerkUserId");

  // build Prisma where‑clause
  const where: any = { hidden: false };
  if (candidateId && !isNaN(+candidateId)) {
    where.candidateId = +candidateId;
  }
  if (clerkUserId) {
    where.clerkUserId = clerkUserId;
  }

  try {
    const endorsements = await prisma.endorsement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    if (endorsements.length === 0) {
      return NextResponse.json(
        { error: "No endorsements found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ endorsements }, { status: 200 });
  } catch (err) {
    console.error("[GET_ENDORSEMENTS_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to fetch endorsements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const {
    candidateId,
    endorserName,
    relationshipDescription,
    content,
    clerkUserId,
  } = await req.json();

  if (!candidateId || !endorserName || !content || !clerkUserId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const newEndorsement = await prisma.endorsement.create({
      data: {
        candidateId,
        endorserName,
        relationshipDescription,
        content,
        clerkUserId,
      },
    });
    return NextResponse.json(newEndorsement, { status: 201 });
  } catch (error) {
    console.error("[CREATE_ENDORSEMENT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create endorsement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { endorsementId, clerkUserId } = await req.json();

  if (!endorsementId || !clerkUserId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const endorsement = await prisma.endorsement.findUnique({
      where: { id: endorsementId },
    });
    if (!endorsement || endorsement.clerkUserId !== clerkUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark endorsement as hidden (soft-delete)
    await prisma.endorsement.update({
      where: { id: endorsementId },
      data: { hidden: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_ENDORSEMENT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete endorsement" },
      { status: 500 }
    );
  }
}

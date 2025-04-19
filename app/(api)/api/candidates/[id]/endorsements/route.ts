import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const candidateId = parseInt(await params.id, 10);
  if (isNaN(candidateId)) {
    return NextResponse.json(
      { error: "Invalid candidate ID" },
      { status: 400 }
    );
  }
  const endorsements = await prisma.endorsement.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(endorsements);
}

export async function POST(request: Request, { params }: { params: Params }) {
  const candidateId = parseInt(await params.id, 10);
  if (isNaN(candidateId)) {
    return NextResponse.json(
      { error: "Invalid candidate ID" },
      { status: 400 }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { endorserName, relationshipDescription, content, clerkUserId } = body;
  if (!endorserName || !content) {
    return NextResponse.json(
      { error: "Missing required fields: endorserName and content" },
      { status: 400 }
    );
  }
  try {
    const endorsement = await prisma.endorsement.create({
      data: {
        candidateId,
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

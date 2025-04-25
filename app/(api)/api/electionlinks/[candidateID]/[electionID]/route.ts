// app/(api)/api/electionlinks/[candidateID]/[electionID]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { candidateID: string; electionID: string } }
) {
  const candidateId = parseInt(params.candidateID, 10);
  const electionId = parseInt(params.electionID, 10);
  try {
    const link = await prisma.electionLink.findUnique({
      where: { candidateId_electionId: { candidateId, electionId } },
      include: { election: true },
    });
    if (!link) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(link);
  } catch (error) {
    console.error("Error fetching election link:", error);
    return NextResponse.json(
      { error: "Failed to fetch election link" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { candidateID: string; electionID: string } }
) {
  const candidateId = parseInt(params.candidateID, 10);
  const electionId = parseInt(params.electionID, 10);
  try {
    const { profile } = await request.json();

    const allowedFields = [
      "party",
      "votinglink",
      "policies",
      "additionalNotes",
    ];

    const filteredProfile = Object.fromEntries(
      Object.entries(profile || {}).filter(([key]) =>
        allowedFields.includes(key)
      )
    ) as {
      party?: string;
      votinglink?: string;
      policies?: string[];
      additionalNotes?: string;
    };

    const link = await prisma.electionLink.upsert({
      where: { candidateId_electionId: { candidateId, electionId } },
      create: {
        candidateId,
        electionId,
        // ensure required fields have defaults
        party: filteredProfile.party ?? "",
        ...filteredProfile,
      },
      update: filteredProfile,
    });
    return NextResponse.json(link);
  } catch (error) {
    console.error("Error updating election link:", error);
    return NextResponse.json(
      { error: "Failed to update election link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { candidateID: string; electionID: string } }
) {
  const candidateId = parseInt(params.candidateID, 10);
  const electionId = parseInt(params.electionID, 10);
  try {
    await prisma.electionLink.delete({
      where: { candidateId_electionId: { candidateId, electionId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting election link:", error);
    return NextResponse.json(
      { error: "Failed to delete election link" },
      { status: 500 }
    );
  }
}

// app/(api)/api/electionlinks/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, TextColor, BlockType, ListStyle } from "@prisma/client";
import { pick } from "lodash";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const candidateIdParam = searchParams.get("candidateId");
  if (!candidateIdParam) {
    return NextResponse.json(
      { error: "candidateId query param is required" },
      { status: 400 }
    );
  }
  const candidateId = parseInt(candidateIdParam, 10);
  try {
    const links = await prisma.electionLink.findMany({
      where: { candidateId },
      include: { election: true, ContentBlock: true },
    });
    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching election links:", error);
    return NextResponse.json(
      { error: "Failed to fetch election links" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { candidateId, electionId, profile } = await request.json();
    if (typeof candidateId !== "number" || typeof electionId !== "number") {
      return NextResponse.json(
        { error: "candidateId and electionId must be numbers" },
        { status: 400 }
      );
    }

    // Defaults for the old columns so Prisma doesn't complain
    const defaults = {
      party: "",
      policies: [],
      sources: [],
      additionalNotes: "",
    };
    const linkData = {
      candidateId,
      electionId,
      ...defaults,
      // only allow known fields from profile
      ...(profile
        ? pick(profile, ["party", "policies", "sources", "additionalNotes"])
        : {}),
    };

    const newLinkWithBlocks = await prisma.$transaction(async (tx) => {
      // 1 ▸ Create the election link
      const link = await tx.electionLink.create({ data: linkData });

      // 2 ▸ Seed six starter blocks
      await tx.contentBlock.createMany({
        data: [
          {
            candidateId,
            electionId,
            order: 0,
            type: BlockType.HEADING,
            level: 1,
            text: "", // Candidate will fill later
            color: TextColor.BLACK,
          },
          {
            candidateId,
            electionId,
            order: 1,
            type: BlockType.HEADING,
            level: 2,
            text: "Party name",
            color: TextColor.PURPLE,
          },
          {
            candidateId,
            electionId,
            order: 2,
            type: BlockType.HEADING,
            level: 2,
            text: "Policies",
            color: TextColor.BLACK,
          },
          {
            candidateId,
            electionId,
            order: 3,
            type: BlockType.LIST,
            listStyle: ListStyle.BULLET,
            items: [],
            color: TextColor.BLACK,
          },
          {
            candidateId,
            electionId,
            order: 4,
            type: BlockType.HEADING,
            level: 2,
            text: "Notes",
            color: TextColor.BLACK,
          },
          {
            candidateId,
            electionId,
            order: 5,
            type: BlockType.TEXT,
            body: "",
            color: TextColor.GRAY,
          },
        ],
      });

      return link;
    });

    return NextResponse.json(newLinkWithBlocks);
  } catch (error) {
    console.error("Error creating election link:", error);
    return NextResponse.json(
      { error: "Failed to create election link" },
      { status: 500 }
    );
  }
}

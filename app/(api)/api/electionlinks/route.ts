// app/(api)/api/electionlinks/route.ts
import { NextResponse } from "next/server";
import {
  PrismaClient,
  /* TextColor,
  BlockType,
  ListStyle, */
  Prisma,
} from "@prisma/client";
import { pick } from "lodash";
import {
  elevraStarterTemplate,
  simpleTemplate,
} from "@/app/(templates)/basicwebpage";

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
      include: { election: true, ContentBlock: true, Document: true },
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
    const { candidateId, electionId, profile, key } = await request.json();
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

    // Clear existing content blocks for the given candidate and election
    await prisma.contentBlock.deleteMany({
      where: {
        candidateId,
        electionId,
      },
    });

    const newLinkWithBlocks = await prisma.$transaction(async (tx) => {
      // 1 ▸ Create the election link
      const link = await tx.electionLink.create({ data: linkData });

      // Prepare blocks to create based on the selected template key
      let dataToCreate: Prisma.ContentBlockCreateManyInput[];
      if (key === "custom") {
        dataToCreate = []; // No blocks for custom template
      } else if (key === "simpleTemplate") {
        dataToCreate = simpleTemplate.map((block, _) => ({
          ...block,
          candidateId,
          electionId,
        }));
      } else if (key === "elevraStarterTemplate") {
        dataToCreate = elevraStarterTemplate.map((block, _) => ({
          ...block,
          candidateId,
          electionId,
        }));
      } else {
        dataToCreate = []; // Fallback to no blocks if key is unrecognized
      }

      // 2 ▸ Seed six starter blocks
      await tx.contentBlock.createMany({
        data: dataToCreate,
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

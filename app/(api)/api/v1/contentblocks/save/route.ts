import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { BlockType, ContentBlock } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const MAX_PER_TYPE: Record<BlockType, number> = {
  HEADING: 8,
  TEXT: 10,
  LIST: 6,
  DIVIDER: 10,
  IMAGE: 2,
  VIDEO: 1,
};

export async function POST(request: Request) {
  try {
    // Get the current authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId, electionId, blocks } = await request.json();

    if (
      typeof candidateId !== "number" ||
      typeof electionId !== "number" ||
      !Array.isArray(blocks)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify that the user can edit this candidate's blocks
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId, clerkUserId: userId },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate block counts per type
    const counts: Record<BlockType, number> = {
      HEADING: 0,
      TEXT: 0,
      LIST: 0,
      DIVIDER: 0,
      IMAGE: 0,
      VIDEO: 0,
    };
    for (const b of blocks) {
      if (!(b.type in counts)) {
        return NextResponse.json(
          { error: `Unknown block type: ${b.type}` },
          { status: 400 }
        );
      }
      counts[b.type as BlockType]! += 1;
      if (counts[b.type as BlockType]! > MAX_PER_TYPE[b.type as BlockType]) {
        return NextResponse.json(
          {
            error: `${b.type} limit exceeded (${
              MAX_PER_TYPE[b.type as BlockType]
            })`,
          },
          { status: 400 }
        );
      }
    }

    // Upsert all blocks (only new ones are passed into the payload)
    await prisma.$transaction(
      blocks.map((b: ContentBlock) =>
        prisma.contentBlock.upsert({
          where: {
            id: b.id || -1, // Match by ID if provided, otherwise use -1 which won't match any existing record
          },
          update: {
            type: b.type,
            color: b.color,
            level: b.level,
            text: b.text,
            body: b.body,
            listStyle: b.listStyle,
            items: b.items,
            imageUrl: b.imageUrl,
            videoUrl: b.videoUrl,
            thumbnailUrl: b.thumbnailUrl,
            caption: b.caption,
          },
          create: {
            candidateId,
            electionId,
            order: b.order,
            type: b.type,
            color: b.color,
            level: b.level,
            text: b.text,
            body: b.body,
            listStyle: b.listStyle,
            items: b.items,
            imageUrl: b.imageUrl,
            videoUrl: b.videoUrl,
            thumbnailUrl: b.thumbnailUrl,
            caption: b.caption,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving content blocks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

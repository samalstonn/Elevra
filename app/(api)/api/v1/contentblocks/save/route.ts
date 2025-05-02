import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { BlockType, ContentBlock } from "@prisma/client";

const MAX_PER_TYPE: Record<BlockType, number> = {
  HEADING: 4,
  TEXT: 10,
  LIST: 6,
  DIVIDER: 4,
  IMAGE: 2,
  VIDEO: 1,
};

export async function POST(request: Request) {
  try {
    const { candidateId, electionId, blocks } = await request.json();

    if (
      typeof candidateId !== "number" ||
      typeof electionId !== "number" ||
      !Array.isArray(blocks)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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

    // Transaction: clear old blocks, insert new ones
    await prisma.$transaction([
      prisma.contentBlock.deleteMany({
        where: { candidateId, electionId },
      }),
      prisma.contentBlock.createMany({
        data: blocks.map((b: ContentBlock) => ({
          candidateId,
          electionId,
          order: b.order,
          type: b.type,
          color: b.color,
          // heading
          level: b.level,
          text: b.text,
          // text
          body: b.body,
          // list
          listStyle: b.listStyle,
          items: b.items,
          // media
          imageUrl: b.imageUrl,
          videoUrl: b.videoUrl,
          thumbnailUrl: b.thumbnailUrl,
          caption: b.caption,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving content blocks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

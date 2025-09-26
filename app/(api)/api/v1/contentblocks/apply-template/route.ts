import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { elevraStarterTemplate } from "@/app/(templates)/basicwebpage";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId, electionId, templateKey } = await request.json();

    if (
      typeof candidateId !== "number" ||
      typeof electionId !== "number" ||
      typeof templateKey !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        clerkUserId: userId,
      },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.electionLink.upsert({
      where: {
        candidateId_electionId: {
          candidateId,
          electionId,
        },
      },
      update: {},
      create: {
        candidateId,
        electionId,
        party: "",
        sources: [],
        policies: [],
      },
    });

    let blocks = null;

    switch (templateKey.toUpperCase()) {
      case "ELEVRA_STARTER_TEMPLATE":
        blocks = elevraStarterTemplate;
        break;
      default:
        return NextResponse.json(
          { error: "Unknown template" },
          { status: 400 }
        );
    }

    await prisma.$transaction([
      prisma.contentBlock.deleteMany({
        where: { candidateId, electionId },
      }),
      prisma.contentBlock.createMany({
        data: blocks.map((block, index) => ({
          ...block,
          candidateId,
          electionId,
          order: index,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error applying template:", error);
    return NextResponse.json(
      { error: "Failed to apply template" },
      { status: 500 }
    );
  }
}

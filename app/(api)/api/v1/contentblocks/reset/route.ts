import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { elevraStarterTemplate } from "@/app/(templates)/basicwebpage";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId } = await request.json();
    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      );
    }

    // Ensure the candidate exists & check ownership rules
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, clerkUserId: true },
    });
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }
    // If already claimed by another user block reset
    if (candidate.clerkUserId && candidate.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: candidate already claimed" },
        { status: 403 }
      );
    }

    // Properly instantiate the clerk client then fetch user
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const anyEmailVerified = user.emailAddresses?.some((addr) => {
      return addr.verification?.status === "verified";
    });
    if (!anyEmailVerified) {
      return NextResponse.json(
        { error: "Email address not verified" },
        { status: 400 }
      );
    }

    // Fetch all election links for this candidate
    const links = await prisma.electionLink.findMany({
      where: { candidateId },
      select: { electionId: true },
    });
    if (links.length === 0) {
      return NextResponse.json(
        { error: "No election links found for candidate" },
        { status: 400 }
      );
    }

    // Prepare new blocks for each election link
    const allBlocksData = links.flatMap((link) =>
      elevraStarterTemplate.map((block, idx) => ({
        ...block,
        candidateId,
        electionId: link.electionId,
        order: idx,
      }))
    );

    await prisma.$transaction([
      prisma.contentBlock.deleteMany({ where: { candidateId } }),
      prisma.contentBlock.createMany({ data: allBlocksData }),
    ]);

    return NextResponse.json({
      status: "ok",
      inserted: allBlocksData.length,
      electionsUpdated: links.length,
    });
  } catch (error) {
    console.error("Error resetting content blocks:", error);
    return NextResponse.json(
      { error: "Failed to reset content blocks" },
      { status: 500 }
    );
  }
}

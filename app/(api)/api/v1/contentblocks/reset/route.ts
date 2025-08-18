import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { davidWeinsteinTemplate } from "@/app/(templates)/basicwebpage";

export async function POST(request: Request) {
  try {
    const { userId } = await auth(); // await added as auth() returns a promise
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

    // Ensure the candidate belongs to the authenticated user
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

    // Check Clerk user email verification status (invoke clerkClient())
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const anyEmailVerified = user.emailAddresses?.some(
      (addr: (typeof user.emailAddresses)[number]) =>
        addr.verification?.status === "verified"
    );
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

    // Build all template blocks for every election link
    const allBlocksData = links.flatMap((link) =>
      davidWeinsteinTemplate.map((block, idx) => ({
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

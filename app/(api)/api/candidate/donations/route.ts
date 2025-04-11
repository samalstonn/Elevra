import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clerkUserId = searchParams.get("clerkUserId");

  if (!clerkUserId) {
    return NextResponse.json(
      { error: "Missing clerkUserId parameter" },
      { status: 400 }
    );
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId },
      include: {
        donations: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                party: true,
                position: true,
                state: true,
              },
            },
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const totalDonations = candidate.donations.reduce((sum, donation) => {
      return sum + Number(donation.amount);
    }, 0);

    return NextResponse.json({
      clerkUserId,
      totalDonations,
      totalContributions: candidate.donations.length,
      donations: candidate.donations.map((d) => ({
        id: d.id,
        amount: d.amount,
        paidAt: d.paidAt,
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        candidate: d.candidate,
      })),
    });
  } catch (error) {
    console.error("[GET_CANDIDATE_DONATIONS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

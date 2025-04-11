// app/api/voter/donations/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma"; // Adjust this import based on your project structure
import { calculateFee } from "@/lib/functions";

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
    const donations = await prisma.donation.findMany({
      where: { clerkUserId },
      include: {
        candidate: true,
      },
    });

    const totalDonations = donations.reduce((sum, donation) => {
      const netAmount = donation.coverFee
        ? Number(donation.amount)
        : Number(donation.amount) - calculateFee(Number(donation.amount));
      return sum + netAmount;
    }, 0);

    const candidateIds = new Set(donations.map((d) => d.candidateId));
    const totalCandidatesSupported = candidateIds.size;

    const donationDetails = donations.map((d) => ({
      id: d.id,
      amount: d.coverFee
        ? Number(d.amount)
        : Number(d.amount) - calculateFee(Number(d.amount)),
      paidAt: d.paidAt,
      candidate: d.candidate,
    }));

    return NextResponse.json({
      clerkUserId,
      totalDonations,
      totalCandidatesSupported,
      donations: donationDetails,
    });
  } catch (error) {
    console.error("[GET_DONATIONS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

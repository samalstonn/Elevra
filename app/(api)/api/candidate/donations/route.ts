// app/(api)/api/candidate/donations/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
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
                city: true,
                state: true,
                slug: true,
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

    const totalDonations = candidate.donations.reduce((sum, d) => {
      const netAmount = d.coverFee
        ? Number(d.amount)
        : Number(d.amount) - calculateFee(Number(d.amount));
      return sum + netAmount;
    }, 0);

    const res = NextResponse.json({
      clerkUserId,
      totalDonations,
      totalDonationsNumber: candidate.donations.length,
      donations: candidate.donations.map((d) => ({
        id: d.id,
        amount: d.coverFee
          ? Number(d.amount)
          : Number(d.amount) - calculateFee(Number(d.amount)),
        paidAt: d.paidAt,
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        coverFee: d.coverFee,
        candidate: d.candidate,
      })),
    });
    console.log(res);
    return res;
  } catch (error) {
    console.error("[GET_CANDIDATE_DONATIONS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

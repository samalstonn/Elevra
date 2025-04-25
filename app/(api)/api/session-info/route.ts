import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/prisma/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get the candidateId from the session metadata
    const candidateId = session.metadata?.candidateId;

    if (!candidateId) {
      return NextResponse.json(
        { error: "Candidate information not found in session" },
        { status: 404 }
      );
    }

    // Fetch donation information from our database
    const donation = await prisma.donation.findUnique({
      where: {
        transactionId: sessionId,
      },
      select: {
        id: true,
        amount: true,
        donorName: true,
        processingFee: true,
        coverFee: true,
        createdAt: true,
        paidAt: true,
      },
    });

    // Fetch candidate information
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) },
      select: {
        id: true,
        name: true,
        slug: true,
        currentRole: true,
        photo: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        amount: session.amount_total ? session.amount_total / 100 : null,
        status: session.status,
      },
      donation,
      candidate,
    });
  } catch (error: unknown) {
    console.error("Error retrieving session:", error);
    return NextResponse.json(
      { error: "Error retrieving session information: " + error },
      { status: 500 }
    );
  }
}

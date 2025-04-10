// app/api/checkout_sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { cartItems, donationDetails } = body;

    if (!cartItems || !cartItems.length || !donationDetails) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const { candidateId, donorInfo } = donationDetails;

    // Create line items for Stripe
    const lineItems = cartItems.map((item: any) => {
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents for Stripe
        },
        quantity: item.quantity,
      };
    });

    // Save donation intent to database first
    const donationIntent = await prisma.donationIntent.create({
      data: {
        amount: donorInfo.amount,
        processingFee: donorInfo.coverFee
          ? Math.round(donorInfo.amount * 0.029 + 0.3 * 100) / 100
          : 0,
        candidateId: candidateId,
        userId: userId || undefined, // Only include if user is logged in
        donorName: donorInfo.fullName,
        donorEmail: donorInfo.email,
        donorAddress: donorInfo.address,
        donorCity: donorInfo.city,
        donorState: donorInfo.state,
        donorZip: donorInfo.zip,
        donorCountry: donorInfo.country || "USA",
        donorPhone: donorInfo.phone || undefined,
        isRetiredOrUnemployed: donorInfo.isRetiredOrUnemployed,
        occupation: donorInfo.isRetiredOrUnemployed
          ? "Retired/Unemployed"
          : donorInfo.occupation,
        employer: donorInfo.isRetiredOrUnemployed ? "N/A" : donorInfo.employer,
        status: "PENDING",
      },
    });

    // Make sure we have a valid base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/candidate/${body.candidateSlug}/donate/success?session_id={CHECKOUT_SESSION_ID}&candidate=${body.candidateSlug}`,
      cancel_url: `${baseUrl}/candidate/${body.candidateSlug}`,
      metadata: {
        donationType: "campaign",
        candidateId: donationDetails.candidateId.toString(),
        userClerkId: userId || "",
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      success_url: session.success_url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Error creating checkout session: " + error.message },
      { status: 500 }
    );
  }
}

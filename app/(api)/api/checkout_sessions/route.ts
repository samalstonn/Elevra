import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";
import { SubmissionStatus } from "@prisma/client";
import { calculateFee } from "@/lib/functions";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  try {
    console.log("Creating checkout session");
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

    // Calculate processing fee with the corrected formula
    const processingFee = donorInfo.coverFee
      ? calculateFee(donorInfo.amount)
      : 0;

    // Create line items for Stripe
    const lineItems = cartItems.map(
      (item: { name: string; price: number; quantity: number }) => {
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
      }
    );

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
        donorName: donorInfo.fullName,
        donorEmail: donorInfo.email,
        coverFee: donorInfo.coverFee.toString(),
        amount: donorInfo.amount.toString(),
      },
    });

    console.log("Created Stripe session:", session.id);

    // Save donation record directly with PENDING status
    try {
      const donation = await prisma.donation.create({
        data: {
          amount: donorInfo.amount,
          processingFee: processingFee,
          candidateId: candidateId,
          status: SubmissionStatus.PENDING, // Use the enum value
          clerkUserId: userId || null,
          donorName: donorInfo.fullName,
          donorEmail: donorInfo.email,
          donorAddress: donorInfo.address,
          donorCity: donorInfo.city,
          donorState: donorInfo.state,
          donorZip: donorInfo.zip,
          donorPhone: donorInfo.phone || null,
          isRetiredOrUnemployed: donorInfo.isRetiredOrUnemployed,
          occupation: donorInfo.isRetiredOrUnemployed
            ? "Retired/Unemployed"
            : donorInfo.occupation,
          employer: donorInfo.isRetiredOrUnemployed
            ? "N/A"
            : donorInfo.employer,
          transactionId: session.id, // Save the session ID to find this record later
          coverFee: donorInfo.coverFee,
          paidAt: null,
        },
      });

      console.log("Created pending donation record:", donation.id);
    } catch (err: unknown) {
      console.error("Error creating donation record:", err);
      // Continue with checkout even if donation creation fails
      // Webhook handler will create donation if needed
    }

    return NextResponse.json({
      sessionId: session.id,
      success_url: session.success_url,
    });
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    }
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Error creating checkout session: " + message },
      { status: 500 }
    );
  }
}

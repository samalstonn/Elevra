import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/prisma/prisma";
import { headers } from "next/headers";
import nodemailer from "nodemailer";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Webhook secret for validating the event
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or another service
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
});

// Function to send confirmation email
async function sendConfirmationEmail(donationDetails: any, candidate: any) {
  try {
    await transporter.sendMail({
      from: `"Elevra Donations" <${process.env.EMAIL_FROM}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Donation Received: ${donationDetails.donorName} donated to ${candidate.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #6200ee;">New Donation Received</h2>
          <p>A new donation has been successfully processed:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Donor:</strong> ${donationDetails.donorName}</p>
            <p><strong>Email:</strong> ${donationDetails.donorEmail}</p>
            <p><strong>Amount:</strong> $${Number(
              donationDetails.amount
            ).toFixed(2)}</p>
            <p><strong>Candidate:</strong> ${candidate.name} (${
        candidate.position
      })</p>
            <p><strong>Transaction ID:</strong> ${
              donationDetails.transactionId
            }</p>
            <p><strong>Date:</strong> ${new Date(
              donationDetails.updatedAt
            ).toLocaleString()}</p>
          </div>
          
          <p>This donation has been confirmed by Stripe and recorded in the database.</p>
          
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated message from Elevra Community.</p>
        </div>
      `,
    });
    console.log("Confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}

// Disabled body parsing as we need raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 }
      );
    }

    // Verify the event comes from Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event based on its type
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only process donation events from our app
      if (
        session.metadata?.donationType === "campaign" &&
        session.metadata?.candidateId
      ) {
        // Find the pending donation by transaction ID
        const donation = await prisma.donation.findFirst({
          where: {
            transactionId: session.id,
          },
        });

        if (donation) {
          // Update donation with payment details
          const updatedDonation = await prisma.donation.update({
            where: {
              id: donation.id,
            },
            data: {
              // Add Stripe payment details
              paidAt: new Date(),
            },
          });

          // Find the candidate
          const candidate = await prisma.candidate.findUnique({
            where: {
              id: donation.candidateId,
            },
          });

          // Update candidate donation stats
          if (candidate) {
            await prisma.candidate.update({
              where: { id: candidate.id },
              data: {
                // Increment total donation count
                donationCount: {
                  increment: 1,
                },
              },
            });

            // Send confirmation email to admin
            await sendConfirmationEmail(updatedDonation, candidate);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed: " + error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/prisma/prisma";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { SubmissionStatus } from "@prisma/client";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  maxNetworkRetries: 3,
  telemetry: false,
});

// Webhook secret for validating the event
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Set up nodemailer transporter using your email service credentials
const transporter = nodemailer.createTransport({
  service: "gmail", // or another service
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
});

// Function to send confirmation email
async function sendConfirmationEmail(donationDetails: any, candidate: any) {
  console.log("Attempting to send confirmation email", {
    from: process.env.EMAIL_USER,
    to: process.env.MY_EMAIL,
    subject: `New Donation: ${donationDetails.donorName} to ${candidate.name}`,
    emailUser: Boolean(process.env.EMAIL_USER),
    emailPass: Boolean(process.env.EMAIL_PASS),
    myEmail: Boolean(process.env.MY_EMAIL),
  });

  try {
    const emailResult = await transporter.sendMail({
      from: `"Elevra Donations" <${process.env.EMAIL_USER}>`,
      to: process.env.MY_EMAIL,
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
        candidate.position || "Candidate"
      })</p>
            <p><strong>Transaction ID:</strong> ${
              donationDetails.transactionId
            }</p>
            <p><strong>Date:</strong> ${new Date(
              donationDetails.updatedAt || new Date()
            ).toLocaleString()}</p>
          </div>
          
          <p>This donation has been confirmed by Stripe and recorded in the database.</p>
          
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated message from Elevra Community.</p>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully", {
      messageId: emailResult.messageId,
      response: emailResult.response,
    });

    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
}

// Disabled body parsing as we need raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  console.log("Webhook received!", new Date().toISOString());

  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    console.log("Webhook headers:", {
      signature: signature ? "Present" : "Missing",
      contentType: headersList.get("content-type"),
    });

    if (!signature) {
      console.error("Missing stripe signature");
      return NextResponse.json(
        { error: "Missing stripe signature" },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error("Webhook secret is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify the event comes from Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(
        "Event verified from Stripe:",
        event.type,
        "Event ID:",
        event.id
      );
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
      console.log("Processing completed checkout:", {
        sessionId: session.id,
        metadata: session.metadata,
        amountTotal: session.amount_total,
        paymentStatus: session.payment_status,
        created: new Date(session.created * 1000).toISOString(),
      });

      // Only process donation events from our app
      if (
        session.metadata?.donationType === "campaign" &&
        session.metadata?.candidateId
      ) {
        console.log(
          "Processing donation for candidate ID:",
          session.metadata.candidateId
        );

        // Try to find the donation with retry logic
        let retryCount = 0;
        let donation = null;

        while (!donation && retryCount < 3) {
          // Find the pending donation by transaction ID
          donation = await prisma.donation.findUnique({
            where: {
              transactionId: session.id,
            },
          });

          if (donation) {
            console.log(
              "Found donation record:",
              donation.id,
              "on attempt",
              retryCount + 1
            );
            break;
          } else {
            console.log(
              `Donation record not found on attempt ${
                retryCount + 1
              }, retrying...`
            );
            retryCount++;

            // Wait a bit before retrying
            if (retryCount < 3) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        if (donation) {
          // Donation found, update it to paid status
          if (!donation.paidAt) {
            try {
              const updatedDonation = await prisma.donation.update({
                where: {
                  id: donation.id,
                },
                data: {
                  paidAt: new Date(), // Mark as paid
                  status: SubmissionStatus.APPROVED, // Update status to approved
                },
              });

              console.log(
                "Updated donation with payment confirmation:",
                updatedDonation.id
              );

              // Find the candidate
              try {
                const candidate = await prisma.candidate.findUnique({
                  where: {
                    id: donation.candidateId,
                  },
                });

                if (candidate) {
                  console.log("Found candidate:", candidate.id, candidate.name);

                  try {
                    // Update candidate donation stats
                    const updatedCandidate = await prisma.candidate.update({
                      where: { id: candidate.id },
                      data: {
                        // Increment donation count
                        donationCount: {
                          increment: 1,
                        },
                      },
                    });

                    console.log("Updated candidate donation stats:", {
                      id: updatedCandidate.id,
                      newDonationCount: updatedCandidate.donationCount,
                    });

                    // Send confirmation email
                    const emailSent = await sendConfirmationEmail(
                      updatedDonation,
                      candidate
                    );
                    console.log("Email sending result:", emailSent);
                  } catch (updateError) {
                    console.error("Error updating candidate:", updateError);
                  }
                } else {
                  console.error("Candidate not found:", donation.candidateId);
                }
              } catch (candidateError) {
                console.error("Error finding candidate:", candidateError);
              }
            } catch (updateError) {
              console.error("Error updating donation:", updateError);
            }
          } else {
            console.log("Donation already marked as paid:", donation.paidAt);
          }
        } else {
          // No donation found, create one from session data
          console.log(
            "Donation record not found after retries for session:",
            session.id
          );
          console.log("Attempting to create donation record from session data");

          try {
            // Create minimal donation record from session data
            const newDonation = await prisma.donation.create({
              data: {
                amount: (session.amount_total || 0) / 100, // Convert from cents
                candidateId: parseInt(session.metadata.candidateId),
                donorName: session.metadata.donorName || "Unknown",
                donorEmail:
                  session.metadata.donorEmail || "unknown@example.com",
                donorAddress: "Address not captured",
                donorCity: "Unknown",
                donorState: "Unknown",
                donorZip: "Unknown",
                status: SubmissionStatus.APPROVED,
                transactionId: session.id,
                paidAt: new Date(), // Mark as paid immediately
                clerkUserId: session.metadata.userClerkId || null,
              },
            });

            console.log(
              "Created new donation record from session data:",
              newDonation.id
            );

            // Find candidate and update stats
            try {
              const candidate = await prisma.candidate.findUnique({
                where: {
                  id: parseInt(session.metadata.candidateId),
                },
              });

              if (candidate) {
                await prisma.candidate.update({
                  where: { id: candidate.id },
                  data: {
                    donationCount: {
                      increment: 1,
                    },
                  },
                });

                // Send confirmation email
                await sendConfirmationEmail(newDonation, candidate);
              }
            } catch (candidateError) {
              console.error(
                "Error finding/updating candidate after creating donation:",
                candidateError
              );
            }
          } catch (createError) {
            console.error(
              "Error creating donation from session data:",
              createError
            );
          }
        }
      } else {
        console.log(
          "Not a campaign donation or missing candidateId in metadata"
        );
      }
    } else {
      console.log("Ignored event type:", event.type);
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

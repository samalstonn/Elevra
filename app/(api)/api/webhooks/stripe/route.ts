import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/prisma/prisma";
import { headers } from "next/headers";
import { sendWithResend } from "@/lib/email/resend";
import { SubmissionStatus, Donation, Candidate } from "@prisma/client";
import { calculateFee } from "@/lib/functions";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  maxNetworkRetries: 3,
  telemetry: false,
});

// Webhook secret for validating the event
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Function to send confirmation email
async function sendConfirmationEmail(
  donationDetails: Donation,
  candidate: Candidate
) {
  console.log("Attempting to send confirmation emails", {
    toAdmin: process.env.ADMIN_EMAIL,
    toDonor: donationDetails.donorEmail,
    subject: `New Donation: ${donationDetails.donorName} to ${candidate.name}`,
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
  });

  try {
    // 1. Send email to admin
    await sendWithResend({
      to: process.env.ADMIN_EMAIL!,
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
            <p><strong>Processing Fee:</strong> $${Number(
              donationDetails.processingFee
            ).toFixed(2)}</p>
              <p><strong>Candidate:</strong> ${candidate.name} (${
        candidate.currentRole || "Candidate"
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
    console.log("Admin confirmation email sent successfully");

    // 2. Send receipt email to donor
    if (donationDetails.donorEmail) {
      await sendWithResend({
        to: donationDetails.donorEmail,
        subject: `Thank you for supporting ${candidate.name}`,
        html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #6200ee;">Thank You for Your Support!</h2>
              <p>Dear ${donationDetails.donorName},</p>
              
              <p>Thank you for your generous donation to ${
                candidate.name
              }'s campaign. Your support makes a real difference in your local community.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin-top: 0;">Donation Receipt</h3>
                <p><strong>Amount:</strong> $${Number(
                  donationDetails.amount
                ).toFixed(2)}</p>
                <p><strong>Processing Fee:</strong> $${Number(
                  donationDetails.processingFee
                ).toFixed(2)}</p>
                <p><strong>Date:</strong> ${new Date(
                  donationDetails.updatedAt || new Date()
                ).toLocaleString()}</p>
                <p><strong>Candidate:</strong> ${candidate.name} (${
          candidate.currentRole || "Candidate"
        })</p>
                <p><strong>Transaction ID:</strong> ${
                  donationDetails.transactionId
                }</p>
              </div>
              
              <p>Your donation will help fund campaign activities and community outreach efforts. We're grateful for your commitment to local politics.</p>
              
              <p>You can view the campaign page at any time by visiting: <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/candidate/${candidate.slug}">${
          candidate.name
        }'s Campaign</a></p>
              
              <p>Thank you again for your support!</p>
              
              <p>Sincerely,<br>The Elevra Community Team</p>
              
              <hr style="border: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #888;">This is an automated message from Elevra Community. Political donations are not tax deductible.</p>
            </div>
          `,
      });
      console.log("Donor receipt email sent successfully");
    }

    return true;
  } catch (error) {
    console.error("Error sending confirmation emails:", error);
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
    } catch (err: unknown) {
      console.error(`Webhook signature verification failed: ${err}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err}` },
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
                // Calculate processing fee if coverFee was true
                processingFee:
                  session.metadata?.coverFee === "true"
                    ? calculateFee(parseFloat(session.metadata.amount || "0"))
                    : 0,
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
                coverFee: session.metadata?.coverFee === "true",
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
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed: " + error },
      { status: 500 }
    );
  }
}

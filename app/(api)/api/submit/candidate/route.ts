import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Extract the data
    const {
      name,
      party,
      position,
      bio,
      website,
      linkedin,
      city,
      state,
      additionalNotes,
      policies,
      electionId,
      clerkUserId,
    } = body;

    // Validate required fields
    if (
      !name ||
      !party ||
      !position ||
      !bio ||
      !city ||
      !state ||
      !policies ||
      policies.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate policies array
    if (!Array.isArray(policies) || policies.length > 5) {
      return NextResponse.json(
        { error: "Policies must be an array with at most 5 items" },
        { status: 400 }
      );
    }

    // Create the candidate submission in the database
    const candidateSubmission = await prisma.candidateSubmission.create({
      data: {
        name,
        party,
        position,
        bio,
        website: website || null,
        linkedin: linkedin || null,
        city,
        state,
        additionalNotes: additionalNotes || null,
        policies,
        electionId: electionId || null,
        status: "PENDING",
        clerkUserId: clerkUserId || null,
      },
    });

    // Prepare email details
    let submitterEmail: string | null = null;
    if (clerkUserId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(clerkUserId);
        const primaryEmail = user.emailAddresses.find(
          (e: { id: string }) => e.id === user.primaryEmailAddressId
        )?.emailAddress as string | undefined;
        submitterEmail =
          primaryEmail || user.emailAddresses[0]?.emailAddress || null;
      } catch (e) {
        console.error(
          "Could not fetch Clerk user email for candidate submission",
          e
        );
      }
    }

    // Try to find a matching candidate profile (for CTA)
    const candidateProfile = clerkUserId
      ? await prisma.candidate.findUnique({ where: { clerkUserId } })
      : null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Notify admin (Resend)
    await sendWithResend({
      to: process.env.ADMIN_EMAIL!,
      subject: `New Candidate Submission Request: ${candidateSubmission.name}`,
      html: renderAdminNotification({
        title: "New Candidate Submission",
        rows: [
          { label: "Name", value: candidateSubmission.name },
          { label: "Email", value: submitterEmail || "N/A" },
          { label: "Party", value: candidateSubmission.party },
          { label: "Position", value: candidateSubmission.position },
        ],
        intro: candidateSubmission.additionalNotes || undefined,
        ctaLabel: candidateProfile ? "View Candidate Profile" : undefined,
        ctaUrl: candidateProfile
          ? `${appUrl}/candidate/${candidateProfile.slug}`
          : undefined,
      }),
    });

    return NextResponse.json({
      success: true,
      candidateSubmission,
    });
  } catch (error) {
    console.error("Error submitting candidate:", error);
    return NextResponse.json(
      { error: "Failed to submit candidate information" },
      { status: 500 }
    );
  }
}

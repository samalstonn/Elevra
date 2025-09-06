export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { name, currentRole, city, state, bio, website, linkedin } = body;
    // Validate required
    if (!name || !currentRole || !city || !state || !bio) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const updated = await prisma.candidate.update({
      where: { clerkUserId: userId },
      data: {
        name,
        currentRole,
        currentCity: city,
        currentState: state,
        bio,
        website: website || null,
        linkedin: linkedin || null,
      },
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
// app/(api)/api/candidate/route.ts
//
import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Prisma, SubmissionStatus } from "@prisma/client";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";
import { generateUniqueSlug } from "@/lib/functions";

export async function GET(request: Request) {
  console.log("GET request to /api/candidate");
  try {
    // Get auth session to verify the request
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the clerkUserId from query parameters
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get("clerkUserId");
    console.log("clerkUserId", clerkUserId);

    // Ensure the requested clerkUserId matches the authenticated user
    if (!clerkUserId || clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Find the candidate in the database
    const candidate = await prisma.candidate.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        name: true,
        currentRole: true,
        currentCity: true,
        currentState: true,
        status: true,
        bio: true,
        website: true,
        linkedin: true,
        slug: true,
        history: true,
        donations: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
          },
        },
        elections: {
          select: {
            election: {
              select: {
                id: true,
                position: true,
                date: true,
                city: true,
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

    // new: grab their latest uploaded photo
    const photoRecord = await prisma.photo.findFirst({
      where: { uploadedBy: clerkUserId },
      orderBy: { createdAt: "desc" },
    });
    const photoUrl = photoRecord?.url ?? null;

    return NextResponse.json({ ...candidate, photoUrl });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Error fetching candidate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handles the POST request to create a new candidate.
 *
 * This function performs the following steps:
 * 1. Verifies the authentication session to ensure the user is authorized.
 * 2. Parses and validates the request body to ensure all required fields are present.
 * 3. Checks if the `clerkUserId` in the request matches the authenticated user's ID.
 * 4. Ensures that a candidate with the same `clerkUserId` does not already exist in the database.
 * 5. Creates a new candidate record in the database using the provided data.
 * 6. Sends an email notification about the new candidate signup using Nodemailer.
 *
 * @param request - The incoming HTTP request object.
 * @returns A JSON response indicating success or failure, with appropriate HTTP status codes:
 * - 401: Unauthorized if the user is not authenticated.
 * - 400: Bad Request if required fields are missing.
 * - 403: Forbidden if the `clerkUserId` does not match the authenticated user.
 * - 409: Conflict if a candidate with the same `clerkUserId` already exists.
 * - 500: Internal Server Error for database or other unexpected errors.
 */
export async function POST(request: Request) {
  try {
    // Get auth session to verify the request
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { name, city, state, website, linkedin, clerkUserId } = body;

    // Ensure the clerkUserId matches the authenticated user
    if (clerkUserId !== userId) {
      return NextResponse.json(
        { error: "clerkUserId does not match authenticated user" },
        { status: 403 }
      );
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { clerkUserId },
    });

    if (existingCandidate) {
      return NextResponse.json(
        { error: "Candidate with this user ID already exists" },
        { status: 409 }
      );
    }

    const uniqueSlug = await generateUniqueSlug(name, undefined, "candidate");
    console.info("Generated unique slug:", uniqueSlug);

    // Attempt to capture the user's primary email and persist it on Candidate
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const primaryEmail = user.emailAddresses.find(
        (e: { id: string }) => e.id === user.primaryEmailAddressId
      )?.emailAddress as string | undefined;
      const fallbackEmail = user.emailAddresses[0]?.emailAddress;
      body.email = primaryEmail || fallbackEmail || null;
    } catch (e) {
      console.error("Could not fetch Clerk user email for candidate signup", e);
    }

    body.status = "APPROVED" as SubmissionStatus;
    body.slug = uniqueSlug;
    body.verified = true;
    body.website = website || null;
    body.linkedin = linkedin || null;
    body.hidden = true;
    body.currentCity = city;
    body.currentState = state;
    // remove the city and state from the body
    delete body.city;
    delete body.state;

    const createData: Omit<Prisma.CandidateCreateInput, "id"> = body;

    try {
      const candidate = await prisma.candidate.create({
        data: createData,
      });
      // Notify admin (Resend)
      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await sendWithResend({
          to: process.env.ADMIN_EMAIL!,
          subject: `New Candidate Signup: ${candidate.name}`,
          html: renderAdminNotification({
            title: "New Candidate Signup",
            rows: [
              { label: "Name", value: candidate.name },
              { label: "Email", value: candidate.email || "N/A" },
            ],
            ctaLabel: "View Candidate Profile",
            ctaUrl: `${appUrl}/candidate/${candidate.slug}`,
          }),
        });
      } catch (emailError: unknown) {
        console.error("Error sending notification email:", emailError);
      }
      return NextResponse.json(candidate);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Prisma error:", error);
        return NextResponse.json(
          { error: "Database error creating candidate" },
          { status: 500 }
        );
      }
      console.error("Prisma error:", error);
      return NextResponse.json(
        { error: "Database error creating candidate" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error creating candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Error creating candidate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

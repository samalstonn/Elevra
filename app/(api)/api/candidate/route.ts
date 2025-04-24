// app/(api)/api/candidate/route.ts
//
import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma, SubmissionStatus } from "@prisma/client";
import nodemailer from "nodemailer";
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
        party: true,
        position: true,
        city: true,
        state: true,
        status: true,
        bio: true,
        website: true,
        linkedin: true,
        // electionId removed
        policies: true,
        slug: true,
        votinglink: true,
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
    const {
      name,
      party,
      position,
      city,
      state,
      bio,
      website,
      linkedin,
      policies,
      clerkUserId,
      additionalNotes,
      electionId,
    } = body;

    // Validate required fields
    if (
      !name ||
      !party ||
      !position ||
      !city ||
      !state ||
      !bio ||
      !policies ||
      policies.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure the clerkUserId matches the authenticated user
    if (clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
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

    body.status = "APPROVED" as SubmissionStatus;
    body.slug = uniqueSlug;
    body.electionId = electionId || null;
    body.verified = true;
    body.website = website || null;
    body.linkedin = linkedin || null;
    body.additionalNotes = additionalNotes || null;
    body.hidden = true;

    const createData: Omit<Prisma.CandidateUncheckedCreateInput, "id"> = body;

    try {
      const candidate = await prisma.candidate.create({
        data: createData,
      });
      // Set up nodemailer transporter using your email service credentials
      const transporter = nodemailer.createTransport({
        service: "gmail", // or another service
        auth: {
          user: process.env.EMAIL_USER, // your email address
          pass: process.env.EMAIL_PASS, // your email password or app password
        },
      });

      // Define email options
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.MY_EMAIL, // your email address to receive notifications
        subject: `New Candidate Signup: ${candidate.name}`,
        text: `A new candidate has signed up.\n\nName: ${candidate.name}\nLocation: ${candidate.city}, ${candidate.state}
        : ${body}`,
      };

      // Attempt to send the email
      try {
        await transporter.sendMail(mailOptions);
      } catch (emailError: unknown) {
        if (emailError instanceof Error) {
          console.error(
            "Error sending notification email:",
            emailError.message
          );
        } else {
          console.error("Error sending notification email:", emailError);
        }
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

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import nodemailer from "nodemailer";

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
      subject: `New Candidate Submission Request: ${candidateSubmission.name}`,
      text: `Name: ${candidateSubmission.name}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

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

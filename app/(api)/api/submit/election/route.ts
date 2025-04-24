import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Extract the data
    const {
      position,
      date,
      city,
      state,
      description,
      positions,
      type,
      clerkUserId,
    } = body;

    // Validate required fields
    if (
      !position ||
      !date ||
      !city ||
      !state ||
      !description ||
      !positions ||
      !type
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that positions is a number
    if (isNaN(positions) || positions < 1) {
      return NextResponse.json(
        { error: "Positions must be a positive number" },
        { status: 400 }
      );
    }

    // Create the election submission in the database
    const officeSubmission = await prisma.officeSubmission.create({
      data: {
        position,
        city,
        state,
        description,
        positions,
        type,
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
      subject: `New Election Submission Request: ${officeSubmission.position}`,
      text: `At: ${officeSubmission.city}, ${officeSubmission.state}\n\nDescription: ${officeSubmission.description}\n\nPositions: ${electionSubmission.positions}\n\nType: ${electionSubmission.type}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return NextResponse.json({
      success: true,
      electionSubmission,
    });
  } catch (error) {
    console.error("Error submitting election:", error);
    return NextResponse.json(
      { error: "Failed to submit election information" },
      { status: 500 }
    );
  }
}

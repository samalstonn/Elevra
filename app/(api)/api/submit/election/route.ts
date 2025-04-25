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

    // Ensure the auto-increment sequence is in sync to avoid unique id conflicts
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"Election"', 'id'),
        (SELECT COALESCE(MAX(id), 1) FROM "Election")
      );
    `);

    // Create the election in the database
    const election = await prisma.election.create({
      data: {
        position,
        date: new Date(date),
        city,
        state,
        description,
        positions,
        type,
        active: true,
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
      subject: `New Election Submission Request: ${election.position} ${clerkUserId}`,
      text: `At: ${election.city}, ${election.state}\n\nDescription: ${election.description}\n\nPositions: ${election.positions}\n\nType: ${election.type}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    return NextResponse.json(election);
  } catch (error) {
    console.error("Error submitting election:", error);
    return NextResponse.json(
      { error: "Failed to submit election information" },
      { status: 500 }
    );
  }
}

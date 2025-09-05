import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";

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
    // Notify admin (Resend)
    await sendWithResend({
      to: process.env.ADMIN_EMAIL!,
      subject: `New Election Submission Request: ${election.position} ${clerkUserId}`,
      html: renderAdminNotification({
        title: "New Election Submission",
        rows: [
          { label: "Position", value: election.position },
          { label: "City", value: `${election.city}, ${election.state}` },
          { label: "Positions", value: String(election.positions) },
          { label: "Type", value: election.type },
        ],
        intro: election.description,
      }),
    });
    return NextResponse.json(election);
  } catch (error) {
    console.error("Error submitting election:", error);
    return NextResponse.json(
      { error: "Failed to submit election information" },
      { status: 500 }
    );
  }
}

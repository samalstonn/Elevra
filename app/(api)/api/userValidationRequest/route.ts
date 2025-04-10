import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    fullName,
    email,
    phone,
    position,
    website,
    linkedin,
    additionalInfo,
    city,
    state,
    candidateId,
    clerkUserId,
    electionId,
  } = body;

  if (!candidateId || isNaN(Number(candidateId))) {
    return NextResponse.json({ error: "Invalid candidateId" }, { status: 400 });
  }
  if (
    !clerkUserId ||
    typeof clerkUserId !== "string" ||
    clerkUserId.trim() === ""
  ) {
    return NextResponse.json({ error: "Invalid clerkUserId" }, { status: 400 });
  }
  if (!electionId || isNaN(Number(electionId))) {
    return NextResponse.json({ error: "Invalid electionId" }, { status: 400 });
  }

  const existingRequest = await prisma.userValidationRequest.findUnique({
    where: { clerkUserId: clerkUserId || "" },
  });

  if (existingRequest) {
    return NextResponse.json(
      {
        error: "A validation request for this user has already been submitted.",
      },
      { status: 400 }
    );
  }

  const userValidationRequest = await prisma.userValidationRequest.create({
    data: {
      fullName,
      email,
      phone,
      position,
      website,
      linkedin,
      additionalInfo,
      city,
      state,
      candidateId: Number(candidateId),
      clerkUserId,
      electionId: Number(electionId),
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
    subject: `New Validation Request: ${userValidationRequest.fullName}`,
    text: `Name: ${userValidationRequest.fullName}\nEmail: ${userValidationRequest.email}\nPhone: ${userValidationRequest.phone}}`,
  };

  // Send the email
  await transporter.sendMail(mailOptions);

  return NextResponse.json(userValidationRequest);
}

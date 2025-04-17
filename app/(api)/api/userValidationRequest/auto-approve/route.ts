import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import nodemailer from "nodemailer";
import { SubmissionStatus } from "@prisma/client";

// set up transporter (reuse your admin route setup)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const { slug, clerkUserId } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    if (!clerkUserId || typeof clerkUserId !== "string") {
      return NextResponse.json({ error: "Invalid clerkUserId" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({ where: { slug } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Update candidate record
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        status: SubmissionStatus.APPROVED,
        verified: true,
        clerkUserId,
      },
    });

    // Notify admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.MY_EMAIL,
      subject: `${candidate.name} profile approved on Elevra`,
      text: `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${candidate.slug}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in auto-approve:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

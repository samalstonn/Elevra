import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { name, email, subject, message, anonymous } = await req.json();

  if (!subject || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.MY_EMAIL,
    subject: `Elevra Feedback: ${subject}`,
    text:
      `Subject: ${subject}\n\nMessage:\n${message}\n\n` +
      (anonymous
        ? "Submitted anonymously"
        : `Name: ${name || "N/A"}\nEmail: ${email || "N/A"}`),
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

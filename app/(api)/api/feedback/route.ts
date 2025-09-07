import { NextRequest, NextResponse } from "next/server";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";

export async function POST(req: NextRequest) {
  const { name, email, subject, message, anonymous } = await req.json();

  if (!subject || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    await sendWithResend({
      to: process.env.ADMIN_EMAIL!,
      subject: `Elevra Feedback: ${subject}`,
      html: renderAdminNotification({
        title: "Feedback Submitted",
        intro: message,
        rows: [
          { label: "Name", value: anonymous ? "Anonymous" : name || "N/A" },
          { label: "Email", value: anonymous ? "Anonymous" : email || "N/A" },
        ],
      }),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { PrismaClient, SubmissionStatus } from "@prisma/client";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();
    if (!requestId || typeof requestId !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid requestId" },
        { status: 400 }
      );
    }
    const request = await prisma.userValidationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const candidate = await prisma.candidate.findUnique({
      where: { id: request.candidateId },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Invalid candidate" }, { status: 400 });
    }
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        name: request.fullName,
        website: request.website || null,
        linkedin: request.linkedin || null,
        currentCity: request.city,
        currentState: request.state,
        currentRole: request.position,
        email: request.email,
        phone: request.phone,
        status: SubmissionStatus.APPROVED,
        verified: true,
        clerkUserId: request.clerkUserId,
      },
    });
    await prisma.userValidationRequest.update({
      where: { id: request.id },
      data: { status: SubmissionStatus.APPROVED },
    });
    // Notify admin of approval (Resend)
    await sendWithResend({
      to: process.env.ADMIN_EMAIL!,
      subject: `${request.fullName} Elevra profile is now verified`,
      html: renderAdminNotification({
        title: "Candidate Profile Verified",
        intro: "A candidate profile has been approved.",
        rows: [
          { label: "Name", value: request.fullName },
          { label: "Slug", value: candidate.slug },
        ],
        ctaLabel: "View Profile",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${candidate.slug}`,
      }),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/candidate/verify/error", req.url));
  }

  return NextResponse.redirect(new URL("/admin/user-validation", req.url));
}

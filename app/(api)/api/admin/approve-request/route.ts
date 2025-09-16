import { NextResponse } from "next/server";
import { SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";
import { clerkClient } from "@clerk/nextjs/server";

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
    const emailResult = await sendWithResend({
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
    if (!emailResult?.id) {
      console.error("Admin approval email did not return an id from Resend");
      return NextResponse.json(
        { error: "Approval email failed to send" },
        { status: 500 }
      );
    }

    // Notify user of approval (non-blocking)
    try {
      let userEmail = request.email || null;
      if (!userEmail && request.clerkUserId) {
        try {
          const client = await clerkClient();
          const user = await client.users.getUser(request.clerkUserId);
          const primary = user.emailAddresses.find(
            (e: { id: string }) => e.id === user.primaryEmailAddressId
          )?.emailAddress as string | undefined;
          userEmail = primary || user.emailAddresses[0]?.emailAddress || null;
        } catch {}
      }
      if (userEmail) {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/candidates/candidate-dashboard?verified=1&slug=${candidate.slug}`;
        await sendWithResend({
          from: process.env.RESEND_FROM,
          to: userEmail,
          subject: "You're Verified on Elevra!",
          html: renderAdminNotification({
            title: "You're Verified on Elevra!",
            intro:
              "Your candidate profile has been approved. Visit your dashboard to customize your page and manage content.",
            rows: [
              { label: "Candidate", value: candidate.name },
              {
                label: "Profile",
                value: `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${candidate.slug}`,
              },
            ],
            ctaLabel: "Open Candidate Dashboard",
            ctaUrl: dashboardUrl,
          }),
        });
      }
    } catch (e) {
      console.warn("User approval email failed (non-blocking)", e);
    }
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/candidate/verify/error", req.url));
  }

  return NextResponse.redirect(new URL("/admin/user-validation", req.url));
}

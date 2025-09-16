import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { SubmissionStatus } from "@prisma/client";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";
import { davidWeinsteinTemplate } from "@/app/(templates)/basicwebpage";

// Using Resend helper; no transporter needed

export async function POST(req: Request) {
  try {
    const { slug, clerkUserId } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    if (!clerkUserId || typeof clerkUserId !== "string") {
      return NextResponse.json(
        { error: "Invalid clerkUserId" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({ where: { slug } });
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
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

    // Ensure each existing election link for this candidate has seeded content blocks
    const links = await prisma.electionLink.findMany({
      where: { candidateId: candidate.id },
      select: { electionId: true },
    });
    for (const link of links) {
      const count = await prisma.contentBlock.count({
        where: { candidateId: candidate.id, electionId: link.electionId },
      });
      if (count === 0) {
        await prisma.contentBlock.createMany({
          data: davidWeinsteinTemplate.map((block) => ({
            ...block,
            candidateId: candidate.id,
            electionId: link.electionId,
          })),
        });
      }
    }

    // Notify admin (Resend)
    await sendWithResend({
      to: process.env.ADMIN_EMAIL!,
      subject: `${candidate.name} profile approved on Elevra`,
      html: renderAdminNotification({
        title: "Candidate Profile Approved",
        intro: "An auto-approve action verified a candidate profile.",
        rows: [
          { label: "Name", value: candidate.name },
          { label: "Slug", value: candidate.slug },
        ],
        ctaLabel: "View Profile",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${candidate.slug}`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in auto-approve:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

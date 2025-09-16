import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import prisma from "@/prisma/prisma";
import { davidWeinsteinTemplate } from "@/app/(templates)/basicwebpage";
import { SubmissionStatus } from "@prisma/client";
import { sendWithResend } from "@/lib/email/resend";
import { renderAdminNotification } from "@/lib/email/templates/adminNotification";
import { redirect } from "next/navigation";
import CandidateVerificationForm from "./CandidateVerificationForm";
import { Suspense } from "react";
import type { Metadata } from "next";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string | undefined }>;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const idStr = resolved.candidateID as string | undefined;
  if (!idStr) return { title: "Verify Your Candidate Profile" };
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return { title: "Verify Your Candidate Profile" };
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!candidate?.name) return { title: "Verify Your Candidate Profile" };
  return { title: `Verify ${candidate.name}` };
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const candidate = resolvedSearchParams.candidate;
  const candidateID = resolvedSearchParams.candidateID;

  if (!candidate || !candidateID) {
    console.error("Missing verification params");
    redirect("/candidate/verify/error");
  }

  // 1) Load the candidate record
  const idNum = parseInt(candidateID, 10);
  const candidateRec = await prisma.candidate.findUnique({
    where: { id: idNum },
  });
  if (!candidateRec) {
    console.error(`No candidate found with id ${idNum}`);
    redirect("/candidate/verify/error");
  }

  // 2) Ensure user is signed in
  const { userId } = await auth();
  if (!userId) {
    // send them to Clerk sign‑in, then back here
    const returnUrl = `/candidate/verify?candidate=${candidate}&candidateID=${candidateID}`;
    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
  }

  // 3) Fetch Clerk user email
  const clerkUser = await clerkClient.users.getUser(userId);
  const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
  const matchesEmail =
    !!candidateRec.email &&
    !!userEmail &&
    candidateRec.email.toLowerCase() === userEmail.toLowerCase();

  if (matchesEmail) {
    // Auto-approve directly (avoid extra network + blank page during sign-in return)
    try {
      await prisma.candidate.update({
        where: { id: candidateRec.id },
        data: {
          status: SubmissionStatus.APPROVED,
          verified: true,
          clerkUserId: userId,
        },
      });
      // Backfill blocks for any existing election links without content
      const links = await prisma.electionLink.findMany({
        where: { candidateId: candidateRec.id },
        select: { electionId: true },
      });
      for (const link of links) {
        const count = await prisma.contentBlock.count({
          where: { candidateId: candidateRec.id, electionId: link.electionId },
        });
        if (count === 0) {
          await prisma.contentBlock.createMany({
            data: davidWeinsteinTemplate.map((block) => ({
              ...block,
              candidateId: candidateRec.id,
              electionId: link.electionId,
            })),
          });
        }
      }
    } catch (err) {
      console.error("Direct auto-approve failed:", err);
      redirect("/candidate/verify/error");
    }

    // Fire-and-forget admin notification (do not block redirect)
    try {
      void sendWithResend({
        to: process.env.ADMIN_EMAIL!,
        subject: `${candidateRec.name} profile approved on Elevra`,
        html: renderAdminNotification({
          title: "Candidate Profile Approved",
          intro: "An auto-approve action verified a candidate profile.",
          rows: [
            { label: "Name", value: candidateRec.name },
            { label: "Slug", value: candidateRec.slug },
          ],
          ctaLabel: "View Profile",
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${candidateRec.slug}`,
        }),
      });
    } catch (e) {
      console.warn("Admin email failed (non-blocking)", e);
    }

    // Redirect to dashboard with success flag
    redirect(`/candidates/candidate-dashboard?verified=1&slug=${candidate}`);
  }

  // 4b) If not matched, show the manual verification form
  return (
    <Suspense fallback={null}>
      <CandidateVerificationForm />
    </Suspense>
  );
}

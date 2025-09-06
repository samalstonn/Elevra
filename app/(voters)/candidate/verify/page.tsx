import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import prisma from "@/prisma/prisma";
import { redirect } from "next/navigation";
import CandidateVerificationForm from "./CandidateVerificationForm";
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
  if (userEmail === candidateRec.email) {
    // Auto-approve via API
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/userValidationRequest/auto-approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: candidate, clerkUserId: userId }),
      }
    );
    if (res.ok) {
      // On success, send them to their dashboard with a one-time flag and slug for onboarding popup
      redirect(`/candidates/candidate-dashboard?verified=1&slug=${candidate}`);
    } else {
      console.error("Error auto-approving candidate:", res.statusText);
      redirect("/candidate/verify/error");
    }
  }

  // 4b) If not matched, show the manual verification form
  return <CandidateVerificationForm />;
}

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/prisma/prisma";
import CandidateClient from "./CandidateClient";
import { currentUser } from "@clerk/nextjs/server";

interface CandidatePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CandidatePage({ params }: CandidatePageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Fetch candidate by slug
  const candidate = await prisma.candidate.findUnique({
    where: {
      slug: slug,
    },
  });

  if (!candidate) {
    notFound();
  }

  const candidateID = candidate.id;
  const electionID = candidate.electionId;

  // Fetch election details if available
  const election = electionID
    ? await prisma.election.findFirst({
        where: {
          id: electionID,
        },
        include: {
          candidates: true,
        },
      })
    : null;

  // Track page view
  const reqHeaders = headers();
  const viewerIp = (await reqHeaders).get("x-forwarded-for") || undefined;
  const userAgent = (await reqHeaders).get("user-agent") || undefined;
  const referrer = (await reqHeaders).get("referer") || undefined;

  await prisma.candidateProfileView.create({
    data: {
      candidateId: candidate.id,
      viewerIp,
      userAgent,
      referrerUrl: referrer,
    },
  });

  // Get suggested candidates
  const suggestedCandidates = await prisma.candidate.findMany({
    where: {
      NOT: { id: candidateID },
      hidden: false,
    },
    include: {
      election: true,
    },
  });

  // Check if current user can edit this candidate profile
  const user = await currentUser();
  const currentUserId = user ? user.id : null;
  const isEditable =
    currentUserId !== null && currentUserId === candidate.clerkUserId;

  return (
    <CandidateClient
      candidate={candidate}
      election={election}
      suggestedCandidates={suggestedCandidates}
      isEditable={isEditable}
    />
  );
}

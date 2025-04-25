export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/prisma/prisma";
import CandidateClient from "./CandidateClient";
import type { ElectionWithCandidates } from "./CandidateClient";
import { currentUser } from "@clerk/nextjs/server";

interface CandidatePageProps {
  params: Promise<{ slug: string }>;
  searchParams: { election?: string };
}

export default async function CandidatePage({
  params,
  searchParams,
}: CandidatePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
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

  // Fetch all election links for this candidate, including election details and full candidate info
  const links = await prisma.electionLink.findMany({
    where: { candidateId: candidateID },
    include: {
      election: {
        include: {
          candidates: {
            include: {
              candidate: true,
            },
          },
        },
      },
    },
  });

  // Map links to include only the full Candidate objects in election.candidates
  const linksWithFullCandidates = links.map((link) => ({
    ...link,
    election: {
      ...link.election,
      candidates: link.election.candidates.map((ec: any) => ec.candidate),
    },
  }));

  // Pick the active link by query param or default if only one
  const electionIdParam = resolvedSearchParams.election
    ? parseInt(resolvedSearchParams.election, 10)
    : undefined;

  let selectedLink = null;
  if (electionIdParam != null) {
    selectedLink = links.find((l) => l.electionId === electionIdParam) ?? null;
    if (!selectedLink) notFound();
  } else if (links.length === 1) {
    selectedLink = links[0];
  }

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
    // No include necessary here
  });

  // Check if current user can edit this candidate profile
  const user = await currentUser();
  const currentUserId = user ? user.id : null;
  const isEditable =
    currentUserId !== null && currentUserId === candidate.clerkUserId;

  return (
    <CandidateClient
      candidate={candidate}
      electionLinks={linksWithFullCandidates}
      suggestedCandidates={suggestedCandidates}
      isEditable={isEditable}
    />
  );
}

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

  // Fetch all election links for this candidate, including election details (no candidates)
  const links = await prisma.electionLink.findMany({
    where: { candidateId: candidateID },
    include: { election: true },
  });

  // Pick the active link by query param or default if only one
  const electionIdParam = searchParams.election
    ? parseInt(searchParams.election, 10)
    : undefined;

  let selectedLink = null;
  if (electionIdParam != null) {
    selectedLink = links.find((l) => l.electionId === electionIdParam) ?? null;
    if (!selectedLink) notFound();
  } else if (links.length === 1) {
    selectedLink = links[0];
  }

  // Fetch raw election-link join data with nested candidate
  let electionWithCandidates: ElectionWithCandidates | null = null;
  if (selectedLink) {
    const raw = await prisma.election.findUnique({
      where: { id: selectedLink.electionId },
      include: {
        candidates: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                slug: true,
                position: true,
                createdAt: true,
                updatedAt: true,
                city: true,
                state: true,
                hidden: true,
                party: true,
                policies: true,
                website: true,
                linkedin: true,
                photo: true,
                sources: true,
                status: true,
                votinglink: true,
                clerkUserId: true,
                additionalNotes: true,
                verified: true,
                phone: true,
                email: true,
                bio: true,
                history: true,
                photoUrl: true,
                donationCount: true,
              },
            },
          },
        },
      },
    });
    if (!raw) notFound();
    // Re-map to ElectionWithCandidates shape
    electionWithCandidates = {
      id: raw.id,
      position: raw.position,
      date: raw.date,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      active: raw.active,
      city: raw.city,
      description: raw.description,
      positions: raw.positions,
      state: raw.state,
      type: raw.type,
      hidden: raw.hidden,
      candidates: raw.candidates.map((link) => ({
        ...link.candidate,
        bio: link.candidate.bio,
        history: link.candidate.history,
        photoUrl: link.candidate.photoUrl,
        donationCount: link.candidate.donationCount,
      })),
    };
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
      electionLinks={links}
      suggestedCandidates={suggestedCandidates}
      isEditable={isEditable}
    />
  );
}

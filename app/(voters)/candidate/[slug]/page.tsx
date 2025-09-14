export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/prisma/prisma";
import CandidateClient from "./CandidateClient";
import { Candidate, ElectionType } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";

interface CandidatePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ election?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CandidatePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;

  const candidate = await prisma.candidate.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!candidate) {
    return { title: "Candidate Not Found" };
  }

  let title = `${candidate.name} – Candidate`;
  const electionIdParam = resolvedSearchParams?.election
    ? parseInt(resolvedSearchParams.election, 10)
    : undefined;

  if (electionIdParam != null && !Number.isNaN(electionIdParam)) {
    const election = await prisma.election.findUnique({
      where: {
        id: electionIdParam,
        ...(process.env.NODE_ENV === "production" ? { hidden: false } : {}),
      },
      select: { position: true, city: true, state: true },
    });
    if (election?.position) {
      const loc = [election.city, election.state].filter(Boolean).join(", ");
      title = `${candidate.name} – ${election.position}${
        loc ? ` (${loc})` : ""
      }`;
    }
  }

  return { title };
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

  // In production, do not expose candidates marked as hidden
  if (process.env.NODE_ENV === "production" && candidate.hidden) {
    notFound();
  }

  const candidateID = candidate.id;

  // Fetch all election links for this candidate, including election details and full candidate info
  const links = await prisma.electionLink.findMany({
    where: {
      candidateId: candidateID,
      ...(process.env.NODE_ENV === "production"
        ? { election: { hidden: false } }
        : {}),
    },
    include: {
      ContentBlock: true,
      election: {
        include: {
          candidates: {
            where: { candidate: { hidden: false } },
            include: {
              candidate: true,
            },
          },
        },
      },
    },
  });

  // Note: Previously, production returned 404 when a candidate had only
  // links to hidden elections. To allow direct access by slug while still
  // preventing discovery, we no longer 404 in this case. The page will
  // render without election context if all linked elections are hidden.

  interface ElectionCandidate {
    candidate: Candidate;
  }

  // Map links to include only the full Candidate objects in election.candidates
  const linksWithFullCandidates = links.map((link) => ({
    ...link,
    election: {
      ...link.election,
      candidates: link.election.candidates.map(
        (ec: ElectionCandidate) => ec.candidate
      ),
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

  // Get suggested candidates (only those with actual images)
  const suggestedCandidatesRaw = await prisma.candidate.findMany({
    where: {
      id: { not: candidateID },
      hidden: false,
      elections: {
        some: {
          election: { type: ElectionType.LOCAL },
        },
      },
    },
  });
  const suggestedCandidates = suggestedCandidatesRaw.filter(
    (c) =>
      (c.photo && c.photo.trim() !== "") ||
      (c.photoUrl && c.photoUrl.trim() !== "")
  );

  // Check if current user can edit this candidate profile
  const user = await currentUser();
  const currentUserId = user ? user.id : null;
  const isEditable =
    currentUserId !== null && currentUserId === candidate.clerkUserId;

  return (
    <div className="md:px-40">
      <CandidateClient
        candidate={candidate}
        electionLinks={linksWithFullCandidates}
        suggestedCandidates={suggestedCandidates}
        isEditable={isEditable}
      />
    </div>
  );
}

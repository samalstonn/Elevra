export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/prisma/prisma";
import CandidateClient from "./CandidateClient";
import { currentUser } from "@clerk/nextjs/server";

export default async function CandidatePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const candidateIDParam = resolvedSearchParams.candidateID;
  const electionIDParam = resolvedSearchParams.electionID;

  if (!candidateIDParam || !electionIDParam) {
    // Redirect the user to the homepage if parameters are missing.
    redirect("/");
  }

  // Remove any extra query parameters from the candidateID and electionID values
  const candidateID = Array.isArray(candidateIDParam)
    ? candidateIDParam[0].split("?")[0]
    : candidateIDParam.split("?")[0];

  const electionID = electionIDParam
    ? Array.isArray(electionIDParam)
      ? electionIDParam[0].split("?")[0]
      : electionIDParam.split("?")[0]
    : null;
  console.log(
    "Election ID:",
    electionID === "null" ? electionID : "No election ID provided"
  );
  const election =
    electionID === "null"
      ? null
      : await prisma.election.findFirst({
          where: {
            id: Number(electionID),
          },
          include: {
            candidates: true,
          },
        });

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: Number(candidateID),
      electionId: Number(electionID),
    },
  });
  if (!candidate) {
    notFound();
  }

  const reqHeaders = await headers();
  const viewerIp = reqHeaders.get("x-forwarded-for") || undefined;
  const userAgent = reqHeaders.get("user-agent") || undefined;
  const referrer = reqHeaders.get("referer") || undefined;

  await prisma.candidateProfileView.create({
    data: {
      candidateId: candidate.id,
      viewerIp,
      userAgent,
      referrerUrl: referrer,
    },
  });

  const suggestedCandidates = await prisma.candidate.findMany({
    where: {
      NOT: { id: candidate.id,  }, // Exclude the current candidate and election
      hidden: false
    },
    include: {
      election: true,
    },
  });

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

export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import prisma from "@/prisma/prisma"; 
import CandidateClient from "./CandidateClient";
import { currentUser } from '@clerk/nextjs/server'



export default async function CandidatePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const candidateIDParam = resolvedSearchParams.candidateID;
  const electionIDParam = resolvedSearchParams.electionID;
  
  if (!candidateIDParam || !electionIDParam) {
    // Redirect the user to the homepage if parameters are missing.
    redirect("/");
  }
  
  // Remove any extra query parameters from the candidateID and electionID values
  const candidateID = Array.isArray(candidateIDParam) ? candidateIDParam[0].split('?')[0] : candidateIDParam.split('?')[0];
  const electionID = Array.isArray(electionIDParam) ? electionIDParam[0].split('?')[0] : electionIDParam.split('?')[0];
  
  // Proceed with the query after ensuring the parameters are present:
  const election = await prisma.election.findUnique({
    where: { id: Number(electionID) },
    include: { candidates: true },
  });
  if (!election) {
    notFound();
  }
  
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: Number(candidateID),
      electionId: Number(electionID),
    },
  });
  if (!candidate) {
    notFound();
  }

  const suggestedCandidates = await prisma.candidate.findMany({
    where: {
      NOT: { id: candidate.id, electionId: candidate.electionId }, // Exclude the current candidate and election
    },
    include: {
      election: true,
    }
  });

  const user = await currentUser();
  const currentUserId = user ? user.id : null;
  const isEditable = currentUserId === candidate.clerkUserId
  
  return <CandidateClient candidate={candidate} election={election} suggestedCandidates={suggestedCandidates} isEditable={isEditable} />;
}
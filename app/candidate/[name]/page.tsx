
import { notFound, redirect } from "next/navigation";
import prisma from "@/prisma/prisma"; 
import CandidateClient from "./CandidateClient";

export default async function CandidatePage({
  searchParams,
}: {
  searchParams: { candidateID?: string; electionID?: string };
}) {
  const candidateIDParam = searchParams.candidateID;
  const electionIDParam = searchParams.electionID;
  
  if (!candidateIDParam || !electionIDParam) {
    // Redirect the user to the homepage if parameters are missing.
    redirect("/");
  }
  
  // Remove any extra query parameters from the candidateID and electionID values
  const candidateID = candidateIDParam.split('?')[0];
  const electionID = electionIDParam.split('?')[0];
  
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

  // 2. Fetch suggested candidates for this election
  const suggestedCandidates = await prisma.candidate.findMany({
    where: {
      NOT: { id: candidate.id, electionId: candidate.electionId }, // Exclude the current candidate and election
    },
    take: 3, 
    include: {
      election: true,
    }
  });
  
  return <CandidateClient candidate={candidate} election={election} suggestedCandidates={suggestedCandidates}/>;
}
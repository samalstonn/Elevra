// app/candidate/[name]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/prisma/prisma"; 
import CandidateClient from "./CandidateClient";

export default async function CandidatePage({
  searchParams,
}: {
  searchParams: { candidateID: string; electionID: string };
}) {
  const { candidateID, electionID } = searchParams;

  // Fetch the election from the database using the provided electionID
  const election = await prisma.election.findUnique({
    where: { id: Number(electionID) },
    include: { candidates: true },
  });
  if (!election) {
    notFound();
  }

  // Fetch the candidate associated with the election using candidateID and ensuring it belongs to the election
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: Number(candidateID),
      electionId: Number(electionID),
    },
  });
  if (!candidate) {
    notFound();
  }

  return <CandidateClient candidate={candidate} election={election} />;
}
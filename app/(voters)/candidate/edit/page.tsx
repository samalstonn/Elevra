export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import prisma from "@/prisma/prisma";
import { currentUser } from "@clerk/nextjs/server";
import EditCandidateForm from "./EditCandidateForm"; 


export default async function EditCandidatePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedSearchParams = await searchParams;
    const candidateID = resolvedSearchParams.candidateID;
    const electionID = resolvedSearchParams.electionID;
  
  if (!candidateID || !electionID) {
    redirect("/");
  }
  
  // Get the current user from Clerk
  const user = await currentUser();
  if (!user) {
    // Redirect to sign in if not logged in
    redirect("/sign-in");
  }
  
  // Get the candidate
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: Number(candidateID),
      electionId: Number(electionID),
    },
  });
  
  if (!candidate) {
    redirect("/");
  }
  
  // Check if the current user is the owner of this candidate profile
  if (candidate.clerkUserId !== user.id) {
    // Redirect if not the owner
    if (user?.primaryEmailAddress?.emailAddress !== "sza6@cornell.edu"){
      redirect(`/candidate/${candidate.name}?candidateID=${candidate.id}&electionID=${candidate.electionId}`);
    }
  }
  
  // Get the election data
  const election = await prisma.election.findUnique({
    where: { id: Number(electionID) },
    include: { candidates: true },
  });
  
  return <EditCandidateForm candidate={candidate} election={election} />;
}
import CandidateEndorsementsClient from "./EndorsementsClient";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidate Dashboard – Endorsements",
};

export default async function CandidateEndorsementsPage() {
  const user = await currentUser();
  if (!user?.id) return null;

  // Look up this user's candidate record
  const candidate = await prisma.candidate.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });
  if (!candidate) {
    // No candidate record – render empty state
    return (
      <CandidateEndorsementsClient
        user={{
          id: user.id,
          firstName: user.firstName,
          username: user.username,
          imageUrl: user.imageUrl || "",
        }}
        data={{ endorsements: [], totalEndorsements: 0 }}
      />
    );
  }

  // Fetch endorsements directly from the database
  const endorsementsList = await prisma.endorsement.findMany({
    where: { candidateId: candidate.id, hidden: false },
    orderBy: { createdAt: "desc" },
  });

  // Convert Prisma Dates to strings for the client
  const clientEndorsements = endorsementsList.map((e) => ({
    id: e.id,
    endorserName: e.endorserName,
    relationshipDescription: e.relationshipDescription,
    content: e.content,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <CandidateEndorsementsClient
      user={{
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        imageUrl: user.imageUrl || "",
      }}
      data={{
        endorsements: clientEndorsements,
        totalEndorsements: clientEndorsements.length,
      }}
    />
  );
}

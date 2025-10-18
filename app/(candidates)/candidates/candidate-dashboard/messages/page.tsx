import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import CandidateMessagesClient from "./MessagesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidate Dashboard – Messages",
};

export default async function CandidateMessagesPage() {
  const user = await currentUser();
  if (!user?.id) {
    return null;
  }

  const candidate = await prisma.candidate.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });

  if (!candidate) {
    return <CandidateMessagesClient messages={[]} />;
  }

  const messages = await prisma.candidateMessage.findMany({
    where: { candidateId: candidate.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = messages.map((message) => ({
    id: message.id,
    subject: message.subject,
    body: message.body,
    senderName: message.senderName,
    senderEmail: message.senderEmail,
    createdAt: message.createdAt.toISOString(),
  }));

  return <CandidateMessagesClient messages={serialized} />;
}

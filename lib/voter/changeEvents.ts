import type { ChangeEventType, EmailMode, NotificationType } from "@prisma/client";
import prisma from "@/prisma/prisma";
import { enqueueVoterUpdateEmail } from "@/lib/email/voterQueue";

type RecordChangeEventArgs = {
  candidateId: number;
  type: ChangeEventType;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function recordChangeEvent({
  candidateId,
  type,
  summary,
  metadata = {},
}: RecordChangeEventArgs) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const changeEvent = await prisma.changeEvent.create({
    data: {
      candidateId,
      type,
      metadata: { summary, ...metadata },
    },
  });

  const followers = await prisma.follow.findMany({
    where: { candidateId },
    include: {
      voter: {
        include: {
          preferences: true,
        },
      },
    },
  });

  if (followers.length === 0) {
    return changeEvent;
  }

  const notificationsData = followers.map((follow) => ({
    voterId: follow.voterId,
    changeEventId: changeEvent.id,
    type: "CANDIDATE_UPDATE" as NotificationType,
    payload: { summary },
  }));

  await prisma.notification.createMany({
    data: notificationsData,
  });

  for (const follow of followers) {
    const preferences = follow.voter.preferences;
    if (!preferences) continue;
    if (!isTypeEnabled(type, preferences)) {
      continue;
    }

    if (preferences.emailMode === "IMMEDIATE") {
      enqueueVoterUpdateEmail({
        voterEmail: follow.voter.email,
        voterName: follow.voter.email.split("@")[0],
        candidateName: candidate.name,
        candidateSlug: candidate.slug,
        summary,
        updateType: type,
      });
    }
  }

  return changeEvent;
}

function isTypeEnabled(
  type: ChangeEventType,
  preferences: {
    emailMode: EmailMode;
    notifyBio: boolean;
    notifyEducation: boolean;
    notifyPhoto: boolean;
    notifyCampaign: boolean;
  }
) {
  if (preferences.emailMode === "OFF") {
    return false;
  }
  switch (type) {
    case "BIO":
      return preferences.notifyBio;
    case "EDUCATION":
      return preferences.notifyEducation;
    case "PHOTO":
      return preferences.notifyPhoto;
    case "CAMPAIGN":
    default:
      return preferences.notifyCampaign;
  }
}

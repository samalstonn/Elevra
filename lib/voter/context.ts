import { EmailMode } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export class VoterHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type VoterContext = {
  voter: Awaited<ReturnType<typeof ensureVoter>>;
  preferences: Awaited<ReturnType<typeof ensurePreferences>>;
  clerkUser: Awaited<ReturnType<typeof fetchClerkUser>>;
};

export async function requireVoterContext(): Promise<VoterContext> {
  const { userId } = await auth();
  if (!userId) {
    throw new VoterHttpError(401, "Unauthorized");
  }

  const clerkUser = await fetchClerkUser(userId);
  if (!isVoter(clerkUser.publicMetadata)) {
    throw new VoterHttpError(403, "Voter role required");
  }

  const voter = await ensureVoter(userId, clerkUser);
  const preferences = await ensurePreferences(voter.id);
  return { voter, preferences, clerkUser };
}

function isVoter(metadata: Record<string, unknown> | null | undefined): boolean {
  return Boolean(metadata && (metadata as { isVoter?: boolean }).isVoter === true);
}

async function fetchClerkUser(userId: string) {
  const client = await clerkClient();
  return client.users.getUser(userId);
}

async function ensureVoter(
  clerkUserId: string,
  clerkUser: Awaited<ReturnType<typeof fetchClerkUser>>
) {
  const primaryEmail =
    clerkUser.emailAddresses?.[0]?.emailAddress ?? `${clerkUserId}@local-test`;

  return prisma.voter.upsert({
    where: { clerkUserId },
    update: {
      email: primaryEmail,
    },
    create: {
      clerkUserId,
      email: primaryEmail,
    },
  });
}

async function ensurePreferences(voterId: number) {
  return prisma.voterPreference.upsert({
    where: { voterId },
    update: {},
    create: {
      voterId,
      emailMode: EmailMode.IMMEDIATE,
    },
  });
}

export function handleVoterError(error: unknown) {
  if (error instanceof VoterHttpError) {
    return {
      status: error.status,
      body: { error: error.message },
    };
  }
  console.error("[VOTER_API_ERROR]", error);
  return {
    status: 500,
    body: { error: "Internal Server Error" },
  };
}

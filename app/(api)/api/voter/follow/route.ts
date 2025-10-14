import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";
import { enqueueCandidateFollowerEmail } from "@/lib/email/voterQueue";

const payloadSchema = z.object({
  candidateId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { candidateId } = parsed.data;
    const { voter } = await requireVoterContext();

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, hidden: false },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        clerkUserId: true,
      },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        voterId_candidateId: {
          voterId: voter.id,
          candidateId: candidate.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ ok: true, alreadyFollowing: true });
    }

    await prisma.follow.create({
      data: {
        voterId: voter.id,
        candidateId: candidate.id,
      },
    });

    if (candidate.email) {
      enqueueCandidateFollowerEmail({
        candidateEmail: candidate.email,
        candidateName: candidate.name,
        followerName: voter.email,
      });
    }

    return NextResponse.json({ ok: true, alreadyFollowing: false });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}

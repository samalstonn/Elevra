import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const candidateIdParam = url.searchParams.get("candidateId");
    const { voter } = await requireVoterContext();

    if (candidateIdParam) {
      const candidateId = Number(candidateIdParam);
      if (!Number.isFinite(candidateId) || candidateId <= 0) {
        return NextResponse.json({ error: "Invalid candidateId" }, { status: 400 });
      }
      const existing = await prisma.follow.findUnique({
        where: {
          voterId_candidateId: {
            voterId: voter.id,
            candidateId,
          },
        },
        select: { voterId: true },
      });
      return NextResponse.json({ isFollowing: Boolean(existing) });
    }

    const follows = await prisma.follow.findMany({
      where: { voterId: voter.id },
      orderBy: { createdAt: "desc" },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            slug: true,
            currentRole: true,
            currentCity: true,
            currentState: true,
            photo: true,
            photoUrl: true,
            verified: true,
          },
        },
      },
    });

    return NextResponse.json({
      follows: follows.map((item) => ({
        candidateId: item.candidateId,
        followedAt: item.createdAt,
        candidate: {
          id: item.candidate.id,
          name: item.candidate.name,
          slug: item.candidate.slug,
          currentRole: item.candidate.currentRole,
          currentCity: item.candidate.currentCity,
          currentState: item.candidate.currentState,
          photo: item.candidate.photo ?? item.candidate.photoUrl ?? null,
          verified: item.candidate.verified,
        },
      })),
    });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}

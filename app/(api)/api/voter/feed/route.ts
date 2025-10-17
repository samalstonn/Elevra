import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";

export async function GET() {
  try {
    const { voter } = await requireVoterContext();

    const followedIds = await prisma.follow.findMany({
      where: { voterId: voter.id },
      select: { candidateId: true },
    });
    if (followedIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const events = await prisma.changeEvent.findMany({
      where: {
        candidateId: {
          in: followedIds.map((f) => f.candidateId),
        },
      },
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
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    return NextResponse.json({
      events: events.map((event) => ({
        id: event.id,
        type: event.type,
        createdAt: event.createdAt,
        metadata: event.metadata,
        candidate: {
          id: event.candidate.id,
          name: event.candidate.name,
          slug: event.candidate.slug,
          currentRole: event.candidate.currentRole,
          currentCity: event.candidate.currentCity,
          currentState: event.candidate.currentState,
          photo: event.candidate.photo ?? event.candidate.photoUrl ?? null,
          verified: event.candidate.verified,
        },
      })),
    });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}

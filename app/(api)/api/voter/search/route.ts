import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/prisma/prisma";
import {
  handleVoterError,
  requireVoterContext,
} from "@/lib/voter/context";

const querySchema = z.object({
  q: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    await requireVoterContext();
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }
    const query = parsed.data.q.trim();
    if (!query) {
      return NextResponse.json({ candidates: [], elections: [] });
    }

    const [candidates, elections] = await Promise.all([
      prisma.candidate.findMany({
        where: {
          hidden: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { currentCity: { contains: query, mode: "insensitive" } },
            { currentState: { contains: query, mode: "insensitive" } },
            { currentRole: { contains: query, mode: "insensitive" } },
          ],
        },
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
        take: 8,
      }),
      prisma.election.findMany({
        where: {
          hidden: false,
          OR: [
            { position: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { state: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          position: true,
          city: true,
          state: true,
          date: true,
        },
        take: 6,
      }),
    ]);

    return NextResponse.json({
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        slug: candidate.slug,
        currentRole: candidate.currentRole,
        currentCity: candidate.currentCity,
        currentState: candidate.currentState,
        photo: candidate.photo ?? candidate.photoUrl ?? null,
        verified: candidate.verified,
      })),
      elections,
    });
  } catch (error) {
    const { status, body } = handleVoterError(error);
    return NextResponse.json(body, { status });
  }
}

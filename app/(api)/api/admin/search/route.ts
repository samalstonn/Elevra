import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { requireAdminOrSubAdmin } from "@/lib/admin-auth";

const MAX_LIMIT = 50;

type SearchType = "candidate" | "election" | "all";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await requireAdminOrSubAdmin(userId);
  if (!flags) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const rawType = (searchParams.get("type")?.toLowerCase() ?? "all") as SearchType;
  const type: SearchType = ["candidate", "election", "all"].includes(rawType)
    ? rawType
    : "all";
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : 20;

  const candidatePromise =
    type === "candidate" || type === "all"
      ? prisma.candidate
          .findMany({
            where: buildCandidateWhere(query),
            include: {
              elections: {
                take: 5,
                include: {
                  election: {
                    select: {
                      id: true,
                      position: true,
                      city: true,
                      state: true,
                      date: true,
                      type: true,
                      hidden: true,
                    },
                  },
                },
              },
            },
            orderBy: [{ verified: "desc" }, { updatedAt: "desc" }],
            take: limit,
          })
      : Promise.resolve([]);

  const electionPromise =
    type === "election" || type === "all"
      ? prisma.election
          .findMany({
            where: buildElectionWhere(query),
            include: {
              _count: {
                select: {
                  candidates: true,
                },
              },
              candidates: {
                take: 5,
                include: {
                  candidate: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      verified: true,
                      hidden: true,
                    },
                  },
                },
              },
            },
            orderBy: { date: "desc" },
            take: limit,
          })
      : Promise.resolve([]);

  const [candidates, elections] = await Promise.all([candidatePromise, electionPromise]);

  return NextResponse.json({
    query,
    type,
    isAdmin: flags.isAdmin,
    isSubAdmin: flags.isSubAdmin,
    candidates: candidates.map((candidate) => ({
      type: "candidate" as const,
      id: candidate.id,
      name: candidate.name,
      slug: candidate.slug,
      email: candidate.email,
      currentRole: candidate.currentRole,
      currentCity: candidate.currentCity,
      currentState: candidate.currentState,
      status: candidate.status,
      verified: candidate.verified,
      hidden: candidate.hidden,
      updatedAt: candidate.updatedAt.toISOString(),
      createdAt: candidate.createdAt.toISOString(),
      elections: candidate.elections.map((link) => ({
        id: link.election.id,
        position: link.election.position,
        city: link.election.city,
        state: link.election.state,
        date: link.election.date.toISOString(),
        type: link.election.type,
        hidden: link.election.hidden,
      })),
    })),
    elections: elections.map((election) => ({
      type: "election" as const,
      id: election.id,
      position: election.position,
      city: election.city,
      state: election.state,
      date: election.date.toISOString(),
      electionType: election.type,
      hidden: election.hidden,
      candidateCount: election._count.candidates,
      sampleCandidates: election.candidates.map((link) => ({
        id: link.candidate.id,
        name: link.candidate.name,
        slug: link.candidate.slug,
        verified: link.candidate.verified,
        hidden: link.candidate.hidden,
      })),
    })),
  });
}

function buildCandidateWhere(query: string) {
  if (!query) {
    return {};
  }

  const insensitive = {
    contains: query,
    mode: "insensitive" as const,
  };

  return {
    OR: [
      { name: insensitive },
      { slug: insensitive },
      { email: insensitive },
      { currentRole: insensitive },
      { currentCity: insensitive },
      { currentState: insensitive },
      {
        elections: {
          some: {
            election: {
              OR: [
                { position: insensitive },
                { city: insensitive },
                { state: insensitive },
              ],
            },
          },
        },
      },
    ],
  };
}

function buildElectionWhere(query: string) {
  if (!query) {
    return {};
  }

  const insensitive = {
    contains: query,
    mode: "insensitive" as const,
  };

  return {
    OR: [
      { position: insensitive },
      { city: insensitive },
      { state: insensitive },
      {
        candidates: {
          some: {
            candidate: {
              OR: [
                { name: insensitive },
                { slug: insensitive },
                { email: insensitive },
              ],
            },
          },
        },
      },
    ],
  };
}

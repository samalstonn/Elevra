import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/prisma/prisma";
import { requireAdminOrSubAdmin } from "@/lib/admin-auth";

const MAX_LIMIT = 100;

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
  const rawType = (searchParams.get("type")?.toLowerCase() ??
    "all") as SearchType;
  const type: SearchType = ["candidate", "election", "all"].includes(rawType)
    ? rawType
    : "all";
  const rawVisibility = (
    searchParams.get("visibility")?.toLowerCase() ?? "all"
  ).trim();
  const visibility: "all" | "visible" | "hidden" = [
    "all",
    "visible",
    "hidden",
  ].includes(rawVisibility)
    ? (rawVisibility as "all" | "visible" | "hidden")
    : "all";
  const hiddenFilter =
    visibility === "hidden" ? true : visibility === "visible" ? false : null;
  const rawVerification = (
    searchParams.get("verified")?.toLowerCase() ?? "all"
  ).trim();
  const verification: "all" | "verified" | "unverified" = [
    "all",
    "verified",
    "unverified",
  ].includes(rawVerification)
    ? (rawVerification as "all" | "verified" | "unverified")
    : "all";
  const verifiedFilter =
    verification === "verified"
      ? true
      : verification === "unverified"
        ? false
        : null;
  const uploadedByParam = searchParams.get("uploadedBy")?.trim();
  const uploadedBy =
    uploadedByParam && uploadedByParam !== "all" ? uploadedByParam : null;
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : 20;

  const candidatePromise =
    type === "candidate" || type === "all"
      ? prisma.candidate.findMany({
          where: buildCandidateWhere(
            query,
            hiddenFilter,
            uploadedBy,
            verifiedFilter
          ),
          include: {
            elections: {
              take: 10,
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
      ? prisma.election.findMany({
          where: buildElectionWhere(query, hiddenFilter, uploadedBy),
          include: {
            candidates: {
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
              orderBy: {
                candidate: {
                  name: "asc",
                },
              },
            },
          },
          orderBy: { date: "desc" },
          take: limit,
        })
      : Promise.resolve([]);

  const uploaderPromise = prisma.$transaction([
    prisma.candidate.findMany({
      distinct: ["uploadedBy"],
      select: { uploadedBy: true },
    }),
    prisma.election.findMany({
      distinct: ["uploadedBy"],
      select: { uploadedBy: true },
    }),
  ]);

  const [candidates, elections, [candidateUploaders, electionUploaders]] =
    await Promise.all([candidatePromise, electionPromise, uploaderPromise]);
  const uploaderSet = new Set<string>();
  candidateUploaders.forEach((entry) => {
    if (entry.uploadedBy) uploaderSet.add(entry.uploadedBy);
  });
  electionUploaders.forEach((entry) => {
    if (entry.uploadedBy) uploaderSet.add(entry.uploadedBy);
  });
  const uploaders = Array.from(uploaderSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return NextResponse.json({
    query,
    type,
    isAdmin: flags.isAdmin,
    isSubAdmin: flags.isSubAdmin,
    visibility,
    uploadedBy: uploadedBy ?? "all",
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
      uploadedBy: candidate.uploadedBy,
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
    elections: elections.map((election) => {
      const hiddenCandidateCount = election.candidates.reduce(
        (total, link) => total + (link.candidate.hidden ? 1 : 0),
        0
      );
      const hasHiddenCandidates = hiddenCandidateCount > 0;

      return {
        type: "election" as const,
        id: election.id,
        position: election.position,
        city: election.city,
        state: election.state,
        date: election.date.toISOString(),
        electionType: election.type,
        hidden: election.hidden,
        uploadedBy: election.uploadedBy,
        candidateCount: election.candidates.length,
        hiddenCandidateCount,
        hasHiddenCandidates,
        sampleCandidates: election.candidates.slice(0, 5).map((link) => ({
          id: link.candidate.id,
          name: link.candidate.name,
          slug: link.candidate.slug,
          verified: link.candidate.verified,
          hidden: link.candidate.hidden,
        })),
      };
    }),
    uploaders,
  });
}

function buildCandidateWhere(
  query: string,
  hiddenFilter: boolean | null,
  uploadedBy: string | null,
  verifiedFilter: boolean | null
) {
  const andConditions: Prisma.CandidateWhereInput[] = [];

  if (query) {
    const insensitive = {
      contains: query,
      mode: "insensitive" as const,
    };

    andConditions.push({
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
    });
  }

  if (hiddenFilter !== null) {
    andConditions.push({ hidden: hiddenFilter });
  }

  if (uploadedBy) {
    andConditions.push({ uploadedBy });
  }

  if (verifiedFilter !== null) {
    andConditions.push({ verified: verifiedFilter });
  }

  if (andConditions.length === 0) {
    return {};
  }

  if (andConditions.length === 1) {
    return andConditions[0];
  }

  return { AND: andConditions };
}

function buildElectionWhere(
  query: string,
  hiddenFilter: boolean | null,
  uploadedBy: string | null
) {
  const andConditions: Prisma.ElectionWhereInput[] = [];

  if (query) {
    const insensitive = {
      contains: query,
      mode: "insensitive" as const,
    };

    andConditions.push({
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
    });
  }

  if (hiddenFilter !== null) {
    andConditions.push({ hidden: hiddenFilter });
  }

  if (uploadedBy) {
    andConditions.push({ uploadedBy });
  }

  if (andConditions.length === 0) {
    return {};
  }

  if (andConditions.length === 1) {
    return andConditions[0];
  }

  return { AND: andConditions };
}

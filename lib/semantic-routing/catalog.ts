import prisma from "@/prisma/prisma";
import { SemanticRouteEntry } from "./types";

const DEFAULT_CANDIDATE_LIMIT = 120;

const BASE_ENTRIES: SemanticRouteEntry[] = [
  {
    id: "live-elections",
    type: "live-elections",
    url: "/live-elections",
    embeddingText:
      "Live elections happening now with upcoming municipal races, ballot information, and active contests across the United States.",
    keywords: [
      "live elections",
      "current elections",
      "elections happening now",
      "upcoming elections",
    ],
    weight: 1.05,
  },
  {
    id: "results-hub",
    type: "results",
    url: "/results",
    embeddingText:
      "Election results explorer for local races. Find who won city and county elections, see vote totals, and browse municipal election outcomes by location.",
    keywords: [
      "election results",
      "who won",
      "local results",
      "vote totals",
    ],
    weight: 1.02,
  },
];

function buildCandidateEntry(candidate: {
  id: number;
  name: string;
  slug: string;
  verified: boolean;
  currentRole: string | null;
  currentCity: string | null;
  currentState: string | null;
  photo: string | null;
  photoUrl: string | null;
}): SemanticRouteEntry {
  const contextParts = [
    candidate.currentRole,
    candidate.currentCity,
    candidate.currentState,
  ]
    .filter(Boolean)
    .join(", ");
  const embeddingText = [
    candidate.name,
    contextParts,
    "candidate profile",
    "campaign information",
    "election candidate",
  ]
    .filter(Boolean)
    .join(". ");

  const keywords = [
    candidate.name,
    candidate.currentRole,
    candidate.currentCity,
    candidate.currentState,
  ].filter(Boolean) as string[];

  return {
    id: `candidate-${candidate.id}`,
    type: "candidate",
    url: `/candidate/${candidate.slug}`,
    embeddingText,
    keywords,
    weight: candidate.verified ? 1.08 : 1,
    data: {
      candidateId: candidate.id,
      name: candidate.name,
      slug: candidate.slug,
      currentRole: candidate.currentRole,
      currentCity: candidate.currentCity,
      currentState: candidate.currentState,
      verified: candidate.verified,
      photo: candidate.photo || candidate.photoUrl || null,
    },
  };
}

export async function buildSemanticCatalog(): Promise<SemanticRouteEntry[]> {
  const catalog: SemanticRouteEntry[] = [...BASE_ENTRIES];

  try {
    const limit = Number(
      process.env.SEMANTIC_ROUTER_CANDIDATE_LIMIT ?? DEFAULT_CANDIDATE_LIMIT
    );
    const take = Number.isNaN(limit) ? DEFAULT_CANDIDATE_LIMIT : limit;

    const candidates = await prisma.candidate.findMany({
      where: {
        hidden: false,
      },
      orderBy: [
        { verified: "desc" },
        { updatedAt: "desc" },
      ],
      take,
      select: {
        id: true,
        name: true,
        slug: true,
        verified: true,
        currentRole: true,
        currentCity: true,
        currentState: true,
        photo: true,
        photoUrl: true,
      },
    });

    for (const candidate of candidates) {
      if (!candidate.slug || !candidate.name) continue;
      catalog.push(buildCandidateEntry(candidate));
    }
  } catch (error) {
    console.error("semantic-routing: failed to load candidate catalog", error);
  }

  return catalog;
}

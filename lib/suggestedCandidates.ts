import type { Prisma } from "@prisma/client";

const IMAGE_EXCLUSION_URLS = [
  "/example-johnny.jpg",
  "/johnny-lawnsign.png",
];

export function buildSuggestedCandidateWhere(
  excludeCandidateId?: number
): Prisma.CandidateWhereInput {
  return {
    hidden: false,
    ...(typeof excludeCandidateId === "number"
      ? { id: { not: excludeCandidateId } }
      : {}),
    elections: {
      some: {
        ContentBlock: {
          some: {
            type: "IMAGE",
            imageUrl: {
              notIn: IMAGE_EXCLUSION_URLS,
              not: null,
            },
          },
        },
      },
    },
  };
}

export const suggestedCandidateOrderBy: Prisma.CandidateOrderByWithRelationInput[] = [
  { verified: "desc" },
  { updatedAt: "desc" },
  { id: "desc" },
];

export type SuggestedCandidateWhere = ReturnType<
  typeof buildSuggestedCandidateWhere
>;

export const suggestedCandidateImageExclusionUrls = IMAGE_EXCLUSION_URLS;

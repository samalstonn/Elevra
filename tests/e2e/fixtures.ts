import {
  test as base,
  request as playwrightRequest,
  expect,
} from "@playwright/test";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma-client";

export const TEST_SLUG =
  process.env.E2E_CANDIDATE_SLUG || "existing-candidate-slug";

type Candidate = {
  id: number;
  electionId: number;
  slug: string;
};

type WorkerFixtures = {
  seededCandidate: Candidate;
};

type Fixtures = {
  candidate: Candidate;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  seededCandidate: [
    async ({}, use) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const slug = TEST_SLUG;
      const payload = {
        elections: [
          {
            election: {
              title: "E2E Basic Election",
              type: "LOCAL",
              date: "11/04/2025",
              city: "E2E Test City ZZ",
              state: "ZZ",
              number_of_seats: "1",
              description: "E2E seeded election for automated tests.",
              uploadedBy: "test@example.com",
              hidden: false,
            },
            candidates: [
              {
                name: "Existing Candidate Slug",
                email: process.env.E2E_CLERK_USER_USERNAME || "",
                uploadedBy: "test@example.com",
                hidden: false,
                slug,
                clerkUserId: process.env.E2E_CLERK_USER_ID || null,
              },
            ],
          },
        ],
      };

      const api = await playwrightRequest.newContext();
      let candidateId: number | null = null;
      let electionId: number | null = null;

      try {
        const res = await api.post(`${baseUrl}/api/admin/seed-structured`, {
          headers: {
            "content-type": "application/json",
            "x-e2e-seed-secret": process.env.E2E_SEED_SECRET || "",
          },
          data: {
            structured: JSON.stringify(payload),
            hidden: false,
          },
        });

        if (!res.ok()) {
          throw new Error(
            `Failed to seed structured data: ${res.status()} ${await res.text()}`
          );
        }

        const body = await res.json();
        const first = body?.results?.[0];
        if (!first) {
          throw new Error("Seed endpoint returned no results");
        }

        electionId = first.electionId as number;

        const candidate = await prisma.candidate.findUnique({
          where: { slug },
        });
        if (!candidate) {
          throw new Error("Seeded candidate not found by slug");
        }

        candidateId = candidate.id;

        await use({ id: candidateId, electionId, slug });
      } finally {
        await api.dispose();

        if (candidateId != null) {
          const cleanupCandidateId = candidateId;

          const links = await prisma.electionLink.findMany({
            where: { candidateId: cleanupCandidateId },
            select: { electionId: true },
          });
          const electionIds = Array.from(
            new Set(links.map((link) => link.electionId))
          );

          const maxAttempts = 5;
          for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            try {
              await prisma.$transaction(async (tx) => {
                await tx.contentBlock.deleteMany({
                  where: { candidateId: cleanupCandidateId },
                });
                await tx.electionLink.deleteMany({
                  where: { candidateId: cleanupCandidateId },
                });
                await tx.userValidationRequest.deleteMany({
                  where: { candidateId: cleanupCandidateId },
                });
              });
              break;
            } catch (error) {
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2003" &&
                attempt < maxAttempts - 1
              ) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * (attempt + 1))
                );
                continue;
              }
              throw error;
            }
          }

          for (const electionIdToDelete of electionIds) {
            try {
              await prisma.election.delete({
                where: { id: electionIdToDelete },
              });
            } catch {}
          }
        }
      }
    },
    { scope: "worker", auto: true },
  ],
  candidate: async ({ seededCandidate }, use) => {
    await use(seededCandidate);
  },
});

export { prisma };
export { expect };
export type CandidateFixture = Fixtures;

import {
  test as base,
  request as playwrightRequest,
  expect,
} from "@playwright/test";
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
                slug: TEST_SLUG,
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
          where: { slug: TEST_SLUG },
        });
        if (!candidate) {
          throw new Error("Seeded candidate not found by slug");
        }

        candidateId = candidate.id;

        await use({ id: candidateId, electionId, slug: TEST_SLUG });
      } finally {
        await api.dispose();

        if (candidateId != null) {
          const links = await prisma.electionLink.findMany({
            where: { candidateId },
          });

          for (const link of links) {
            await prisma.contentBlock.deleteMany({
              where: {
                candidateId: link.candidateId,
                electionId: link.electionId,
              },
            });
            await prisma.electionLink.delete({
              where: {
                candidateId_electionId: {
                  candidateId: link.candidateId,
                  electionId: link.electionId,
                },
              },
            });
            try {
              await prisma.election.delete({ where: { id: link.electionId } });
            } catch {}
          }

          await prisma.userValidationRequest.deleteMany({
            where: { candidateId },
          });

          await prisma.candidate.delete({ where: { id: candidateId } });
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

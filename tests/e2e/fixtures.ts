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
    async ({}, use, workerInfo) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      // Generate a per-worker unique slug to avoid collisions across workers
      const uniqueSuffix = `w${workerInfo.workerIndex}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const slug = `${TEST_SLUG}-${uniqueSuffix}`;
      const creds = getCredsForWorker(workerInfo.workerIndex);
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
                email: creds.username || "",
                uploadedBy: "test@example.com",
                hidden: false,
                slug,
                // Bind to this worker's Clerk user if provided
                clerkUserId: creds.userId || null,
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
                await tx.donation.deleteMany({
                  where: { candidateId: cleanupCandidateId },
                });
                await tx.endorsement.deleteMany({
                  where: { candidateId: cleanupCandidateId },
                });
                // Finally remove the candidate for this worker
                await tx.candidate.deleteMany({
                  where: { id: cleanupCandidateId },
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

function parseListEnv(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v));
  } catch {}
  return raw
    .split(/[,\n\r\t ]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function firstNonEmptyList(...envKeys: string[]): string[] {
  for (const key of envKeys) {
    const vals = parseListEnv(process.env[key]);
    if (vals.length > 0) return vals;
  }
  return [];
}

const USERNAMES = firstNonEmptyList(
  "E2E_CLERK_USER_USERNAME_LIST",
  "E2E_CLERK_USER_USERNAMES",
  "E2E_CLERK_USER_USERNAME"
);
const PASSWORDS = firstNonEmptyList(
  "E2E_CLERK_USER_PASSWORD_LIST",
  "E2E_CLERK_USER_PASSWORDS",
  "E2E_CLERK_USER_PASSWORD"
);
const USER_IDS = firstNonEmptyList(
  "E2E_CLERK_USER_ID_LIST",
  "E2E_CLERK_USER_IDS",
  "E2E_CLERK_USER_ID"
);

export function getCredsForWorker(workerIndex: number) {
  // Highest priority: E2E_CLERK_USERS as a JSON array of objects
  // Example:
  // E2E_CLERK_USERS='[{"username":"u","password":"p","userId":"id"}, ...]'
  const rawUsers = process.env.E2E_CLERK_USERS;
  if (rawUsers) {
    try {
      const arr = JSON.parse(rawUsers);
      if (Array.isArray(arr) && arr.length > 0) {
        const i = workerIndex % arr.length;
        const item = arr[i] || {};
        return {
          username: String(item.username || ""),
          password: String(item.password || ""),
          userId: String(item.userId || ""),
        };
      }
    } catch {
      // fall through
    }
  }

  // Fallback to list envs or single values if aggregate var is not provided
  const uCount = Math.max(1, USERNAMES.length || 0);
  const i = workerIndex % uCount;
  const username = USERNAMES[i] || process.env.E2E_CLERK_USER_USERNAME || "";
  const password = PASSWORDS[i] || process.env.E2E_CLERK_USER_PASSWORD || "";
  const userId = USER_IDS[i] || process.env.E2E_CLERK_USER_ID || "";
  return { username, password, userId };
}

import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { PrismaClient, SubmissionStatus } from "@prisma/client";
import { davidWeinsteinTemplate } from "@/app/(templates)/basicwebpage";

// Reuse a single Prisma client across tests
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const TEST_SLUG = "existing-candidate-slug";
let seededCandidateId: number | null = null;
let seededElectionId: number | null = null;

test.beforeAll(async ({ request }) => {
  // Seed via header-secret to mimic admin workflow without signing in
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
        },
        candidates: [
          {
            name: "Existing Candidate Slug",
            email: process.env.E2E_CLERK_USER_USERNAME || "",
          },
        ],
      },
    ],
  };

  const res = await request.post(`${base}/api/admin/seed-structured`, {
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
    throw new Error(`Failed to seed structured data: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  const first = body?.results?.[0];
  if (!first) throw new Error("Seed endpoint returned no results");
  seededElectionId = first.electionId as number;

  // Resolve candidateId by slug
  const c = await prisma.candidate.findUnique({ where: { slug: TEST_SLUG } });
  if (!c) throw new Error("Seeded candidate not found by slug");
  seededCandidateId = c.id;
});

// Reset candidate verification state after tests
async function resetCandidateVerification(slug: string) {
  try {
    await prisma.candidate.update({
      where: { slug },
      data: {
        verified: false,
        status: SubmissionStatus.PENDING,
        clerkUserId: null,
      },
    });
  } catch (err) {
    // Non-fatal in CI/local if record is already reset or missing
    console.warn("resetCandidateVerification failed:", err);
  }
}

// Helper: assert seeded link contains davidWeinstein template blocks
async function expectHasWeinsteinTemplateBlocks() {
  expect(seededCandidateId).toBeTruthy();
  expect(seededElectionId).toBeTruthy();

  // Wait up to 1s for blocks to exist, then fail
  const deadline = Date.now() + 1000;
  let lastCount = 0;
  const expected = davidWeinsteinTemplate.length;
  while (Date.now() < deadline) {
    lastCount = await prisma.contentBlock.count({
      where: { candidateId: seededCandidateId!, electionId: seededElectionId! },
    });
    if (lastCount === expected) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  expect(lastCount).toBe(expected);

  // Spot-check first block
  const first = await prisma.contentBlock.findFirst({
    where: {
      candidateId: seededCandidateId!,
      electionId: seededElectionId!,
      order: 0,
    },
  });
  expect(first?.type).toBe(davidWeinsteinTemplate[0].type);
  const tmpl0 = davidWeinsteinTemplate[0] as { text?: string };
  if (tmpl0.text) {
    expect(first?.text?.trim()).toBe(tmpl0.text);
  }
}

test.afterEach(async () => {
  const slug = process.env.E2E_CANDIDATE_SLUG || TEST_SLUG;
  await resetCandidateVerification(slug);
});

test.afterAll(async () => {
  // Delete seeded data for a clean next run
  if (!seededCandidateId) return;
  try {
    const links = await prisma.electionLink.findMany({ where: { candidateId: seededCandidateId } });
    for (const link of links) {
      await prisma.contentBlock.deleteMany({
        where: { candidateId: link.candidateId, electionId: link.electionId },
      });
      await prisma.electionLink.delete({
        where: {
          candidateId_electionId: {
            candidateId: link.candidateId,
            electionId: link.electionId,
          },
        },
      });
      // Also remove the election we created (best-effort)
      try {
        await prisma.election.delete({ where: { id: link.electionId } });
      } catch {}
    }
    await prisma.userValidationRequest.deleteMany({ where: { candidateId: seededCandidateId } });
    await prisma.candidate.delete({ where: { id: seededCandidateId } });
  } finally {
    await prisma.$disconnect();
  }
});

test("Correct Email - Already Signed In: Successful Verification and Sent to Dashboard with Popup", async ({
  page,
}) => {
  await page.goto("/candidate/existing-candidate-slug");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidate/existing-candidate-slug$`
    )
  );
  await page.getByRole("button", { name: "This is me" }).click();
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidates/candidate-dashboard\\?verified=1&slug=existing-candidate-slug$`
    )
  );
  await expect(
    page.getByRole("dialog", { name: "You’re Verified on Elevra!" })
  ).toBeVisible();
  await expectHasWeinsteinTemplateBlocks();
});

test("Incorrect Email - Already Signed In: Redirected to Candidate Verification Request", async ({
  page,
}) => {
  // Skip if alternate test user credentials are not configured
  test.skip(
    !process.env.E2E_NONMATCH_EMAIL || !process.env.E2E_NONMATCH_PASSWORD,
    "Missing E2E_NONMATCH_* environment variables"
  );

  await page.goto("/candidate/existing-candidate-slug");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_NONMATCH_EMAIL!,
      password: process.env.E2E_NONMATCH_PASSWORD!,
    },
  });
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidate/existing-candidate-slug$`
    )
  );

  await page.getByRole("button", { name: "This is me" }).click();

  // Expect redirect to candidate verification request page
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidate/verify\\?candidate=${TEST_SLUG}&candidateID=${seededCandidateId}$`
    )
  );

  // Expect the verification request heading to be visible
  await expect(
    page.getByRole("heading", { name: /Candidate Verification Request/i })
  ).toBeVisible();
});

test("Correct Email - Not Signed In: Successful Verification and Sent to Dashboard with Popup", async ({
  page,
}) => {
  // Start signed out, go to candidate profile
  await page.goto("/candidate/existing-candidate-slug");

  // Click "This is me" while not authenticated
  await page.getByRole("button", { name: "This is me" }).click();

  await expect(page).toHaveURL(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/sign-in?redirect_url=%2Fcandidate%2Fverify%3Fcandidate%3D${encodeURIComponent(
      TEST_SLUG
    )}%26candidateID%3D${seededCandidateId}`
  );

  // Programmatically sign in as the matching user
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  await page.goto(
    `/candidate/verify?candidate=${TEST_SLUG}&candidateID=${seededCandidateId}`
  );

  // Expect redirect to dashboard with verified=1 and popup visible
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidates/candidate-dashboard\\?verified=1&slug=${TEST_SLUG}$`
    )
  );
  await expect(
    page.getByRole("dialog", { name: "You’re Verified on Elevra!" })
  ).toBeVisible();
  await expectHasWeinsteinTemplateBlocks();
});

test("Incorrect Email - Not Signed In: Redirected to Candidate Verification Request", async ({
  page,
}) => {
  // Skip if alternate test user credentials are not configured
  test.skip(
    !process.env.E2E_NONMATCH_EMAIL || !process.env.E2E_NONMATCH_PASSWORD,
    "Missing E2E_NONMATCH_* environment variables"
  );

  // Start signed out, go to candidate profile
  await page.goto("/candidate/existing-candidate-slug");

  // Click "This is me" while not authenticated
  await page.getByRole("button", { name: "This is me" }).click();

  await expect(page).toHaveURL(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/sign-in?redirect_url=%2Fcandidate%2Fverify%3Fcandidate%3D${encodeURIComponent(
      TEST_SLUG
    )}%26candidateID%3D${seededCandidateId}`
  );

  // Programmatically sign in as the non-matching user
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_NONMATCH_EMAIL!,
      password: process.env.E2E_NONMATCH_PASSWORD!,
    },
  });

  await page.goto(
    `/candidate/verify?candidate=${TEST_SLUG}&candidateID=${seededCandidateId}`
  );

  // Expect redirect to candidate verification request page
  await expect(page).toHaveURL(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/candidate/verify?candidate=${TEST_SLUG}&candidateID=${seededCandidateId}`
  );

  // Expect the verification request heading to be visible
  await expect(
    page.getByRole("heading", { name: /Candidate Verification Request/i })
  ).toBeVisible();
});

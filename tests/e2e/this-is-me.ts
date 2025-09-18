import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { PrismaClient, SubmissionStatus } from "@prisma/client";
import { davidWeinsteinTemplate } from "@/app/(templates)/basicwebpage";
import { promises as fs } from "node:fs";
import path from "node:path";

// Reuse a single Prisma client across tests
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const TEST_SLUG = "existing-candidate-slug";
let seededCandidateId: number | null = null;
let seededElectionId: number | null = null;
const EMAIL_LOG = path.join(process.cwd(), "lib/email/logs/.test-emails.log");

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
      hidden: true,
    },
  });
  if (!res.ok()) {
    throw new Error(
      `Failed to seed structured data: ${res.status()} ${await res.text()}`
    );
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

test.afterEach(async () => {
  const slug = process.env.E2E_CANDIDATE_SLUG || TEST_SLUG;
  await resetCandidateVerification(slug);
});

test.afterAll(async () => {
  // Delete seeded data for a clean next run
  if (!seededCandidateId) return;
  try {
    const links = await prisma.electionLink.findMany({
      where: { candidateId: seededCandidateId },
    });
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
    await prisma.userValidationRequest.deleteMany({
      where: { candidateId: seededCandidateId },
    });
    await prisma.candidate.delete({ where: { id: seededCandidateId } });
  } finally {
    await prisma.$disconnect();
  }
});

test("Correct Email - Already Signed In: Successful Verification and Sent to Dashboard with Popup", async ({
  page,
}) => {
  await page.goto("/candidate/existing-candidate-slug");
  // Before verification, there should be no content blocks
  await expectNoTemplateBlocks();
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
  // Expect user email sent for auto-approve flow
  await expectEmailLogged("You're Verified on Elevra!");
  await expectHasWeinsteinTemplateBlocks();
});

test("Manual Verification via UI: non-matching user submits form and sees success", async ({
  page,
}) => {
  // Skip if alternate test user credentials are not configured
  test.skip(
    !process.env.E2E_NONMATCH_EMAIL || !process.env.E2E_NONMATCH_PASSWORD,
    "Missing E2E_NONMATCH_* environment variables"
  );

  // Sign in as non-matching user and navigate to verify page
  await page.goto(`/candidate/${TEST_SLUG}`);
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_NONMATCH_EMAIL!,
      password: process.env.E2E_NONMATCH_PASSWORD!,
    },
  });
  await page.getByRole("button", { name: "This is me" }).click();
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidate/verify\\?candidate=${TEST_SLUG}&candidateID=${seededCandidateId}$`
    )
  );

  // Stub Mapbox geocoding to enable location selection without network
  await page.route("https://api.mapbox.com/**", async (route) => {
    const json = {
      type: "FeatureCollection",
      query: ["Testville"],
      features: [
        {
          id: "place.testville",
          type: "Feature",
          place_type: ["place"],
          text: "Testville",
          place_name: "Testville, TS, United States",
          center: [-74.0, 40.0],
          context: [
            { id: "region.us-ts", short_code: "US-TS", text: "Test State" },
          ],
          properties: {},
        },
      ],
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(json),
    });
  });

  // Fill the form fields (overwrite if prefilled)
  await page.getByLabel("Full Legal Name*").fill("Existing Candidate Slug");
  await page
    .getByLabel(
      "Current Role* (Eg. Running for Mayor, Incumbent Mayor, Business Owner, etc.)"
    )
    .fill("Test Role");
  await page
    .getByLabel("Campaign Website (optional)")
    .fill("https://example.com");
  await page
    .getByLabel("LinkedIn (optional)")
    .fill("https://linkedin.com/in/example");

  // Location input triggers suggestions (debounced)
  const locationBox = page.getByPlaceholder(
    "Enter your hometown (e.g., Ithaca, NY)"
  );
  await locationBox.fill("Testv");
  // Wait for suggestions list and pick the first
  await page.waitForTimeout(650);
  await page.locator("ul li", { hasText: "Testville" }).first().click();
  await expect(
    page.getByText("Selected: Testville, TS", { exact: false })
  ).toBeVisible();

  // Agree to terms and submit
  await page
    .getByLabel("I certify that all information provided is accurate*")
    .check();
  await page
    .getByRole("button", { name: "Continue Verification Request" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Verification Request Submitted!" })
  ).toBeVisible();

  // Expect user confirmation email and admin notification emails to be logged
  await expectEmailLogged("We received your Elevra verification request");
  await expectEmailLogged("New Candidate Verification Request");
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
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/candidate/verify?candidate=${TEST_SLUG}&candidateID=${seededCandidateId}`
  );

  // Expect the verification request heading to be visible
  await expect(
    page.getByRole("heading", { name: /Candidate Verification Request/i })
  ).toBeVisible();
});

test("Manual Verification: create request then admin approves -> verified + template blocks", async ({
  page,
  request,
}) => {
  // Skip if alternate test user credentials are not configured
  test.skip(
    !process.env.E2E_NONMATCH_EMAIL || !process.env.E2E_NONMATCH_PASSWORD,
    "Missing E2E_NONMATCH_* environment variables"
  );

  // 1) Sign in as the non-matching user and navigate to verify flow
  await page.goto(`/candidate/${TEST_SLUG}`);
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_NONMATCH_EMAIL!,
      password: process.env.E2E_NONMATCH_PASSWORD!,
    },
  });
  await page.getByRole("button", { name: "This is me" }).click();
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidate/verify\\?candidate=${TEST_SLUG}&candidateID=${seededCandidateId}$`
    )
  );

  // 2) Create manual verification request via API
  const dummyClerkId = `e2e-nonmatch-${Date.now()}`;
  const reqPayload = {
    fullName: "E2E Nonmatching User",
    email: process.env.E2E_NONMATCH_EMAIL!,
    phone: "",
    position: "Test Position",
    website: "",
    linkedin: "",
    additionalInfo: "Manual verification E2E test",
    city: "Testville",
    state: "TS",
    candidateId: seededCandidateId,
    clerkUserId: dummyClerkId,
  };
  const createRes = await request.post(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/userValidationRequest`,
    {
      headers: { "content-type": "application/json" },
      data: reqPayload,
    }
  );
  expect(createRes.ok()).toBeTruthy();
  const created = await createRes.json();
  expect(created?.id).toBeTruthy();

  // Expect admin + user emails for the new verification request
  await expectEmailLogged("New Candidate Verification Request");
  await expectEmailLogged("We received your Elevra verification request");

  // 3) Admin approves the request
  // Before approval, there should still be no content blocks
  await expectNoTemplateBlocks();
  const approveRes = await request.post(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/admin/approve-request`,
    {
      headers: { "content-type": "application/json" },
      data: { requestId: created.id },
    }
  );
  // NextResponse.redirect may be auto-followed by Playwright; accept 200..399
  const approveStatus = approveRes.status();
  expect(approveStatus).toBeGreaterThanOrEqual(200);
  expect(approveStatus).toBeLessThan(400);

  // Expect admin email for approval to be logged
  await expectEmailLogged("profile is now verified");
  // Expect user email for approval to be logged
  await expectEmailLogged("You're Verified on Elevra!");

  // 4) Verify candidate is now verified in DB and template blocks exist
  const candidate = await prisma.candidate.findUnique({
    where: { slug: TEST_SLUG },
  });
  expect(candidate?.verified).toBe(true);
  expect(candidate?.status).toBe("APPROVED");
  expect(candidate?.clerkUserId).toBe(dummyClerkId);

  await expectHasWeinsteinTemplateBlocks();

  // 5) Optional UI confirmation: dashboard shows verified popup
  await page.goto(
    `/candidates/candidate-dashboard?verified=1&slug=${TEST_SLUG}`
  );
  await expect(
    page.getByRole("dialog", { name: "You’re Verified on Elevra!" })
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
  // Expect user email sent for auto-approve flow
  await expectEmailLogged("You're Verified on Elevra!");
  await expectHasWeinsteinTemplateBlocks();
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
        email: process.env.E2E_CLERK_USER_USERNAME, // reset to original email
      },
    });
  } catch (err) {
    // Non-fatal in CI/local if record is already reset or missing
    console.warn("resetCandidateVerification failed:", err);
  }
  // Remove any template/content blocks created by previous tests
  try {
    if (seededCandidateId && seededElectionId) {
      await prisma.contentBlock.deleteMany({
        where: { candidateId: seededCandidateId, electionId: seededElectionId },
      });
    } else {
      const c = await prisma.candidate.findUnique({ where: { slug } });
      if (c) {
        const links = await prisma.electionLink.findMany({
          where: { candidateId: c.id },
        });
        for (const link of links) {
          await prisma.contentBlock.deleteMany({
            where: {
              candidateId: link.candidateId,
              electionId: link.electionId,
            },
          });
        }
      }
    }
  } catch (err) {
    console.warn(
      "resetCandidateVerification contentBlock cleanup failed:",
      err
    );
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

// Helper: assert no template content blocks are present yet
async function expectNoTemplateBlocks() {
  expect(seededCandidateId).toBeTruthy();
  expect(seededElectionId).toBeTruthy();
  const count = await prisma.contentBlock.count({
    where: { candidateId: seededCandidateId!, electionId: seededElectionId! },
  });
  expect(count).toBe(0);
}

async function readEmailLog(): Promise<string> {
  try {
    return await fs.readFile(EMAIL_LOG, "utf8");
  } catch {
    return "";
  }
}

async function expectEmailLogged(subjectSnippet: string) {
  const deadline = Date.now() + 1500;
  let text = "";
  while (Date.now() < deadline) {
    text = await readEmailLog();
    if (text.includes(subjectSnippet)) {
      expect(text).toContain(subjectSnippet);
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Email log did not contain expected snippet within timeout: "${subjectSnippet}"`
  );
}

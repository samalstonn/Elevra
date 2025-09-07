import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { PrismaClient, SubmissionStatus } from "@prisma/client";

// Reset candidate verification state after tests
async function resetCandidateVerification(slug: string) {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
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
  } finally {
    await prisma.$disconnect();
  }
}

test.afterEach(async () => {
  const slug = process.env.E2E_CANDIDATE_SLUG || "existing-candidate-slug";
  await resetCandidateVerification(slug);
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
      )}/candidate/verify\\?candidate=existing-candidate-slug&candidateID=439$`
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
    }/sign-in?redirect_url=%2Fcandidate%2Fverify%3Fcandidate%3Dexisting-candidate-slug%26candidateID%3D439`
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
    "/candidate/verify?candidate=existing-candidate-slug&candidateID=439"
  );

  // Expect redirect to dashboard with verified=1 and popup visible
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
    }/sign-in?redirect_url=%2Fcandidate%2Fverify%3Fcandidate%3Dexisting-candidate-slug%26candidateID%3D439`
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
    "/candidate/verify?candidate=existing-candidate-slug&candidateID=439"
  );

  // Expect redirect to candidate verification request page
  await expect(page).toHaveURL(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/candidate/verify?candidate=existing-candidate-slug&candidateID=439`
  );

  // Expect the verification request heading to be visible
  await expect(
    page.getByRole("heading", { name: /Candidate Verification Request/i })
  ).toBeVisible();
});

import { test, expect } from "@playwright/test";

// Configuration via env to keep tests flexible across environments
const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const CANDIDATE_SLUG = process.env.E2E_CANDIDATE_SLUG || "";

// Auth creds for Clerk sign-in
const MATCH_EMAIL = process.env.E2E_TEST_EMAIL;
const MATCH_PASSWORD = process.env.E2E_TEST_PASSWORD;
const NONMATCH_EMAIL = process.env.E2E_NONMATCH_EMAIL;
const NONMATCH_PASSWORD = process.env.E2E_NONMATCH_PASSWORD;

async function followRedirectParam(page) {
  try {
    const url = new URL(page.url());
    const r = url.searchParams.get("redirect_url");
    if (r) {
      const decoded = decodeURIComponent(r);
      await page.goto(decoded);
    }
  } catch {}
}

async function clerkTwoStepSignIn(
  page,
  email: string,
  password: string,
  finalPathAfterLogin: string
) {
  // Step 1: email on app sign-in page
  await page.goto(
    `${BASE_URL}/sign-in?redirect_url=${encodeURIComponent(finalPathAfterLogin)}`
  );
  const emailLocator = page
    .locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
    .first();
  await emailLocator.fill(email);
  await page.getByRole("button", { name: /continue|sign in|next/i }).first().click();

  // If redirected to accounts.dev factor-one, enter password
  try {
    await page.waitForURL(/accounts\.[^/]+\/sign-in(\/factor-one)?/i, {
      timeout: 15000,
    });
  } catch {}

  const pwdCount = await page.locator('input[type="password"]').count();
  if (pwdCount > 0) {
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole("button", { name: /continue|sign in|log in/i })
      .first()
      .click();
  }

  // Follow redirect_url chain back to the app if present
  await followRedirectParam(page);
  await followRedirectParam(page);

  // Arrive at final path
  await page.waitForURL(`**${finalPathAfterLogin}`, { timeout: 30000 });
}

test.describe("This is me verification", () => {
  test("logged out: redirects to Clerk sign-in with verify redirect", async ({
    page,
  }) => {
    test.skip(!CANDIDATE_SLUG, "Set E2E_CANDIDATE_SLUG to enable this test");

    await page.goto(`${BASE_URL}/candidate/${CANDIDATE_SLUG}`);

    // Click the primary "This is me" button (desktop or mobile)
    const btn = page.getByRole("button", { name: /this is me/i });
    await expect(btn).toBeVisible();
    await btn.click();

    // Expect to be redirected to Clerk sign-in with a redirect_url back to /candidate/verify
    await expect(page).toHaveURL(/\/sign-in\?redirect_url=/);
    const url = new URL(page.url());
    const redirectURL = url.searchParams.get("redirect_url") || "";
    const decoded = decodeURIComponent(redirectURL);
    expect(decoded).toContain("/candidate/verify?candidate=");
    expect(decoded).toContain("candidateID=");
  });

  test.use({ storageState: 'playwright/.auth/match.json' })
  test("logged in (matching email): auto-approves and shows verified dashboard popup", async ({ page }) => {
    test.skip(
      !CANDIDATE_SLUG || !MATCH_EMAIL || !MATCH_PASSWORD,
      "Set E2E_CANDIDATE_SLUG, E2E_TEST_EMAIL and E2E_TEST_PASSWORD"
    );

    // Already signed in via storageState created in globalSetup
    await page.goto(`${BASE_URL}/candidate/${CANDIDATE_SLUG}`)
    // Click This is me
    await page.getByRole("button", { name: /this is me/i }).click();

    expect

    // If emails match, client will call auto-approve and redirect to dashboard with verified flag
    await page.waitForURL(`**/candidates/candidate-dashboard**`, {
      timeout: 30000,
    });
    expect(page.url()).toContain("verified=1");
    expect(page.url()).toContain(`slug=${CANDIDATE_SLUG}`);

    // The verified popup should be visible
    await expect(page.getByText("You’re Verified on Elevra!")).toBeVisible();
  });

  test.use({ storageState: 'playwright/.auth/nonmatch.json' })
  test("logged in (non-matching email): goes to verify page for manual flow", async ({ page }) => {
    test.skip(
      !CANDIDATE_SLUG || !NONMATCH_EMAIL || !NONMATCH_PASSWORD,
      "Set E2E_NONMATCH_EMAIL and E2E_NONMATCH_PASSWORD for this test"
    );

    await page.goto(`${BASE_URL}/candidate/${CANDIDATE_SLUG}`)
    await page.getByRole("button", { name: /this is me/i }).click();

    // Should route to /candidate/verify with candidate + candidateID
    await page.waitForURL(
      /.*\/candidate\/verify\?candidate=.*&candidateID=\d+/,
      { timeout: 30000 }
    );
  });
});

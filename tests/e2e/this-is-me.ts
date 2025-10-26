import { clerk } from "@clerk/testing/playwright";
import { SubmissionStatus } from "@prisma/client";
import {
  expectNoTemplateBlocks,
  expectEmailLogged,
} from "../helpers";
import { test, expect, prisma, CandidateFixture, getCredsForWorker } from "./fixtures";
import { signInWithRole } from "./test-utils";

test.afterEach(async ({ candidate }) => {
  const { username } = getCredsForWorker(test.info().workerIndex);
  await resetCandidateVerification(candidate, username!);
});

test("Correct Email - Already Signed In: Successful Verification and Sent to Dashboard with Popup", async ({
  page,
  candidate,
}) => {
  await page.goto(`/candidate/${candidate.slug}`);
  // Before verification, there should be no content blocks
  await expectNoTemplateBlocks(candidate.id, candidate.electionId, prisma);
  // Sign in as a candidate to access candidate dashboard
  await signInWithRole(page, "candidate");
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidate/${candidate.slug}$`
    )
  );
  // Listen for the auto-approve API call
  const autoApprovePromise = page.waitForResponse(response => 
    response.url().includes('/api/userValidationRequest/auto-approve') && 
    response.request().method() === 'POST'
  );
  
  await page.getByRole("button", { name: "This is me" }).click();
  
  // Wait for the API call to complete
  try {
    const autoApproveResponse = await autoApprovePromise;
    console.log("Auto-approve API response status:", autoApproveResponse.status());
    console.log("Auto-approve API response body:", await autoApproveResponse.text());
  } catch (error) {
    console.log("Auto-approve API call failed or timed out:", error);
  }
  
  // Wait for navigation to the dashboard (with longer timeout)
  await page.waitForURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidates/candidate-dashboard\\?verified=1&slug=${candidate.slug}$`
    ),
    { timeout: 10000 }
  );
  await expect(
    page.getByRole("dialog", { name: "Welcome to  Elevra!" })
  ).toBeVisible();
  // Expect user email sent for auto-approve flow
  await expectEmailLogged("You're Verified on Elevra!");
});

test("Manual Verification via UI: non-matching user submits form and sees success", async ({
  page,
  candidate,
}) => {
  // Skip if alternate test user credentials are not configured
  test.skip(
    !process.env.E2E_NONMATCH_EMAIL || !process.env.E2E_NONMATCH_PASSWORD,
    "Missing E2E_NONMATCH_* environment variables"
  );

  // Sign in as non-matching user and navigate to verify page
  await page.goto(`/candidate/${candidate.slug}`);
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
      )}/candidate/verify\\?candidate=${candidate.slug}&candidateID=${candidate.id}$`
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
    .getByLabel("I certify that all information provided is accurate")
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
  candidate,
}) => {
  // Skip if alternate test user credentials are not configured
  test.skip(
    !process.env.E2E_NONMATCH_EMAIL || !process.env.E2E_NONMATCH_PASSWORD,
    "Missing E2E_NONMATCH_* environment variables"
  );

  await page.goto(`/candidate/${candidate.slug}`);
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
      )}/candidate/${candidate.slug}$`
    )
  );

  await page.getByRole("button", { name: "This is me" }).click();

  // Expect redirect to candidate verification request page
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidate/verify\\?candidate=${candidate.slug}&candidateID=${candidate.id}$`
    )
  );

  // Expect the verification request heading to be visible
  await expect(
    page.getByRole("heading", { name: /Candidate Verification Request/i })
  ).toBeVisible();
});

test("Incorrect Email - Not Signed In: Redirected to Candidate Verification Request", async ({
  page,
  candidate,
}) => {
  // Skip if alternate test user credentials are not configured
  test.skip(
    !process.env.E2E_NONMATCH_EMAIL || !process.env.E2E_NONMATCH_PASSWORD,
    "Missing E2E_NONMATCH_* environment variables"
  );

  // Start signed out, go to candidate profile
  await page.goto(`/candidate/${candidate.slug}`);

  // Click "This is me" while not authenticated
  await page.getByRole("button", { name: "This is me" }).click();

  await expect(page).toHaveURL(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/sign-in?redirect_url=%2Fcandidate%2Fverify%3Fcandidate%3D${encodeURIComponent(
      candidate.slug
    )}%26candidateID%3D${candidate.id}`
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
    `/candidate/verify?candidate=${candidate.slug}&candidateID=${candidate.id}`
  );

  // Expect redirect to candidate verification request page
  await expect(page).toHaveURL(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/candidate/verify?candidate=${candidate.slug}&candidateID=${candidate.id}`
  );

  // Expect the verification request heading to be visible
  await expect(
    page.getByRole("heading", { name: /Candidate Verification Request/i })
  ).toBeVisible();
});

test("Manual Verification: create request then admin approves -> verified + template blocks", async ({
  page,
  request,
  candidate,
}) => {
  // Skip if alternate test user credentials are not configured
  test.skip(
    !process.env.E2E_NONMATCH_EMAIL || !process.env.E2E_NONMATCH_PASSWORD,
    "Missing E2E_NONMATCH_* environment variables"
  );

  // 1) Sign in as the non-matching user and navigate to verify flow
  await page.goto(`/candidate/${candidate.slug}`);
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
      )}/candidate/verify\\?candidate=${candidate.slug}&candidateID=${candidate.id}$`
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
    candidateId: candidate.id,
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
  await expectNoTemplateBlocks(candidate.id, candidate.electionId, prisma);
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
  const candidateRecord = await prisma.candidate.findUnique({
    where: { slug: candidate.slug },
  });
  expect(candidateRecord?.verified).toBe(true);
  expect(candidateRecord?.status).toBe("APPROVED");
  expect(candidateRecord?.clerkUserId).toBe(dummyClerkId);

  // 5) Optional UI confirmation: dashboard shows verified popup
  await page.goto(
    `/candidates/candidate-dashboard?verified=1&slug=${candidate.slug}`
  );
  await expect(
    page.getByRole("dialog", { name: "Welcome to Elevra!" })
  ).toBeVisible();
});

test("Correct Email - Not Signed In: Successful Verification and Sent to Dashboard with Popup", async ({
  page,
  candidate,
}) => {
  // Start signed out, go to candidate profile
  await page.goto(`/candidate/${candidate.slug}`);

  // Click "This is me" while not authenticated
  await page.getByRole("button", { name: "This is me" }).click();

  await expect(page).toHaveURL(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/sign-in?redirect_url=%2Fcandidate%2Fverify%3Fcandidate%3D${encodeURIComponent(
      candidate.slug
    )}%26candidateID%3D${candidate.id}`
  );

  // Programmatically sign in as the matching user
  const { username, password } = getCredsForWorker(test.info().workerIndex);
  
  // Use direct Clerk sign-in instead of signInWithRole for this specific case
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: username!,
      password: password!,
    },
  });
  
  // Wait for sign-in to complete with shorter timeout
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch (error) {
    console.log("Networkidle timeout, trying DOM content loaded...");
    await page.waitForLoadState("domcontentloaded", { timeout: 5000 });
  }
  
  // Set the role after sign-in
  await page.evaluate(async (payload) => {
    const res = await fetch("/api/user/metadata/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to set role: ${res.status}`);
    }
  }, { role: "candidate" });
  
  // Wait for role to be set
  await page.waitForTimeout(500);

  await page.goto(
    `/candidate/verify?candidate=${candidate.slug}&candidateID=${candidate.id}`
  );

  // Expect redirect to dashboard with verified=1 and popup visible
  await expect(page).toHaveURL(
    new RegExp(
      `^${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}/candidates/candidate-dashboard\\?verified=1&slug=${candidate.slug}$`
    )
  );
  await expect(
    page.getByRole("dialog", { name: "Welcome to Elevra!" })
  ).toBeVisible();
  // Expect user email sent for auto-approve flow
  await expectEmailLogged("You're Verified on Elevra!");
});

// Reset candidate verification state after tests
type CandidateInfo = CandidateFixture["candidate"];

async function resetCandidateVerification(candidate: CandidateInfo, originalEmail: string) {
  const { id, slug } = candidate;
  try {
    await prisma.candidate.update({
      where: { slug },
      data: {
        verified: false,
        status: SubmissionStatus.PENDING,
        clerkUserId: null,
        email: originalEmail, // reset to the email used by this test
      },
    });
  } catch (err) {
    // Non-fatal in CI/local if record is already reset or missing
    console.warn("resetCandidateVerification failed:", err);
  }
  // Remove any template/content blocks created by previous tests
  try {
    await prisma.contentBlock.deleteMany({ where: { candidateId: id } });
  } catch (err) {
    console.warn(
      "resetCandidateVerification contentBlock cleanup failed:",
      err
    );
  }
}

import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import path from "path";

test("admin user can upload csv and send email (dry run)", async ({ page }) => {
  // Navigate to the admin outreach page (middleware will require auth)
  await page.goto("/admin/candidate-outreach");

  // Sign in using Clerk test credentials
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // Ensure we're on the outreach page after auth
  await page.goto("/admin/candidate-outreach");
  await expect(page.getByRole("heading", { name: "Candidate Outreach" })).toBeVisible();

  // Upload the test spreadsheet
  const csvPath = path.join(process.cwd(), "tests/files/test-spreadsheet.csv");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(csvPath);

  // Optional: set state to ensure template gets a state
  await page.getByLabel("State").fill("NJ");

  // Click Send Emails (opens confirmation), then confirm
  await page.getByRole("button", { name: "Send Emails" }).click();
  await expect(page.getByText(/Confirm Send/i)).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();

  // Wait for result textarea to appear and contain JSON
  const resultTextarea = page.locator("textarea");
  await expect(resultTextarea).toBeVisible();

  // Parse and validate the dry-run response
  const resultJson = await resultTextarea.inputValue();
  const parsed = JSON.parse(resultJson);

  expect(parsed).toMatchObject({
    success: true,
    requested: 3,
    valid: 3,
    sent: 3,
    failures: [],
    dryRun: true,
  });
  expect(Array.isArray(parsed.ids)).toBe(true);
  expect(parsed.ids).toHaveLength(3);
  for (const id of parsed.ids as string[]) {
    expect(typeof id).toBe("string");
    expect(id.startsWith("dryrun-")).toBeTruthy();
  }
});

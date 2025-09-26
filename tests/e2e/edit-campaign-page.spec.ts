import { clerk } from "@clerk/testing/playwright";
import { test, expect } from "./fixtures";

test("edit campaign page", async ({ page, candidate: _candidate }) => {
  await page.goto('/');
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });
  await page.getByRole('link', { name: 'Launch Your Campaign' }).click();
  await page.getByRole('button', { name: 'Candidate Login' }).click();
  await page.goto('/candidates/candidate-dashboard');
  await page.getByRole('link', { name: 'Campaign' }).click();
  await page.waitForURL('/candidates/candidate-dashboard/my-elections');
  await page.getByRole('button', { name: 'Edit Campaign Page' }).click();
  await expect(page.getByText('Getting Started')).toBeVisible();
});

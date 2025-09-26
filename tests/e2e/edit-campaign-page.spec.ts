import { clerk } from "@clerk/testing/playwright";
import { test, expect, getCredsForWorker } from "./fixtures";

test("edit campaign page", async ({ page, candidate: _candidate }) => {
  await page.goto('/');
  const { username, password } = getCredsForWorker(test.info().workerIndex);
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: username!,
      password: password!,
    },
  });
  await page.getByRole('link', { name: 'Launch Your Campaign' }).click();
  await page.getByRole('button', { name: 'Candidate Login' }).click();
  await page.goto('/candidates/candidate-dashboard');
  await page.getByRole('link', { name: 'Campaign' }).click();
  await page.waitForURL('/candidates/candidate-dashboard/my-elections');
  const editButton = page.getByRole('button', { name: 'Edit Campaign Page' });
  await editButton.first().click();
  await expect(page.getByText('Getting Started')).toBeVisible({ timeout: 30000 });
});

import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

test('create campaign page', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Find Election' }).click();
  await page.getByRole('textbox', { name: 'Search for elections...' }).fill('colo');
  await page.getByText('City Council Member - District 1').click();
  await page.getByRole('button', { name: 'Elevra Starter Template' }).click();
  await page.getByRole('button', { name: 'Create and Customize Campaign' }).click();
  await expect(page.getByText('Getting Started')).toBeVisible();
});
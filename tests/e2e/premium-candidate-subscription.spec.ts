import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { getCredsForWorker } from "./fixtures";
import { updateClerkPublicMetadata } from "../helpers";

test("Testing Unpaid User to Paid User Workflow", async ({ page }) => {
  await page.goto("/");
  const { username, password } = getCredsForWorker(test.info().workerIndex);
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: username!,
      password: password!,
    },
  });
  await page.goto("/candidates/?tab=login");

  // Assert that unsubscribed users see upgrade prompts on the candidate dashboard
  await expect(page.locator("text=Unlock Advanced Analytics")).toBeVisible();
  await expect(page.locator("text=Upgrade Plan")).toBeVisible();
  // Assert that the "Endorsements" link is disabled and displays the correct text and icon
  const endorsementsLink = page.locator('a[aria-disabled="true"]', {
    has: page.locator("span.flex-1", { hasText: "Endorsements" }),
  });
  await expect(endorsementsLink).toHaveAttribute("href", "#");
  await expect(endorsementsLink).toHaveClass(/cursor-not-allowed/);
  await expect(endorsementsLink.locator("svg.lucide-lock")).toBeVisible();

  // Assert that the "Analytics" link is disabled and displays the correct text and icon
  const analyticsLink = page.locator('a[aria-disabled="true"]', {
    has: page.locator("span.flex-1", { hasText: "Analytics" }),
  });
  await expect(analyticsLink).toHaveAttribute("href", "#");
  await expect(analyticsLink).toHaveClass(/cursor-not-allowed/);
  await expect(analyticsLink.locator("svg.lucide-chart-column")).toBeVisible();
  await expect(analyticsLink.locator("svg.lucide-lock")).toBeVisible();

  // Assert that visting a premium route redirects to the upgrade page
  await page.goto("/candidates/candidate-dashboard/analytics");
  await expect(page).toHaveURL("/candidates/candidate-dashboard/upgrade");

  await page.goto("/candidates/candidate-dashboard/endorsements");
  await expect(page).toHaveURL("/candidates/candidate-dashboard/upgrade");

  // Navigate back to the main dashboard
  await page.goto("/candidates/candidate-dashboard");

  // Assert that clicking the upgrade plan link takes user to pricing page
  await page.getByRole("link", { name: "Upgrade Plan" }).click();
  await expect(page).toHaveURL("/candidates/candidate-dashboard/upgrade");
  // Click the "Upgrade to Premium" button and assert it redirects to Stripe checkout
  await page.getByRole("button", { name: "Upgrade to Premium" }).click();
  await expect(page).toHaveURL(/https:\/\/checkout\.stripe\.com\//);
  // Assert that the Stripe checkout page displays the correct subscription details
  await expect(
    page.locator("text=Candidate Premium Subscription")
  ).toBeVisible();
  await expect(page.locator("text=$30.00")).toBeVisible();

  // Simulate successful payment by navigating back to the app

  updateClerkPublicMetadata(clerk, username!, {
    candidateSubscriptionTier: "premium",
    candidateSubscriptionUpdatedAt: new Date().toISOString(),
  });

  // Assert that premium features are now accessible
  await page.goto("/candidates/candidate-dashboard");
  await expect(
    page.locator("text=Unlock Advanced Analytics")
  ).not.toBeVisible();
  await expect(page.locator("text=Upgrade Plan")).not.toBeVisible();
});

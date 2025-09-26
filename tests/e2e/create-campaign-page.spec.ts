import { clerk } from "@clerk/testing/playwright";
import { test, expect, prisma } from "./fixtures";
import { expectHasElevraStarterTemplateBlocks } from "../helpers";

test("create campaign page", async ({ page, candidate }) => {
  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });
  await page.getByRole("link", { name: "Launch Your Campaign" }).click();
  await page.getByRole("button", { name: "Candidate Login" }).click();
  await page.goto("/candidates/candidate-dashboard");
  await page.getByRole("link", { name: "Campaign" }).click();
  await page.waitForURL("/candidates/candidate-dashboard/my-elections");
  await page.getByRole("button", { name: "Find Election" }).click();
  await page
    .getByRole("textbox", { name: "Search for elections..." })
    .fill("E2E Basic Election");
  const searchResult = page
    .getByRole("dialog")
    .locator("li", { hasText: "E2E Basic Election" })
    .first();
  await searchResult.click();
  await page.getByRole("button", { name: "Elevra Starter Template" }).click();
  const createButton = page.getByRole(
    "button",
    { name: "Create and Customize Campaign" }
  );
  await expect(createButton).toBeEnabled();
  const applyResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/api/v1/contentblocks/apply-template") &&
      response.request().method() === "POST"
    );
  });
  await createButton.click();
  const applyResponse = await applyResponsePromise;
  expect(applyResponse.ok()).toBeTruthy();
  await page.waitForURL('**/candidates/candidate-dashboard/my-elections/**', {
    timeout: 30000,
  });
  await expect(page.getByText("Getting Started")).toBeVisible({ timeout: 30000 });
  const latestLink = await prisma.electionLink.findFirst({
    where: { candidateId: candidate.id },
    orderBy: { joinedAt: "desc" },
  });
  expect(latestLink?.electionId).toBeTruthy();
  await expectHasElevraStarterTemplateBlocks(
    prisma,
    candidate.id,
    latestLink!.electionId
  );
});

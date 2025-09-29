import { test, expect, type Page } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { getCredsForWorker } from "./fixtures";

test("Click sign in -> Voter or Candidate Confirmation Pops Up", async ({
  page,
}) => {
  await page.goto(`/`);
  const signInButton = page.getByRole("button", { name: /sign in/i });
  await signInButton.click();
  await expect(
    page.getByRole("dialog", { name: /Are you a voter or candidate\?/i })
  ).toBeVisible();
});

test("Sign In -> Voter goes to Voter Dashboard", async ({ page }) => {
  const { username, password, metadata } = await resolveWorkerAccount(
    page,
    test.info().workerIndex
  );

  test.skip(!metadata.isVoter, "Worker user is not flagged as a voter");

  await page.goto(`/`);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(
    page.getByRole("dialog", { name: /Are you a voter or candidate\?/i })
  ).toBeVisible();
  await page.getByRole("button", { name: /voter/i }).click();
  await page.waitForURL(/\/sign-in/i, { timeout: 30000 });
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: username,
      password,
    },
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await expect(page).toHaveURL(new RegExp(`${appUrl}/dashboard(/?|\\?|$)`));
  await clerk.signOut({ page });
});

test("Sign In -> Candidate goes to Candidate Dashboard", async ({ page }) => {
  const { username, password, metadata } = await resolveWorkerAccount(
    page,
    test.info().workerIndex
  );

  test.skip(!metadata.isCandidate, "Worker user is not flagged as a candidate");

  await page.goto(`/`);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(
    page.getByRole("dialog", { name: /Are you a voter or candidate\?/i })
  ).toBeVisible();
  await page.getByRole("button", { name: /candidate/i }).click();
  await page.waitForURL(/\/sign-in/i, { timeout: 30000 });
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: username,
      password,
    },
  });
  await expect(page).toHaveURL(/\/candidates\/candidate-dashboard/);
  await clerk.signOut({ page });
});

type RoleMetadata = {
  isVoter?: boolean;
  isCandidate?: boolean;
};

async function resolveWorkerAccount(page: Page, workerIndex: number) {
  const { username, password } = getCredsForWorker(workerIndex);

  if (!username || !password) {
    throw new Error(
      `Missing Clerk credentials for worker ${workerIndex}. Set E2E_CLERK_USER_USERNAME and E2E_CLERK_USER_PASSWORD.`
    );
  }

  const metadataPage = await page.context().newPage();

  try {
    await metadataPage.goto(`/`);
    await clerk.signIn({
      page: metadataPage,
      signInParams: {
        strategy: "password",
        identifier: username,
        password,
      },
    });
    await clerk.loaded({ page: metadataPage });

    const metadataHandle = await metadataPage.waitForFunction(() => {
      const user = window.Clerk?.user;
      return user?.publicMetadata ?? null;
    });

    const metadata =
      ((await metadataHandle.jsonValue()) as RoleMetadata | null) ?? {};

    await clerk.signOut({ page: metadataPage });

    return { username, password, metadata };
  } finally {
    await metadataPage.close();
  }
}

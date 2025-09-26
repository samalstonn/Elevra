import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { getCredsForWorker } from "./fixtures";

test("user can sign in on home page and is redirected back to homepage", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Clerk's signIn utility uses setupClerkTestingToken() under the hood, so no reason to call it separately
  const { username, password } = getCredsForWorker(test.info().workerIndex);
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: username!,
      password: password!,
    },
  });

  await expect(page).toHaveURL(
    new RegExp(
      `^${
        process.env.NEXT_PUBLIC_APP_URL?.replace(
          /[-/\\^$*+?.()|[\]{}]/g,
          "\\$&"
        ) || "http://localhost:3000"
      }/?$`
    )
  );
});

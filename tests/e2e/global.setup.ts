import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { prisma } from "../prisma-client";

// Setup must be run serially, this is necessary if Playwright is configured to run fully parallel: https://playwright.dev/docs/test-parallel
setup.describe.configure({ mode: "serial" });

setup("global setup", async ({}) => {
  await clerkSetup();
});

// Touch the prisma client once so any connection errors surface early.
void prisma.$connect();

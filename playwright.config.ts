import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Read env files to populate process.env for tests
// Load .env first, then override with .env.local if present
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.local"), override: true });

// Set the port for the server
const PORT = process.env.PORT || 3000;

const vercelBypassToken = process.env.VERCEL_BYPASS_TOKEN;
const extraHTTPHeaders = vercelBypassToken
  ? { "x-vercel-protection-bypass": vercelBypassToken }
  : undefined;

// App URL used for navigation & assertions in tests
const baseURL = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${PORT}`;

export default defineConfig({
  // Look for tests in the "e2e" directory
  testDir: "./tests/e2e",
  globalTeardown: "./tests/e2e/global.teardown.ts",
  // Set the number of retries for each, in case of failure
  retries: 1,
  // Run your local dev server before starting the tests.
  // If we have a deployed URL, DO NOT start a server.
  webServer: !baseURL.includes("localhost")
    ? undefined
    : {
        command: "npm run dev",
        // Base URL to use in actions like `await page.goto('/')`
        url: baseURL,
        // Set the timeout for the server to start
        timeout: 120 * 1000,
        // Reuse the server between tests
        reuseExistingServer: !process.env.CI,
        // Ensure emails are not actually sent during tests
        env: {
          EMAIL_DRY_RUN: "1",
          EMAIL_DRY_RUN_LOG: "1",
        },
      },
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL,
    extraHTTPHeaders,

    // Collect trace when retrying the failed test.
    // See https://playwright.dev/docs/trace-viewer
    trace: "retry-with-trace",

    // Ignore HTTPS errors for localhost dev server with self-signed cert
    bypassCSP: true,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "global setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "Clerk Login",
      testMatch: "login-with-clerk.ts",
      use: {
        ...devices["Desktop Chrome"], // or your browser of choice
      },
      dependencies: ["global setup"],
    },
    {
      name: "This is Me",
      testMatch: "this-is-me.ts",
      use: {
        ...devices["Desktop Chrome"], // or your browser of choice
      },
      dependencies: ["global setup"],
    },
    {
      name: "Admin Emails",
      testMatch: "admin-email.spec.ts",
      use: {
        ...devices["Desktop Chrome"], // or your browser of choice
      },
      dependencies: ["global setup"],
    },
    {
      name: "Create Campaign",
      testMatch: "create-campaign-page.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["global setup"],
    },
    {
      name: "Edit Campaign",
      testMatch: "edit-campaign-page.spec.ts",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["global setup"],
    },
    {
      name: "Premium Candidate Subscription",
      testMatch: "premium-candidate-subscription.spec.ts",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["global setup"],
    },
  ],
});

import { clerk } from "@clerk/testing/playwright";
import { Page } from "@playwright/test";
import { test, getCredsForWorker } from "./fixtures";

export async function signInWithRole(page: Page, role: "candidate" | "voter") {
  const { username, password } = getCredsForWorker(test.info().workerIndex);
  
  try {
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: username!,
        password: password!,
      },
    });
    
    // Wait for sign-in to complete with a shorter timeout
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    
    // If networkidle times out, try waiting for DOM content loaded instead
  } catch (error) {
    console.log("Networkidle timeout, trying DOM content loaded...");
    await page.waitForLoadState("domcontentloaded", { timeout: 5000 });
  }

  try {
    await page.evaluate(async (payload) => {
      const res = await fetch("/api/user/metadata/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to set role: ${res.status}`);
      }
    }, { role });
    
    // Wait for role to be set
    await page.waitForTimeout(500);
  } catch (error) {
    console.error("Role setting failed:", error);
    throw error;
  }
}

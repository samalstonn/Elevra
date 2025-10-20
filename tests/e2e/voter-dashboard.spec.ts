import type { Page } from "@playwright/test";
import { test, expect, prisma, getCredsForWorker } from "./fixtures";
import { clerk } from "@clerk/testing/playwright";
import { expectEmailLogged, readEmailLog } from "../helpers";
import { promises as fs } from "node:fs";
import path from "node:path";

const EMAIL_LOG_PATH = path.join(
  process.cwd(),
  "lib/email/logs/.test-emails.log"
);

async function signInWithRole(page: Page, role: "candidate" | "voter") {
  const { username, password } = getCredsForWorker(test.info().workerIndex);
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: username!,
      password: password!,
    },
  });
  await page.waitForLoadState("networkidle");

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
}

test.describe.configure({ mode: "serial" });

test.describe("Voter dashboard refactor", () => {
  test("guest clicking follow prompts sign-in modal", async ({ page, candidate }) => {
    await page.goto(`/candidate/${candidate.slug}`);
    const followButton = page.getByTestId("follow-button");
    await expect(followButton).toBeVisible();
    await followButton.click();
    await expect(page.getByTestId("signin-modal")).toBeVisible();
  });

  test("non-voter sees verification modal when attempting to follow", async ({ page, candidate }) => {
    await page.goto(`/candidate/${candidate.slug}`);
    await signInWithRole(page, "candidate");
    await page.goto(`/candidate/${candidate.slug}`);
    await page.getByTestId("follow-button").click();
    await expect(page.getByTestId("verify-modal")).toBeVisible();
  });

  test("voter can follow candidate and state persists after reload", async ({ page, candidate }) => {
    await page.goto(`/candidate/${candidate.slug}`);
    await signInWithRole(page, "voter");
    await page.goto(`/candidate/${candidate.slug}`);
    const followButton = page.getByTestId("follow-button");
    await followButton.click();
    await expect(followButton).toHaveText(/Following/i);
    await page.reload();
    await expect(page.getByTestId("follow-button")).toHaveText(/Following/i);
  });

  test("activity feed shows followed candidate updates and View candidate navigates", async ({
    page,
    candidate,
  }) => {
    const { userId } = getCredsForWorker(test.info().workerIndex);
    if (!userId) {
      test.skip(true, "Missing Clerk userId for test worker");
    }

    await signInWithRole(page, "voter");

    // Ensure clean state
    await clearVoterState(userId, candidate.id);
    await clearCandidateEvents(candidate.id);

    await ensureFollow(userId, candidate.id);

    const otherCandidate = await prisma.candidate.create({
      data: {
        name: `Not Followed ${Date.now()}`,
        slug: `not-followed-${Date.now()}`,
        bio: "Other candidate bio",
        currentRole: "Role",
        currentCity: "City",
        currentState: "ST",
        status: "APPROVED",
        history: [],
        uploadedBy: "tests@elevra.com",
      },
    });

    const now = new Date();
    await createChangeEvent(candidate.id, "BIO", {
      summary: "Bio updated",
    }, new Date(now.getTime() - 60_000));
    await createChangeEvent(candidate.id, "CAMPAIGN", {
      summary: "Campaign page refreshed",
    }, now);
    await createChangeEvent(otherCandidate.id, "PHOTO", {
      summary: "Photo updated",
    }, new Date(now.getTime() - 30_000));

    await page.goto("/dashboard");
    await openTab(page, "Feed");

    const feedItems = page.getByTestId("feed-item");
    await expect(feedItems).toHaveCount(2);

    const newest = feedItems.first();
    await expect(newest).toContainText("Campaign page refreshed");
    await expect(newest).toContainText(candidate.name);

    const oldest = feedItems.nth(1);
    await expect(oldest).toContainText("Bio updated");

    await newest.getByRole("link", { name: /View candidate/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/candidate/${candidate.slug}`)
    );

    await prisma.changeEvent.deleteMany({
      where: { candidateId: otherCandidate.id },
    });
    await prisma.candidate.delete({
      where: { id: otherCandidate.id },
    });
  });

  test("notifications badge updates and mark all read clears unread state", async ({
    page,
    candidate,
  }) => {
    const { userId } = getCredsForWorker(test.info().workerIndex);
    if (!userId) {
      test.skip(true, "Missing Clerk userId for test worker");
    }

    await signInWithRole(page, "voter");
    await clearVoterState(userId, candidate.id);
    await clearCandidateEvents(candidate.id);
    const voter = await ensureFollow(userId, candidate.id);

    const event = await createChangeEvent(candidate.id, "PHOTO", {
      summary: "New profile photo",
    });

    await prisma.notification.create({
      data: {
        voterId: voter.id,
        changeEventId: event.id,
        type: "CANDIDATE_UPDATE",
        status: "UNREAD",
        payload: {
          title: "Photo updated",
        },
      },
    });

    await page.goto("/dashboard");
    await openTab(page, "Inbox");

    const unreadBadge = page.getByTestId("notification-unread-count");
    await expect(unreadBadge).toHaveText("1");

    const notificationItems = page.getByTestId("notification-item");
    await expect(notificationItems).toHaveCount(1);
    await expect(notificationItems.first()).toHaveAttribute("data-read", "false");

    await page.getByTestId("mark-all-button").click();

    await expect(unreadBadge).toHaveText("0");
    await expect(notificationItems.first()).toHaveAttribute("data-read", "true");
  });

  test("search tab provides typeahead and navigates to selection", async ({
    page,
    candidate,
  }) => {
    const { userId } = getCredsForWorker(test.info().workerIndex);
    if (!userId) {
      test.skip(true, "Missing Clerk userId for test worker");
    }

    await signInWithRole(page, "voter");
    await clearVoterState(userId, candidate.id);
    await ensureFollow(userId, candidate.id);

    await page.goto("/dashboard");
    await openTab(page, "Search");

    const input = page.getByTestId("search-input");
    await input.fill(candidate.name.slice(0, 4));

    const firstResult = page.getByTestId("search-result-item").first();
    await expect(firstResult).toContainText(candidate.name);
    await firstResult.click();

    await expect(page).toHaveURL(
      new RegExp(`/candidate/${candidate.slug}`)
    );
  });

  test("email hooks fire for follow and candidate updates respecting preferences", async ({
    page,
    candidate,
  }) => {
    const { userId } = getCredsForWorker(test.info().workerIndex);
    if (!userId) {
      test.skip(true, "Missing Clerk userId for test worker");
    }

    await clearEmailLog();

    await signInWithRole(page, "voter");
    await clearVoterState(userId, candidate.id);
    const voter = await ensureFollow(userId, candidate.id, { autoFollow: false });

    await page.goto(`/candidate/${candidate.slug}`);
    await page.getByTestId("follow-button").click();

    await expectEmailLogged("just followed");

    await prisma.voterPreference.update({
      where: { voterId: voter.id },
      data: {
        emailMode: "IMMEDIATE",
        notifyBio: true,
        notifyEducation: true,
        notifyPhoto: true,
        notifyCampaign: true,
      },
    });

    await createChangeEvent(candidate.id, "BIO", {
      summary: "Bio refreshed",
    });
    await flushEmailQueue();

    const subjectsAfterBio = await collectEmailSubjects();
    expect(subjectsAfterBio.some((subject) => /bio/i.test(subject))).toBe(true);

    // turn off photo updates and ensure suppression for PHOTO updates
    await prisma.voterPreference.update({
      where: { voterId: voter.id },
      data: { notifyPhoto: false },
    });
    await createChangeEvent(candidate.id, "PHOTO", {
      summary: "New headshot",
    });
    await flushEmailQueue();
    const subjectsAfterPhoto = await collectEmailSubjects();
    expect(subjectsAfterPhoto.length).toBe(subjectsAfterBio.length);
  });

  test("follow button and gating modals are focusable with visible focus ring", async ({
    page,
    candidate,
  }) => {
    await page.goto(`/candidate/${candidate.slug}`);
    const followButton = page.getByTestId("follow-button");
    await followButton.focus();
    await expect(followButton).toBeFocused();
    await expect(followButton).toHaveCSS("outline-style", "solid");

    await followButton.click();
    const signinModal = page.getByTestId("signin-modal");
    await expect(signinModal).toBeVisible();
    const modalClose = signinModal.getByRole("button", { name: /Close/i });
    await modalClose.focus();
    await expect(modalClose).toBeFocused();
    await expect(modalClose).toHaveCSS("outline-style", "solid");
  });
});

async function clearVoterState(clerkUserId: string, candidateId: number) {
  await prisma.notification.deleteMany({
    where: {
      voter: { clerkUserId },
    },
  });
  await prisma.follow.deleteMany({
    where: {
      candidateId,
      voter: { clerkUserId },
    },
  });
  await prisma.voterPreference.deleteMany({
    where: { voter: { clerkUserId } },
  });
  await prisma.voter.deleteMany({
    where: { clerkUserId },
  });
}

async function clearCandidateEvents(candidateId: number) {
  await prisma.notification.deleteMany({
    where: { changeEvent: { candidateId } },
  });
  await prisma.changeEvent.deleteMany({
    where: { candidateId },
  });
}

async function ensureFollow(
  clerkUserId: string,
  candidateId: number,
  options: { autoFollow?: boolean } = {}
) {
  const voter = await prisma.voter.upsert({
    where: { clerkUserId },
    update: {},
    create: {
      clerkUserId,
      email: `${clerkUserId}@test.elevra`,
    },
  });

  await prisma.voterPreference.upsert({
    where: { voterId: voter.id },
    update: {},
    create: { voterId: voter.id },
  });

  if (options.autoFollow !== false) {
    await prisma.follow.create({
      data: {
        voterId: voter.id,
        candidateId,
      },
    });
  }

  return voter;
}

async function createChangeEvent(
  candidateId: number,
  type: "BIO" | "EDUCATION" | "PHOTO" | "CAMPAIGN",
  metadata: Record<string, unknown>,
  createdAt?: Date
) {
  return await prisma.changeEvent.create({
    data: {
      candidateId,
      type,
      metadata,
      createdAt,
    },
  });
}

async function openTab(page: Page, label: string) {
  const tab = page.getByRole("button", { name: label, exact: true });
  await tab.click();
}

async function clearEmailLog() {
  try {
    await fs.mkdir(path.dirname(EMAIL_LOG_PATH), { recursive: true });
    await fs.writeFile(EMAIL_LOG_PATH, "");
  } catch (error) {
    console.warn("Failed to clear email log", error);
  }
}

async function collectEmailSubjects(): Promise<string[]> {
  const raw = await readEmailLog();
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const brace = line.indexOf("{");
      if (brace === -1) return line;
      try {
        const parsed = JSON.parse(line.slice(brace));
        return typeof parsed.subject === "string" ? parsed.subject : line;
      } catch {
        return line;
      }
    });
}

async function flushEmailQueue() {
  // Placeholder; queue processing handled inside the app once implemented.
}

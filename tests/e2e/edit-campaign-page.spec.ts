import { clerk } from "@clerk/testing/playwright";
import { test, expect, getCredsForWorker, prisma } from "./fixtures";
import {
  expectAllBlocksToMatchCriteria,
  expectCandidateFieldValue,
  getCandidateBlocks,
  getCandidateElectionId,
  seedContentBlocksForCandidate,
  updateCandidateField,
} from "../helpers";
import { ContentBlock } from "@prisma/client";

test("edit campaign page", async ({ page, candidate: _candidate }) => {
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
  const electionId = await getCandidateElectionId(prisma, _candidate.id).then(
    (id) => id
  );
  await seedContentBlocksForCandidate(prisma, _candidate.id, electionId);
  await page.getByRole("link", { name: "Launch Your Campaign" }).click();
  await page.getByRole("button", { name: "Candidate Login" }).click();
  await page.goto("/candidates/candidate-dashboard");
  await page.getByRole("link", { name: "Campaign" }).click();
  await page.waitForURL("/candidates/candidate-dashboard/my-elections");
  const editButton = page.getByRole("button", { name: "Edit Campaign Page" });
  await editButton.first().click();
  await expect(page.getByText("Getting Started")).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Start Editing" }).click();

  // Test image upload
  const changePhotoButton = page
    .getByRole("button", {
      name: "Click to change photo",
    })
    .first(); // Explicitly select the first matching button
  await expect(changePhotoButton).toBeVisible();
  await changePhotoButton.click();
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles("public/Elevra.png");
  await page.waitForTimeout(1000); // Wait for the image to upload
  const uploadedImage = page.locator('img[src*="Elevra.png"]');
  await expect(uploadedImage).toBeVisible();

  // Test header editing
  const header = page.getByRole("heading", {
    name: "I’m Johnny Appleseed & I’m",
  });
  await header.fill("This is a test header");
  await page.waitForTimeout(1000);
  const header2 = page.getByRole("heading", {
    name: "This is a test header",
  });
  const className = await header2.evaluate((node) => node.className);
  expect(className).toBe("text-4xl font-bold text-black px-2 py-1");

  // Test description editing
  const description = page.getByText("I was raised right here in");
  await description.click();
  await description.fill("This is a test description");
  await page.waitForTimeout(1000);
  const description2 = page.getByText("This is a test description");
  const className2 = await description2.evaluate((node) => node.className);
  expect(className2).toBe("text-sm whitespace-pre-wrap text-black px-2 py-1");

  // Test Sub-header editing
  const subHeader = page.getByRole("heading", {
    name: "What I Bring",
    level: 2,
  });
  await subHeader.click();
  await subHeader.fill("This is a test sub-header");
  await page.waitForTimeout(1000);
  const subHeader2 = page.getByRole("heading", {
    name: "This is a test sub-header",
    level: 2,
  });
  const className4 = await subHeader2.evaluate((node) => node.className);
  expect(className4).toBe("text-2xl font-semibold text-black px-2 py-1");

  // Test bullet list editing
  const listItem = page.getByText("I bring commitment.");
  await listItem.click();
  await listItem.fill("This is a test list item");
  await page.waitForTimeout(1000);
  const listItem2 = page.getByText("This is a test list item");
  const className3 = await listItem2.evaluate((node) => node.className);
  expect(className3).toBe("min-w-[4ch] pr-4 outline-none align-top text-black");

  // Delete other list item
  const deleteButton = page.locator("svg.lucide.lucide-trash2.w-3.h-3").nth(1); // Select the second delete button (one after the test list item)
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
  await page.waitForTimeout(1000); // Wait for the deletion to complete
  const deletedListItem = page.getByText(
    "I bring a passion for fairness. Every student deserves the chance to thrive in an environment where they feel safe, respected, and supported. That means looking closely at the challenges they face and making sure our policies turn our shared values into action."
  );
  await expect(deletedListItem).not.toBeVisible();

  // Test Saving
  const saveButton = page.getByRole("button", { name: "Save" });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await page.waitForTimeout(1000); // Wait for save confirmation
  const successToast = page.locator(
    'div.text-sm.font-semibold:has-text("Content saved")'
  );
  await expect(successToast).toHaveText("Content saved");

  // Test Published Page
  const viewPublicProfileLink = page.getByRole("link", {
    name: "View Public Profile",
  });
  await expect(viewPublicProfileLink).toHaveAttribute(
    "href",
    `/candidate/${_candidate.slug}`
  );
  await viewPublicProfileLink.click();
  await page.waitForURL(`/candidate/${_candidate.slug}`);

  // Navigate to the election tab
  const basicElectionButton = page.getByRole("button", {
    name: "E2E Basic Election",
  });
  await expect(basicElectionButton).toBeVisible();
  await basicElectionButton.click();

  // Verify that the changes are reflected on the public profile
  const publicHeader = page.getByRole("heading", {
    name: "This is a test header",
  });
  await expect(publicHeader).toBeVisible();

  const publicDescription = page.getByText("This is a test description");
  await expect(publicDescription).toBeVisible();

  const publicSubHeader = page.getByRole("heading", {
    name: "This is a test sub-header",
    level: 2,
  });
  await expect(publicSubHeader).toBeVisible();
  const editedListItems = [
    "This is a test list item",
    "I bring curiosity and courage. I believe in asking thoughtful questions, seeking real answers, and not backing away from difficult topics. Honest dialogue is how we find solutions that work for everyone.",
    "I bring proven leadership. In my career, I’ve led teams through tight deadlines, complex projects, and tough decisions. I know how to listen, prioritize, and collaborate to reach goals that serve the greater good.",
    "I bring perspective. I see our schools through two lenses - my own years as a student here and my experiences as a parent today. That dual view helps me appreciate our progress while keeping my eyes on what still needs to be done.",
  ];

  for (const listItemText of editedListItems) {
    const listItem = page.getByText(listItemText);
    await expect(listItem).toBeVisible();
  }

  const publicImage = page.locator('img[src*="Elevra.png"]');
  await expect(publicImage).toBeVisible();

  // Verify that old content blocks do not show up
  const uneditedHeader = page.getByRole("heading", {
    name: "I’m Johnny Appleseed & I’m",
  });
  await expect(uneditedHeader).not.toBeVisible();

  const uneditedDescription = page.getByText("I was raised right here in");
  await expect(uneditedDescription).not.toBeVisible();

  const uneditedSubHeader = page.getByRole("heading", {
    name: "What I Bring",
    level: 2,
  });
  await expect(uneditedSubHeader).not.toBeVisible();

  const uneditedListItem = page.getByText("I bring commitment.");
  await expect(uneditedListItem).not.toBeVisible();

  const uneditedJohnnyImage = page.locator('img[src*="johnny-appleseed.png"]');
  await expect(uneditedJohnnyImage).not.toBeVisible();

  // Verify that unedited content blocks do not show up
  const uneditedWhatIBelieve = page.getByRole("heading", {
    name: "What I Believe",
    level: 2,
  });
  await expect(uneditedWhatIBelieve).not.toBeVisible();

  const uneditedWhyRunningHeader = page.getByRole("heading", {
    name: "Why I’m Running",
    level: 2,
  });
  await expect(uneditedWhyRunningHeader).not.toBeVisible();

  const uneditedListItems = [
    "I believe our schools should reflect the very best of Hackensack - championing every student, honoring diverse perspectives, and opening doors so all children can reach their potential.",
    "I believe we have a responsibility to stand with our most vulnerable students and make sure every child has the tools, support, and opportunities they need to succeed, no matter their background, learning style, or personal challenges.",
    "I believe in hearing from all voices, not just the loudest. Our strength comes from listening to students, families, educators, and neighbors with a range of experiences and perspectives.",
    "I believe in facing tough questions head-on and making decisions with clarity and integrity - being transparent about trade-offs and grounded in shared values.",
    "I believe public education is one of our greatest investments - not only for today’s students but for the future health, prosperity, and unity of our community.",
  ];

  for (const listItemText of uneditedListItems) {
    const listItem = page.getByText(listItemText);
    await expect(listItem).not.toBeVisible();
  }

  const deletedListItemPublic = page.getByText(
    "I bring a passion for fairness. Every student deserves the chance to thrive in an environment where they feel safe, respected, and supported. That means looking closely at the challenges they face and making sure our policies turn our shared values into action."
  );
  await expect(deletedListItemPublic).not.toBeVisible();

  const newContentBlock = page.getByText(
    "The heart of Hackensack has always been its people. My connection to this city didn’t begin with this campaign - it began as a kid walking the halls of our public schools, learning from the dedicated teachers who helped shape who I am.\n\nI’m committed to strengthening that connection and doing everything I can to support our students, families, and schools. I’m ready to work collaboratively with fellow board members and our administration to make Hackensack’s schools - and our community - the very best they can be."
  );
  await expect(newContentBlock).not.toBeVisible();

  const uneditedLawnSignImage = page.locator('img[src*="johnny-lawnsign.png"]');
  await expect(uneditedLawnSignImage).not.toBeVisible();

  // Verify that updatedAt is updated for modified blocks and equal to createdAt for unmodified blocks
  const blocks = await getCandidateBlocks(prisma, _candidate.id, electionId);
  const modifiedBlocks = blocks.filter(
    (block) =>
      block.text?.includes("This is a test") ||
      (block.type === "IMAGE" && block.imageUrl?.includes("Elevra.png"))
  );

  expectAllBlocksToMatchCriteria(
    modifiedBlocks,
    (block) => block.updatedAt > block.createdAt
  );
  const unmodifiedBlocks = blocks.filter(
    (block) =>
      !block.text?.includes("This is a test") &&
      !(block.type === "IMAGE" && block.imageUrl?.includes("Elevra.png"))
  );
  expectAllBlocksToMatchCriteria(
    unmodifiedBlocks,
    (block) => block.updatedAt.getTime() === block.createdAt.getTime()
  );
});

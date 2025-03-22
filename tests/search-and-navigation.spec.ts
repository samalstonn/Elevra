import { test, expect } from '@playwright/test';

test('should navigate from homepage to results page and display candidates', async ({ page }) => {
  // Start from homepage
  await page.goto('http://localhost:3000');

  // Find and fill the zipcode input
  const zipInput = page.getByPlaceholder(/Enter your/i);
  await expect(zipInput).toBeVisible();
  await zipInput.fill('53202'); // Milwaukee zipcode

  // Click the search button (the button with image next to the input)
  const searchButton = page.getByPlaceholder(/Enter your/i).locator('xpath=following-sibling::button');
  await expect(searchButton).toBeVisible();
  await searchButton.click();

  // Verify we're redirected to results page with correct parameters
  await expect(page).toHaveURL(/.*results\?city=Milwaukee&state=WI/);

  // Wait for loading state to complete
  await page.waitForSelector('div:has-text("Loading...")', { state: 'detached' });

  // Verify that at least one election section exists
  const electionHeading = page.locator('h2').first();
  await expect(electionHeading).toBeVisible();

  // Verify that the election description is present
  const electionDescription = page.locator('.text-sm.text-gray-800').first();
  await expect(electionDescription).toBeVisible();

  // Verify that candidate cards section exists and has content
  const candidateSection = page.locator('.grid, .flex-nowrap').first();
  await expect(candidateSection).toBeVisible();
  
  // Verify at least one candidate card exists
  const candidateCard = page.locator('.rounded-lg').first();
  await expect(candidateCard).toBeVisible();
});

test('test', async ({ page }) => {
    await page.goto('http://localhost:3000/candidate/sam-alston?candidateID=17&electionID=13');
    
    // Wait for suggested candidates section to load
    await page.waitForSelector('h2:has-text("Your Suggested Candidates")', { state: 'visible' });
    
    // Click the first suggested candidate link using the exact structure from the HTML
    const suggestedCandidate = page.locator('.space-y-3 > div > a').first();
    await expect(suggestedCandidate).toBeVisible();
    
    // Store the original candidate name for verification
    const candidateName = await suggestedCandidate.locator('.text-sm.font-semibold').textContent();
    await suggestedCandidate.click();
    
    // Verify navigation
    const newPageHeading = page.locator('h1').first();
    await expect(newPageHeading).toBeVisible();
    await expect(newPageHeading).not.toContainText('Sam Alston');
    await expect(page).toHaveURL(/.*\/candidate\/.*\?candidateID=\d+&electionID=\d+/);
});
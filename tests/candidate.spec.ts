import { test, expect } from '@playwright/test';

test.describe('Candidate Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test candidate page before each test
    await page.goto('http://localhost:3000/candidate/sam-alston?candidateID=17&electionID=13');
  });

  test('should display candidate information', async ({ page }) => {
    // Check for main candidate information
    await expect(page.getByRole('heading', { name: /sam alston/i })).toBeVisible();
    await expect(page.locator('p.text-sm.font-medium.text-gray-600')).toHaveText(/Test Position/);
    await expect(page.getByText(/Party/i)).toBeVisible();
    
    // Check for candidate photo
    await expect(page.getByRole('img', { name: /sam alston/i })).toBeVisible();
  });

  test('should display social links when available', async ({ page }) => {
    // Check for social media icons
    const socialLinks = page.locator('a[href*="twitter"], a[href*="linkedin"], a[href*="http"]');
    await expect(socialLinks).toHaveCount(0);
  });

  test('should display policies section', async ({ page }) => {
    // Check for policies section
    await expect(page.getByRole('heading', { name: /policies/i })).toBeVisible();
    
    // Check for policy items
    const policyItems = page.getByText(/✅/);
    await expect(policyItems).toHaveCount(2);
  });

  test('should handle donation flow', async ({ page }) => {
    // Click the donation button
    await page.getByRole('button', { name: /donate/i }).click();
    
    // Check if we're redirected to the donation page or if a modal appears
    // This will depend on your implementation
    await expect(page).toHaveURL(/.*donate|.*checkout/);
  });

  test('should display suggested candidates', async ({ page }) => {
    // Check for related candidates section
    await expect(page.getByText(/Suggested Candidates/i)).toBeVisible();
    
    // Check for related candidate cards
    const relatedCandidates = page.locator('img[alt*="candidate"]');
    await expect(relatedCandidates).toHaveCount(0);
  });

  test('should handle candidate verification status', async ({ page }) => {
    // Check for verification icon using a more specific selector
    const verificationIcon = page.locator('svg[class*="text-gray-400"]');
    await expect(verificationIcon).toBeVisible();
    
    // Hover over verification icon to see tooltip
    await verificationIcon.hover();
    await expect(page.getByText(/This candidate has not verified their information/i)).toBeVisible();
  });
}); 
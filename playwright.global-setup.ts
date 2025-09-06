import { chromium } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000'
const CANDIDATE_SLUG = process.env.E2E_CANDIDATE_SLUG || ''

async function clerkTwoStepSignIn(context, email: string, password: string, finalPathAfterLogin: string, storagePath: string) {
  const page = await context.newPage()
  // Step 1: email on app sign-in page
  await page.goto(`${BASE_URL}/sign-in?redirect_url=${encodeURIComponent(finalPathAfterLogin)}`)

  const emailLocator = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()
  await emailLocator.fill(email)
  await page.getByRole('button', { name: /continue|sign in|next/i }).first().click()

  // If redirected to accounts.dev factor-one, enter password
  try { await page.waitForURL(/accounts\.[^/]+\/sign-in(\/factor-one)?/i, { timeout: 15000 }) } catch {}
  const pwdCount = await page.locator('input[type="password"]').count()
  if (pwdCount > 0) {
    await page.locator('input[type="password"]').first().fill(password)
    await page.getByRole('button', { name: /continue|sign in|log in/i }).first().click()
  }

  // Follow redirect_url chain if present
  for (let i = 0; i < 2; i++) {
    try {
      const url = new URL(page.url())
      const r = url.searchParams.get('redirect_url')
      if (r) {
        const decoded = decodeURIComponent(r)
        await page.goto(decoded)
      }
    } catch {}
  }

  // Confirm we reached the app
  await page.waitForURL(`**${finalPathAfterLogin}`, { timeout: 30000 })

  // Save storage state
  await page.context().storageState({ path: storagePath })
  await page.close()
}

async function globalSetup() {
  const browser = await chromium.launch()

  const matchEmail = process.env.E2E_TEST_EMAIL
  const matchPassword = process.env.E2E_TEST_PASSWORD
  const nonmatchEmail = process.env.E2E_NONMATCH_EMAIL
  const nonmatchPassword = process.env.E2E_NONMATCH_PASSWORD

  const finalPath = `/candidate/${CANDIDATE_SLUG}`

  // Create auth storage for matching user
  if (matchEmail && matchPassword && CANDIDATE_SLUG) {
    const ctx = await browser.newContext()
    await clerkTwoStepSignIn(ctx, matchEmail, matchPassword, finalPath, 'playwright/.auth/match.json')
    await ctx.close()
  }

  // Create auth storage for non-matching user
  if (nonmatchEmail && nonmatchPassword && CANDIDATE_SLUG) {
    const ctx = await browser.newContext()
    await clerkTwoStepSignIn(ctx, nonmatchEmail, nonmatchPassword, finalPath, 'playwright/.auth/nonmatch.json')
    await ctx.close()
  }

  await browser.close()
}

export default globalSetup


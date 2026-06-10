import { test, expect } from '@playwright/test'

// Uses the slug seeded in the dev database. Update if the slug differs.
const KNOWN_SLUG = 'nov-2026-event'
const MISSING_SLUG = 'this-slug-does-not-exist-xyz123'

test.describe('Public /fair/[slug] discovery page', () => {
  test('valid slug loads the event page without error', async ({ page }) => {
    const response = await page.goto(`/fair/${KNOWN_SLUG}`)
    expect(response?.status()).not.toBe(500)
    // Page should NOT show the "not available" message for a valid event
    await expect(page.getByText("This event page isn't available")).not.toBeVisible()
    // Confirm we are on a real event page by checking for at least one heading
    await expect(page.locator('h1')).toBeVisible()
  })

  test('invalid slug shows graceful "not available" message, not a 500', async ({ page }) => {
    const response = await page.goto(`/fair/${MISSING_SLUG}`)
    // Must not be a 500 server error
    expect(response?.status()).not.toBe(500)
    // Should render the "not available" copy from the not-found branch
    await expect(page.getByText("This event page isn't available")).toBeVisible()
    // Should also show the "404" indicator text
    await expect(page.getByText('404')).toBeVisible()
  })

  test('unauthenticated visitor clicking "Request a booth" is redirected to /auth/login', async ({ page }) => {
    // Navigate as a logged-out user (no cookies)
    await page.goto(`/fair/${KNOWN_SLUG}`)

    // Booth CTA is only rendered when ctaHref is set, which requires booth types on the event.
    // If no booth types exist the floating CTA won't appear — the test will skip gracefully.
    const ctaLocator = page.getByRole('link', { name: /request a booth/i }).first()
    const ctaCount = await ctaLocator.count()

    if (ctaCount === 0) {
      test.skip(true, `No "Request a booth" CTA found on /fair/${KNOWN_SLUG} — event may have no booth types or may not exist`)
    }

    await ctaLocator.click()

    // After click, browser should land on /auth/login (with a redirect param)
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

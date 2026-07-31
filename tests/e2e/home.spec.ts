import { test, expect } from './fixtures/test'
import { AppShell } from './pages/AppShell'

/**
 * E2E — home page, app shell, theme and responsive behaviour.
 */

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads successfully with a main landmark and a heading', async ({ page }) => {
    await expect(page).toHaveTitle(/FirstNest/i)
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('offers the two primary journeys', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Check my grants & schemes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Check my grant calculator/i })).toBeVisible()
  })

  test('starts the questionnaire from the primary call to action', async ({ page }) => {
    await page.getByRole('button', { name: /Check my grants & schemes/i }).click()

    await expect(page).toHaveURL(/\/onboarding/)
    await expect(page.getByPlaceholder('e.g. Sarah')).toBeVisible()
  })

  test('exposes a skip-to-content link for keyboard users', async ({ page }) => {
    const skipLink = page.getByRole('link', { name: /Skip to main content/i })
    await skipLink.focus()
    await expect(skipLink).toBeFocused()
  })

  test('logs no page errors while loading', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('returns a 404-safe page for an unknown route', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('theme switching', () => {
  test('toggles between light and dark and updates the document', async ({ page }) => {
    const shell = new AppShell(page)
    await page.goto('/')

    const before = await shell.currentTheme()
    await shell.toggleTheme()

    await expect
      .poll(() => shell.currentTheme(), { message: 'theme should change on toggle' })
      .not.toBe(before)

    await shell.toggleTheme()
    await expect.poll(() => shell.currentTheme()).toBe(before)
  })

  test('keeps the chosen theme across a navigation', async ({ page }) => {
    const shell = new AppShell(page)
    await page.goto('/')

    await shell.toggleTheme()
    const chosen = await shell.currentTheme()

    await page.goto('/onboarding')
    await expect.poll(() => shell.currentTheme()).toBe(chosen)
  })

  test('renders the questionnaire legibly in dark mode', async ({ page }) => {
    const shell = new AppShell(page)
    await page.goto('/')
    await shell.toggleTheme()

    await page.goto('/onboarding')
    await expect(page.getByPlaceholder('e.g. Sarah')).toBeVisible()
  })
})

test.describe('responsive layout', () => {
  test('shows the mobile menu control on a phone viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'mobile viewport only')

    await page.goto('/')
    await expect(new AppShell(page).mobileMenuButton).toBeVisible()
  })

  test('does not overflow horizontally on a phone viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'mobile viewport only')

    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    expect(overflow, 'page should not scroll sideways on mobile').toBe(false)
  })

  test('keeps the primary call to action reachable at 1280px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'desktop viewports only')

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    await expect(page.getByRole('button', { name: /Check my grants & schemes/i })).toBeVisible()
  })

  test('remains usable at a narrow 320px width', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'set explicitly here')

    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    expect(overflow).toBe(false)
  })
})

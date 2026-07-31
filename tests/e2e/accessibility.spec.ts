import { test, expect, analyzeA11y, formatViolations } from './fixtures/test'
import { QuestionnairePage } from './pages/QuestionnairePage'
import { AppShell } from './pages/AppShell'

/**
 * E2E — automated accessibility checks with axe-core.
 *
 * Scope is WCAG 2.1 A/AA, the standard the design system claims to meet.
 *
 * IMPORTANT: axe catches roughly a third of real accessibility problems. A
 * clean run here is a floor, not a certificate — it cannot judge focus order,
 * whether an error message makes sense read aloud, or whether a control is
 * operable in practice. The keyboard journeys in questionnaire.spec.ts and
 * forms.spec.ts cover part of the remainder; manual audit covers the rest.
 */

/** Fails with the offending rule ids and nodes rather than a bare count. */
function expectNoViolations(results: Awaited<ReturnType<typeof analyzeA11y>>) {
  expect(results.violations, formatViolations(results.violations)).toEqual([])
}

test.describe('accessibility — key pages', () => {
  test('home page has no detectable WCAG A/AA violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expectNoViolations(await analyzeA11y(page))
  })

  test('questionnaire step 1 has no detectable violations', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()

    expectNoViolations(await analyzeA11y(page))
  })

  test('questionnaire step 2 has no detectable violations', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()
    await q.fillStart('Sarah')
    await q.nextButton.click()
    await expect(q.stepIndicator(2)).toBeVisible()

    expectNoViolations(await analyzeA11y(page))
  })

  test('questionnaire in an error state has no detectable violations', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()
    await q.nextButton.click()
    await expect(q.errors.first()).toBeVisible()

    expectNoViolations(await analyzeA11y(page))
  })

  test('results page has no detectable violations', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()
    await q.completeThroughHistory('Sarah')
    await q.fillIncome()
    await q.submitButton.click()
    await expect(page).toHaveURL(/\/results\/grants/)

    expectNoViolations(await analyzeA11y(page))
  })
})

test.describe('accessibility — dialogs', () => {
  test('feedback modal has no detectable violations', async ({ page }) => {
    const shell = new AppShell(page)
    await page.goto('/')
    await shell.openFeedback()

    expectNoViolations(await analyzeA11y(page))
  })

  test('feedback modal in an error state has no detectable violations', async ({ page }) => {
    const shell = new AppShell(page)
    await page.goto('/')
    await shell.openFeedback()
    await shell.feedbackSubmit.click()
    await expect(page.getByText(/Please choose a feedback type/i)).toBeVisible()

    expectNoViolations(await analyzeA11y(page))
  })

  test('contact modal has no detectable violations', async ({ page }) => {
    const shell = new AppShell(page)
    await page.goto('/')
    await shell.openContact()

    expectNoViolations(await analyzeA11y(page))
  })
})

test.describe('accessibility — dark theme', () => {
  /** Contrast is theme-dependent, so the dark palette needs its own scan. */
  test('home page has no detectable violations in dark mode', async ({ page }) => {
    const shell = new AppShell(page)
    await page.goto('/')
    await shell.toggleTheme()
    await expect.poll(() => shell.currentTheme()).toBe('dark')

    expectNoViolations(await analyzeA11y(page))
  })

  test('questionnaire has no detectable violations in dark mode', async ({ page }) => {
    const shell = new AppShell(page)
    await page.goto('/')
    await shell.toggleTheme()
    await expect.poll(() => shell.currentTheme()).toBe('dark')

    await page.goto('/onboarding')
    await expect(page.getByPlaceholder('e.g. Sarah')).toBeVisible()

    expectNoViolations(await analyzeA11y(page))
  })
})

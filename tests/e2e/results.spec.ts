import { test, expect } from './fixtures/test'
import { QuestionnairePage } from './pages/QuestionnairePage'

/**
 * E2E — the results page reached at the end of the questionnaire.
 *
 * The eligibility API is stubbed (see fixtures/test.ts) so the page renders
 * from a known payload every time. These tests are about the page behaving
 * correctly for a given result — the arithmetic behind that result is covered
 * far more thoroughly by the unit suite.
 */

test.describe('results page', () => {
  test('is reached by completing the questionnaire', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()
    await q.completeThroughHistory('Sarah')
    await q.fillIncome()
    await q.submitButton.click()

    await expect(page).toHaveURL(/\/results\/grants/)
    await expect(page.getByRole('main').or(page.locator('body')).first()).toBeVisible()
  })

  test('renders directly when answers already exist', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()
    await q.completeThroughHistory('Marcus')
    await q.fillIncome()
    await q.submitButton.click()
    await expect(page).toHaveURL(/\/results\/grants/)

    // A reload must not send the user back to the questionnaire — the answers
    // are persisted, so the results page can rebuild itself.
    await page.reload()
    await expect(page).toHaveURL(/\/results\/grants/)
  })

  test('requests eligibility from the API', async ({ page }) => {
    /**
     * Armed BEFORE the questionnaire is filled in, so the request cannot be
     * missed — but that means this promise has to stay alive for the whole
     * multi-step fill, not for one action. Without an explicit timeout it
     * inherits `actionTimeout: 15_000` from playwright.config.ts, a budget
     * sized for a single click, and on webkit the fill takes longer than that:
     * the promise rejected while `completeThroughHistory` was still clicking,
     * failing the test before the app had any chance to make the call.
     *
     * 45s is scoped to what this promise actually spans and still sits inside
     * the 60s per-test timeout, so a genuinely missing request still fails.
     */
    const eligibilityCall = page.waitForRequest(
      (r) => r.url().includes('/api/eligibility') && r.method() === 'POST',
      { timeout: 45_000 },
    )

    const q = new QuestionnairePage(page)
    await q.goto()
    await q.completeThroughHistory('Priya')
    await q.fillIncome()
    await q.submitButton.click()

    const payload = JSON.parse((await eligibilityCall).postData() ?? '{}') as Record<string, unknown>
    // The answers collected in the UI reach the engine.
    expect(payload.state).toBe('NSW')
  })

  test('logs no page errors while rendering results', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    const q = new QuestionnairePage(page)
    await q.goto()
    await q.completeThroughHistory('Sarah')
    await q.fillIncome()
    await q.submitButton.click()
    await expect(page).toHaveURL(/\/results\/grants/)

    expect(errors).toEqual([])
  })

  test('stays usable when the eligibility API fails', async ({ page }) => {
    await page.route('**/api/eligibility', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'engine unavailable' }),
      }),
    )

    const q = new QuestionnairePage(page)
    await q.goto()
    await q.completeThroughHistory('Sarah')
    await q.fillIncome()
    await q.submitButton.click()

    // The route still resolves and the shell renders rather than white-screening.
    await expect(page).toHaveURL(/\/results\/grants/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('keeps the feedback widget available on the results page', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()
    await q.completeThroughHistory('Sarah')
    await q.fillIncome()
    await q.submitButton.click()
    await expect(page).toHaveURL(/\/results\/grants/)

    await expect(page.getByRole('button', { name: 'Share feedback' })).toBeVisible()
  })
})
